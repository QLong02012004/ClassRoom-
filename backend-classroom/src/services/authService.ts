import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'SieuBaoMat2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'SieuBaoMatRefresh2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';       // Access token ngắn hạn
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Refresh token dài hạn

export const createAccountService = async (name: string, email: string, password: string, role: 'admin' | 'teacher' | 'student', parentPhone?: string) => {
    // 1. Logic kiểm tra trùng email
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
        throw new Error('Email này đã được đăng ký hệ thống!');
    }

    // 2. Logic mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Logic tương tác với database để tạo mới
    const newUser = await UserModel.create({
        name,
        email,
        passwordHash,
        role,
        parentPhone: parentPhone || ''
    });

    return {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        parentPhone: newUser.parentPhone
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

    // Kiểm tra xem tài khoản có bị khóa không
    if (user.status === 'Locked') {
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
            address: user.address
        },
        accessToken,
        refreshToken
    };
};