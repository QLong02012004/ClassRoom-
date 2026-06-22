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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});