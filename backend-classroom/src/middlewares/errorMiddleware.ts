import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        message: err.message || 'Đã xảy ra lỗi server không mong muốn!',
        // Chỉ hiển thị chi tiết lỗi (stack) khi đang ở môi trường phát triển (development)
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};