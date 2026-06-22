import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { AuthRequest } from '../controllers/authController';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token từ header
            token = req.headers.authorization.split(' ')[1];

            // Giải mã token
            const jwtSecret = (process.env.JWT_SECRET as string) || 'SieuBaoMat2026';
            const decoded = jwt.verify(token as string, jwtSecret) as any;

            // Tìm user dựa vào id trong payload token (loại bỏ password)
            const user = await UserModel.findById(decoded.id).select('-passwordHash');
            if (!user) {
                res.status(401);
                return next(new Error('Người dùng không còn tồn tại!'));
            }

            // Gán thông tin user vào request
            req.user = user;
            next();
        } catch (error) {
            res.status(401);
            return next(new Error('Không có quyền truy cập, token không hợp lệ!'));
        }
    }

    if (!token) {
        res.status(401);
        return next(new Error('Không có quyền truy cập, vui lòng đăng nhập!'));
    }
};

// Middleware kiểm tra quyền (Role-Based Access Control)
export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): any => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403);
            return next(new Error(`Quyền hạn [${req.user?.role}] không được phép thực hiện hành động này!`));
        }
        next();
    };
};
