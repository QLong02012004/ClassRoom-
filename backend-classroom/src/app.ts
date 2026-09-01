/**
 * ============================================================================
 * TÊN FILE: app.ts
 * ĐƯỜNG DẪN: backend-classroom/src/app.ts
 * MỤC ĐÍCH:
 *   Điểm khởi chạy chính (Main Entry Point) của ứng dụng Backend Node.js / Express.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Khởi tạo kết nối MongoDB via `connectDB()`.
 *   - Đăng ký Middleware CORS (cho phép gửi cookie với credentials), `express.json()`, `cookieParser()`.
 *   - Phục vụ tĩnh các tệp tải lên (`/uploads`).
 *   - Định tuyến tập trung API versioning `/api/v1` thông qua `routes/index.ts`.
 *   - Tích hợp máy chủ HTTP và lắng nghe sự kiện WebSockets thời gian thực qua `initSocket(server)`.
 *   - Bắt và xử lý lỗi tập trung qua `errorHandler`.
 * ============================================================================
 */

import path from 'path';
import express, { Request, Response, Application } from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/database';
import apiRouter from './routes'; // Nạp router tổng từ thư mục routes
import { errorHandler } from './middlewares/errorMiddleware';

const app: Application = express();

connectDB();

// 1. CORS — phải nằm trước tất cả middleware khác
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // Cho phép gửi cookie qua CORS
}));

// Serve static uploads with CORS headers & logger
app.use('/uploads', (req, res, next) => {
    console.log(`[Backend File Request] 📁 ${req.method} ${req.originalUrl}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
}, express.static(path.join(process.cwd(), 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// 2. Các Middleware giải mã dữ liệu
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Đọc cookie từ request

// 3. Nạp API Versioning (URL sẽ là /api/v1 + /auth + /register)
app.use('/api/v1', apiRouter);

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: "API v1 đang hoạt động!" });
});

// 4. Middleware xử lý lỗi BẮT BUỘC PHẢI NẰM DƯỚI CÙNG
app.use(errorHandler);

import http from 'http';
import { initSocket } from './socket';

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
