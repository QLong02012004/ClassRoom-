/**
 * ============================================================================
 * TÊN FILE: errorMiddleware.ts
 * ĐƯỜNG DẪN: backend-classroom/src/middlewares/errorMiddleware.ts
 * MỤC ĐÍCH:
 *   Middleware Xử lý Lỗi Tập trung (Global Error Handler) cho toàn bộ ứng dụng Express.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Bắt các lỗi phát sinh từ Async Controller via `next(error)`.
 *   - Chuẩn hóa HTTP Status Code (mặc định 500 nếu chưa set status).
 *   - Trả về JSON chứa thông điệp lỗi (`message`) và ẩn `stack trace` khi chạy môi trường Production.
 * ============================================================================
 */

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