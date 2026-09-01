
/**
 * ============================================================================
 * TÊN FILE: cleanAbsolute.ts
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/cleanAbsolute.ts
 * MỤC ĐÍCH:
 *   Script dọn dẹp sạch hoàn toàn (100% Reset Database) loại bỏ tất cả collections trong MongoDB.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Xóa sạch dữ liệu trong các bảng Announcement, ClassActivity, BankItem, Attendance, Class, Grade, QuizResult, Schedule, Submission, User.
 * ============================================================================
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { ClassModel } from '../models/Class';
import { AttendanceModel } from '../models/Attendance';
import { ClassActivityModel } from '../models/ClassActivity';
import { BankItemModel } from '../models/BankItem';
import { AnnouncementModel } from '../models/Announcement';
import { GradeModel } from '../models/Grade';
import { ScheduleModel } from '../models/Schedule';
import { SubmissionModel } from '../models/Submission';
import { QuizResultModel } from '../models/QuizResult';

dotenv.config();

const cleanAbsolute = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Đã kết nối tới Database để xóa sạch tuyệt đối');

        await AnnouncementModel.deleteMany({});
        await ClassActivityModel.deleteMany({});
        await BankItemModel.deleteMany({});
        await AttendanceModel.deleteMany({});
        await ClassModel.deleteMany({});
        await GradeModel.deleteMany({});
        await QuizResultModel.deleteMany({});
        await ScheduleModel.deleteMany({});
        await SubmissionModel.deleteMany({});
        await UserModel.deleteMany({});

        console.log('🎉 Đã xóa sạch 100% dữ liệu ở tất cả các bảng bao gồm cả User và Class!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi xóa sạch dữ liệu:', error);
        process.exit(1);
    }
};

cleanAbsolute();
