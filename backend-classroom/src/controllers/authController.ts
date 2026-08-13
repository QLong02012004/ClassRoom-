import { Request, Response, NextFunction } from 'express';
import { createAccountService, registerTeacherService, loginService, verifyRefreshToken, generateTokens, googleAuthService } from '../services/authService';
import { generateOTP, sendVerificationEmail } from '../services/emailService';
import { UserModel } from '../models/User';
import { IUser } from '../models/User';
import { ClassModel } from '../models/Class';
import { notifyAdminStatsUpdate } from '../socket';

export interface AuthRequest extends Request {
    user?: any;
}

// Cấu hình cookie cho refresh token (HTTP-only, secure trong production)
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,  // JS không thể đọc → chống XSS
    secure: process.env.NODE_ENV === 'production', // HTTPS only trong production
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày (ms)
    path: '/',
};

// [POST] /api/v1/auth/register-teacher
// (Giáo viên tự đăng ký -> Trạng thái Pending)
export const registerTeacherAccount = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { name, email, password, subject, phone } = req.body;

        const result = await registerTeacherService(name, email, password, subject, phone);
        notifyAdminStatsUpdate();

        res.status(201).json({
            message: 'Đăng ký tài khoản Giáo viên thành công! Vui lòng chờ BGH phê duyệt trước khi đăng nhập.',
            user: result
        });
    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/auth/create-teacher
// (Admin dùng -> Trực tiếp Active)
export const createTeacherAccount = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { name, email, password, subject } = req.body;

        const result = await createAccountService(name, email, password, 'teacher', undefined, subject);
        notifyAdminStatsUpdate();

        res.status(201).json({
            message: 'Tạo tài khoản Giáo viên thành công!',
            user: result
        });
    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/auth/create-student
// (Teacher dùng)
export const createStudentAccount = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { name, email, password, parentPhone, classId } = req.body;

        if (!classId) {
            res.status(400);
            return next(new Error('Vui lòng chọn lớp học (classId) cho học sinh!'));
        }

        const result = await createAccountService(name, email, password, 'student', parentPhone);

        await ClassModel.findByIdAndUpdate(classId, {
            $addToSet: { students: result.id }
        });
        notifyAdminStatsUpdate();

        res.status(201).json({
            message: 'Tạo tài khoản Học sinh thành công!',
            user: result
        });
    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/auth/register-student
// (Học sinh tự đăng ký)
export const registerStudentAccount = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { name, email, password, parentPhone } = req.body;

        // Chờ xác thực email -> Pending
        const result = await createAccountService(name, email, password, 'student', parentPhone, undefined, 'Pending', false);

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        result.emailVerificationOTP = otp;
        result.emailVerificationExpires = otpExpires;
        await result.save();

        console.log(`[REGISTER OTP] Student ${result.email} OTP is: ${otp}`);
        sendVerificationEmail(result.email, otp).catch(e => console.error("Lỗi gửi email:", e));

        res.status(201).json({
            message: 'Đăng ký tài khoản thành công! Vui lòng kiểm tra email để nhận mã OTP xác thực.',
            user: {
                id: result._id,
                email: result.email
            }
        });
    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/auth/verify-email
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            res.status(400);
            return next(new Error('Vui lòng cung cấp email và mã OTP!'));
        }

        const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            res.status(404);
            return next(new Error('Tài khoản không tồn tại!'));
        }

        if (user.isEmailVerified) {
            res.status(400);
            return next(new Error('Tài khoản đã được xác thực email từ trước!'));
        }

        if (user.emailVerificationOTP !== otp) {
            res.status(400);
            return next(new Error('Mã OTP không chính xác!'));
        }

        if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
            res.status(400);
            return next(new Error('Mã OTP đã hết hạn, vui lòng yêu cầu gửi lại mã mới!'));
        }

        user.isEmailVerified = true;
        user.emailVerificationOTP = undefined as any;
        user.emailVerificationExpires = undefined as any;

        if (user.role === 'teacher') {
            user.status = 'Pending' as any;
            try {
                const NotificationModel = require('../models/Notification').NotificationModel;
                const { UserRole, NotificationType } = require('../constants/enums');
                await NotificationModel.create({
                    recipientRole: UserRole.ADMIN,
                    sender: user._id,
                    title: 'Yêu cầu Duyệt Giáo viên mới ⏳',
                    message: `Giáo viên ${user.name} (${user.email}) vừa xác thực Email thành công và đang chờ duyệt!`,
                    type: NotificationType.CLASSROOM
                });
                notifyAdminStatsUpdate();
            } catch (e) {
                console.error("Lỗi tạo thông báo Admin cho Giáo viên mới:", e);
            }
        } else if (user.role === 'student') {
            user.status = 'Active' as any;
            notifyAdminStatsUpdate();
        }

        await user.save();

        res.status(200).json({
            message: 'Xác thực email thành công! ' + (user.role === 'teacher' ? 'Vui lòng chờ Ban giám hiệu phê duyệt.' : 'Bạn có thể đăng nhập ngay bây giờ.')
        });

    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/auth/resend-otp
export const resendOTP = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400);
            return next(new Error('Vui lòng cung cấp email!'));
        }

        const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            res.status(404);
            return next(new Error('Tài khoản không tồn tại!'));
        }

        if (user.isEmailVerified) {
            res.status(400);
            return next(new Error('Tài khoản đã được xác thực từ trước!'));
        }

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.emailVerificationOTP = otp;
        user.emailVerificationExpires = otpExpires;
        await user.save();

        console.log(`[RESEND OTP] Sending new OTP ${otp} to ${user.email}`);
        await sendVerificationEmail(user.email, otp);

        res.status(200).json({
            message: 'Mã OTP mới đã được gửi tới email của bạn!'
        });

    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/auth/login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email, password } = req.body;

        const result = await loginService(email, password);

        // Kiểm tra Chế độ Bảo trì (Maintenance Mode)
        const SystemSettingsModel = require('../models/SystemSettings').SystemSettingsModel;
        const settings = await SystemSettingsModel.findOne();
        if (settings?.maintenanceMode && result.user.role !== 'admin') {
            res.status(503);
            return next(new Error('Hệ thống đang trong chế độ bảo trì. Vui lòng quay lại sau!'));
        }

        // Set refresh token vào HTTP-only cookie (không thể đọc bằng JS)
        res.cookie('refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(200).json({
            message: 'Đăng nhập thành công!',
            data: {
                user: result.user,
                accessToken: result.accessToken  // Trả access token cho client lưu
            }
        });
    } catch (error) {
        if (res.statusCode !== 503) res.status(401);
        next(error);
    }
};

// [POST] /api/v1/auth/refresh-token
// Không cần protect — dùng refresh token cookie để cấp access token mới
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const token = req.cookies?.refresh_token;

        if (!token) {
            res.status(401);
            return next(new Error('Không tìm thấy refresh token, vui lòng đăng nhập lại!'));
        }

        // Xác minh refresh token
        const decoded = verifyRefreshToken(token);

        // Tìm user còn tồn tại không
        const user = await UserModel.findById(decoded.id).select('-passwordHash');
        if (!user) {
            res.clearCookie('refresh_token', { path: '/' });
            res.status(401);
            return next(new Error('Người dùng không còn tồn tại!'));
        }

        // Tạo cặp token mới (Refresh Token Rotation — bảo mật hơn)
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(String(user._id), user.role);

        // Cập nhật cookie với refresh token mới
        res.cookie('refresh_token', newRefreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(200).json({
            message: 'Làm mới token thành công!',
            data: {
                accessToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    subject: user.subject,
                    bio: user.bio,
                    degree: user.degree,
                    isGoogleAccount: user.isGoogleAccount
                }
            }
        });
    } catch (error) {
        // Token hết hạn hoặc không hợp lệ → xóa cookie + yêu cầu đăng nhập lại
        res.clearCookie('refresh_token', { path: '/' });
        res.status(401);
        next(new Error('Refresh token không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại!'));
    }
};

// [GET] /api/v1/auth/me
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        // req.user được gán từ authMiddleware
        const user = req.user;
        if (!user) {
            res.status(401);
            return next(new Error('Không tìm thấy thông tin người dùng!'));
        }

        res.status(200).json({
            message: 'Lấy thông tin người dùng thành công!',
            data: {
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
            }
        });
    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/auth/logout
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        // Xóa refresh token cookie
        res.clearCookie('refresh_token', { path: '/' });

        res.status(200).json({
            message: 'Đăng xuất thành công!'
        });
    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/auth/google-login
export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { credential, role, subject } = req.body;

        const result = await googleAuthService(credential, role, subject);

        // Nếu là Giáo viên đăng ký mới -> Trạng thái Pending
        if ((result as any).isPending) {
            notifyAdminStatsUpdate();
            return res.status(201).json({
                message: (result as any).message,
                isPending: true
            });
        }

        // Lưu refresh token vào HTTP-only cookie nếu thành công
        if ((result as any).refreshToken) {
            res.cookie('refresh_token', (result as any).refreshToken, REFRESH_COOKIE_OPTIONS);
        }

        notifyAdminStatsUpdate();

        res.status(200).json({
            message: 'Đăng nhập bằng Google thành công!',
            data: {
                accessToken: (result as any).accessToken,
                user: (result as any).user
            }
        });
    } catch (error) {
        next(error);
    }
};