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