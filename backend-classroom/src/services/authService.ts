import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { NotificationModel } from '../models/Notification';
import { UserRole, UserStatus, NotificationType } from '../constants/enums';
import { notifyAdminStatsUpdate } from '../socket';
import { generateOTP, sendVerificationEmail } from './emailService';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "374440336134-v4gcigg4nl0uqmg492htjrg7jf6240ie.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'SieuBaoMat2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'SieuBaoMatRefresh2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';       // Access token ngắn hạn
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Refresh token dài hạn

// Regex kiểm tra tên email chuẩn RFC & TLD tên miền thật
const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

// Danh sách các nhà cung cấp Email phổ biến & tên miền giáo dục/doanh nghiệp chuẩn
const ALLOWED_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
    'edu.vn', 'school.edu.vn', 'classroom.com', 'student.edu.vn', 'teacher.edu.vn'
];

export const createAccountService = async (
    name: string,
    email: string,
    password: string,
    role: UserRole | 'admin' | 'teacher' | 'student',
    parentPhone?: string,
    subject?: string,
    initialStatus: UserStatus | 'Active' | 'Pending' | 'Locked' = UserStatus.ACTIVE,
    isEmailVerified: boolean = true
) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 0. Kiểm tra cú pháp Email chuẩn
    if (!cleanEmail || !STRICT_EMAIL_REGEX.test(cleanEmail)) {
        throw new Error('Địa chỉ Email không đúng định dạng cú pháp chuẩn (ví dụ: user@gmail.com)!');
    }

    // Tách phần domain để kiểm tra
    const domain = cleanEmail.split('@')[1] || '';

    // Kiểm tra thêm: Tên miền không được chứa số đứng đầu hoặc chuỗi ngẫu nhiên kỳ dị dài quá 15 ký tự nếu không thuộc tên miền phổ biến
    const isStandardDomain = ALLOWED_EMAIL_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
    const hasSuspiciousDomain = /[0-9]{4,}/.test(domain) || domain.length > 25;

    if (!isStandardDomain && hasSuspiciousDomain) {
        throw new Error('Tên miền Email không hợp lệ hoặc nghi ngờ Email rác!');
    }

    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await UserModel.findOne({ email: cleanEmail });
    if (existingUser) {
        if (existingUser.isEmailVerified === false) {
            // Nếu tài khoản cũ chưa từng xác thực email -> Xóa bản ghi rác này để cho phép người dùng đăng ký mới lại!
            await UserModel.deleteOne({ _id: existingUser._id });
        } else {
            throw new Error('Email này đã được đăng ký sử dụng trên hệ thống!');
        }
    }

    // 2. Hash mật khẩu bằng bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Tạo tài khoản mới
    const newUser = await UserModel.create({
        name,
        email: cleanEmail,
        passwordHash,
        role: role as UserRole,
        status: initialStatus as UserStatus,
        parentPhone: parentPhone || '',
        subject: subject || '',
        isEmailVerified
    });

    return newUser;
};

export const registerTeacherService = async (
    name: string,
    email: string,
    password: string,
    subject?: string,
    phone?: string
) => {
    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const newTeacher = await createAccountService(
        name,
        email,
        password,
        UserRole.TEACHER,
        phone,
        subject,
        UserStatus.PENDING,
        false
    );

    newTeacher.emailVerificationOTP = otp;
    newTeacher.emailVerificationExpires = otpExpires;
    await newTeacher.save();

    console.log(`[REGISTER OTP] Teacher ${newTeacher.email} OTP is: ${otp}`);

    // Gửi email OTP (chạy background không block)
    sendVerificationEmail(newTeacher.email, otp).catch(e => console.error("Lỗi gửi email:", e));

    // Note: Thông báo cho Admin sẽ được gửi SAU KHI giáo viên xác thực Email thành công.

    return {
        message: 'Đăng ký tài khoản Giáo viên thành công! Vui lòng kiểm tra email để nhận mã OTP xác thực.',
        user: {
            id: newTeacher._id,
            email: newTeacher.email
        }
    };
};

// Tạo cặp access token + refresh token
export const generateTokens = (userId: string, role: string) => {
    const accessToken = jwt.sign(
        { id: userId, role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
        { id: userId },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN as any }
    );

    return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string };
};

// Xác minh refresh token và trả về payload
export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { id: string };
};

export const loginService = async (email: string, password: string) => {
    // 1. Kiểm tra email có tồn tại không
    const user = await UserModel.findOne({ email });
    if (!user) {
        throw new Error('Email hoặc mật khẩu không chính xác!');
    }

    // 1.5. Kiểm tra xem email đã được xác thực chưa
    if (user.isEmailVerified === false) {
        throw new Error('Tài khoản của bạn chưa được xác thực Email. Vui lòng kiểm tra hộp thư để nhận mã OTP xác thực!');
    }

    // Kiểm tra xem tài khoản có đang chờ duyệt không
    if (user.status === UserStatus.PENDING) {
        throw new Error('Tài khoản của bạn đang chờ Ban giám hiệu phê duyệt. Vui lòng liên hệ Admin!');
    }

    // Kiểm tra xem tài khoản có bị khóa không
    if (user.status === UserStatus.LOCKED) {
        throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!');
    }

    // 2. Kiểm tra mật khẩu có khớp không
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        throw new Error('Email hoặc mật khẩu không chính xác!');
    }

    // 3. Tạo cặp JWT Token
    const { accessToken, refreshToken } = generateTokens(String(user._id), user.role);

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            avatar: user.avatar,
            dob: user.dob,
            gender: user.gender,
            phone: user.phone,
            address: user.address,
            subject: user.subject,
            bio: user.bio,
            degree: user.degree,
            isGoogleAccount: user.isGoogleAccount
        },
        accessToken,
        refreshToken
    };
};

export const googleAuthService = async (
    credential: string,
    requestedRole?: 'teacher' | 'student',
    requestedSubject?: string
) => {
    if (!credential) {
        throw new Error('Google OAuth Token không hợp lệ!');
    }

    let payload: any = null;

    try {
        // Xác thực JWT Token từ Google một cách an toàn bằng Google Auth Library
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch (e) {
        console.error("Lỗi xác thực token Google:", e);
        throw new Error('Xác thực Google thất bại: Token không hợp lệ hoặc đã hết hạn!');
    }

    if (!payload || !payload.email) {
        throw new Error('Xác thực Google thất bại: Không tìm thấy thông tin Email!');
    }

    const email = payload.email.trim().toLowerCase();
    const name = payload.name || payload.email.split('@')[0];
    const avatar = payload.picture || '';

    // 1. Kiểm tra xem User đã tồn tại trong DB chưa
    let user = await UserModel.findOne({ email });

    if (user) {
        // Kiểm tra trạng thái nếu user đã tồn tại
        if (user.status === UserStatus.PENDING) {
            throw new Error('Tài khoản của bạn đang chờ Ban giám hiệu phê duyệt. Vui lòng liên hệ Admin!');
        }
        if (user.status === UserStatus.LOCKED) {
            throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!');
        }

        // Cập nhật avatar và cờ Google nếu chưa có
        let isUpdated = false;
        if (!user.avatar && avatar) {
            user.avatar = avatar;
            isUpdated = true;
        }
        if (!user.isGoogleAccount) {
            user.isGoogleAccount = true;
            isUpdated = true;
        }
        if (!user.isEmailVerified) {
            user.isEmailVerified = true;
            isUpdated = true;
        }
        if (isUpdated) {
            await user.save();
        }

        const { accessToken, refreshToken } = generateTokens(String(user._id), user.role);

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                avatar: user.avatar,
                subject: user.subject,
                bio: user.bio,
                degree: user.degree,
                isGoogleAccount: user.isGoogleAccount
            },
            accessToken,
            refreshToken
        };
    }

    // 2. Nếu User chưa tồn tại -> Tự động đăng ký mới bằng Email Google thật
    const targetRole = requestedRole === 'teacher' ? UserRole.TEACHER : UserRole.STUDENT;
    const initialStatus = targetRole === UserRole.TEACHER ? UserStatus.PENDING : UserStatus.ACTIVE;
    const randomPassword = Math.random().toString(36).slice(-10) + 'Gg@2026';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    const newUser: any = await UserModel.create({
        name,
        email,
        passwordHash,
        role: targetRole,
        status: initialStatus,
        avatar,
        subject: requestedSubject || '',
        isGoogleAccount: true,
        isEmailVerified: true
    });

    if (initialStatus === UserStatus.PENDING) {
        try {
            await NotificationModel.create({
                recipientRole: UserRole.ADMIN,
                sender: newUser._id,
                title: 'Yêu cầu Duyệt Giáo viên mới ⏳',
                message: `Giáo viên ${newUser.name} (${newUser.email}) vừa đăng ký qua Google và đang chờ Ban giám hiệu phê duyệt!`,
                type: NotificationType.CLASSROOM
            });
            notifyAdminStatsUpdate();
        } catch (e) {
            console.error("Lỗi tạo thông báo Admin cho Giáo viên mới Google:", e);
        }

        return {
            isPending: true,
            message: 'Đăng ký tài khoản Giáo viên bằng Google thành công! Vui lòng chờ Ban giám hiệu phê duyệt.'
        };
    }

    const { accessToken, refreshToken } = generateTokens(String(newUser._id), newUser.role);

    return {
        user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
            avatar: newUser.avatar,
            subject: newUser.subject,
            bio: newUser.bio,
            degree: newUser.degree,
            isGoogleAccount: newUser.isGoogleAccount
        },
        accessToken,
        refreshToken
    };
};
