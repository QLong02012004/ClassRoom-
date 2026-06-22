import { Request, Response, NextFunction } from 'express';
import { createAccountService, loginService, verifyRefreshToken, generateTokens } from '../services/authService';
import { UserModel } from '../models/User';
import { IUser } from '../models/User';
import { ClassModel } from '../models/Class';

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

// [POST] /api/v1/auth/create-teacher
// (Admin dùng)
export const createTeacherAccount = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { name, email, password } = req.body;

        const result = await createAccountService(name, email, password, 'teacher');

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

        res.status(201).json({
            message: 'Tạo tài khoản Học sinh thành công!',
            user: result
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
        res.status(401);
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
                    status: user.status
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
                address: user.address
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