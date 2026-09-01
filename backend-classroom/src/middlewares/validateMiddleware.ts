/**
 * ============================================================================
 * TÊN FILE: validateMiddleware.ts
 * ĐƯỜNG DẪN: backend-classroom/src/middlewares/validateMiddleware.ts
 * MỤC ĐÍCH:
 *   Cung cấp các Middleware kiểm tra và xác thực dữ liệu đầu vào (Input Validation) khi Đăng ký & Đăng nhập.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `validateRegister`: Kiểm tra sự tồn tại của Họ tên/Email/Mật khẩu, xác thực Regex định dạng Email và quy tắc Mật khẩu mạnh (ít nhất 8 ký tự, 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt).
 *   - `validateLogin`: Kiểm tra tính hợp lệ của Email & Password trước khi chuyển cho authController.
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction): any => {
    const { name, email, password } = req.body;

    // Kiểm tra thủ công các trường bắt buộc
    if (!name || !email || !password) {
        res.status(400);
        return next(new Error('Vui lòng điền đầy đủ các trường thông tin: name, email, password!'));
    }

    // Kiểm tra độ mạnh của mật khẩu
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,}$/;
    if (!passwordRegex.test(password)) {
        res.status(400);
        return next(new Error('Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt!'));
    }

    // Kiểm tra định dạng email cơ bản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400);
        return next(new Error('Định dạng email không hợp lệ!'));
    }

    // Nếu dữ liệu hợp lệ, cho phép chuyển tiếp sang Controller
    next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): any => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        return next(new Error('Vui lòng nhập đầy đủ email và mật khẩu!'));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400);
        return next(new Error('Định dạng email không hợp lệ!'));
    }

    next();
};