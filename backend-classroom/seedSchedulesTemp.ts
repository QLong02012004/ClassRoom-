import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from './src/models/User';
import { ClassModel } from './src/models/Class';
import { ScheduleModel } from './src/models/Schedule';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Đã kết nối tới Database');

        const teachers = await UserModel.find({ role: 'teacher' });
        if (teachers.length === 0) {
            console.error('Không tìm thấy teacher nào!');
            process.exit(1);
        }

        const currentJSday = new Date().getDay();
        const todayDayOfWeek = currentJSday === 0 ? 7 : currentJSday;
        const tomorrowDayOfWeek = todayDayOfWeek === 7 ? 1 : todayDayOfWeek + 1;

        const schedules = [];

        for (const teacher of teachers) {
            const classes = await ClassModel.find({ teacherId: teacher._id });
            if (classes.length === 0) continue;

            await ScheduleModel.deleteMany({ teacherId: teacher._id });

            // Schedule 1: Today morning
            if (classes[0]) {
                schedules.push({
                    classId: classes[0]._id,
                    teacherId: teacher._id,
                    subject: classes[0].subject || 'Toán học',
                    chapter: 'Chương 1',
                    dayOfWeek: todayDayOfWeek,
                    startTime: '07:30',
                    endTime: '09:00',
                    progress: 50
                });
            }

            // Schedule 2: Today afternoon
            if (classes[1]) {
                schedules.push({
                    classId: classes[1]._id,
                    teacherId: teacher._id,
                    subject: classes[1].subject || 'Vật lý',
                    chapter: 'Động lực học',
                    dayOfWeek: todayDayOfWeek,
                    startTime: '13:30',
                    endTime: '15:00',
                    progress: 30
                });
            }

            // Schedule 3: Today evening
            if (classes[2]) {
                schedules.push({
                    classId: classes[2]._id,
                    teacherId: teacher._id,
                    subject: classes[2].subject || 'Hóa học',
                    chapter: 'Oxi - Lưu huỳnh',
                    dayOfWeek: todayDayOfWeek,
                    startTime: '18:00',
                    endTime: '20:30',
                    progress: 0
                });
            }

            // Schedule 4: Tomorrow morning
            if (classes[3]) {
                schedules.push({
                    classId: classes[3]._id,
                    teacherId: teacher._id,
                    subject: classes[3].subject || 'Ngữ Văn',
                    chapter: 'Vợ nhặt',
                    dayOfWeek: tomorrowDayOfWeek,
                    startTime: '08:15',
                    endTime: '10:45',
                    progress: 10
                });
            }

            // Schedule 5: Tomorrow afternoon
            if (classes[4]) {
                schedules.push({
                    classId: classes[4]._id,
                    teacherId: teacher._id,
                    subject: classes[4].subject || 'Tiếng Anh',
                    chapter: 'Unit 2: Cultural Diversity',
                    dayOfWeek: tomorrowDayOfWeek,
                    startTime: '14:00',
                    endTime: '16:00',
                    progress: 60
                });
            }
        }

        await ScheduleModel.insertMany(schedules);
        console.log('✅ Đã seed dữ liệu Schedule ảo thành công!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
