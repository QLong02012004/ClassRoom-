import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from './src/models/User';
import { ClassModel } from './src/models/Class';
import { AssignmentModel } from './src/models/Assignment';
import { SubmissionModel } from './src/models/Submission';
import { GradeModel } from './src/models/Grade';
import { AttendanceModel } from './src/models/Attendance';
import { NotificationModel } from './src/models/Notification';
import bcrypt from 'bcrypt';

dotenv.config();

const seedFullData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');

        // Tạo mật khẩu băm chuẩn
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('123456', salt);

        // Create some teachers if not enough
        let teachers = await UserModel.find({ role: 'teacher' });
        if (teachers.length < 3) {
            console.log('Creating mock teachers...');
            const newTeachers = await UserModel.insertMany([
                { name: 'Nguyễn Văn A', email: 'gv.nguyenvana@school.edu.vn', passwordHash, role: 'teacher', status: 'Active' },
                { name: 'Trần Thị B', email: 'gv.tranthib@school.edu.vn', passwordHash, role: 'teacher', status: 'Active' },
                { name: 'Lê Văn C', email: 'gv.levanc@school.edu.vn', passwordHash, role: 'teacher', status: 'Active' }
            ]);
            teachers = [...teachers, ...newTeachers];
        }

        // Create some students if not enough
        let students = await UserModel.find({ role: 'student' });
        if (students.length < 10) {
            console.log('Creating mock students...');
            const newStudents = await UserModel.insertMany(
                Array.from({ length: 15 }).map((_, i) => ({
                    name: `Học sinh ${i + 1}`,
                    email: `hs${i + 1}@school.edu.vn`,
                    passwordHash,
                    role: 'student',
                    status: 'Active'
                }))
            );
            students = [...students, ...newStudents];
        }

        const studentIds = students.map(s => s._id);

        console.log('Clearing old classes, assignments, grades, etc...');
        await ClassModel.deleteMany({});
        await AssignmentModel.deleteMany({});
        await SubmissionModel.deleteMany({});
        await GradeModel.deleteMany({});
        await AttendanceModel.deleteMany({});
        await NotificationModel.deleteMany({});

        console.log('Creating classes...');
        const classes = await ClassModel.insertMany([
            { name: 'Toán Đại Số 10A1', code: 'MATH10', teacherId: teachers[0]!._id, students: studentIds.slice(0, 8), status: 'Active', subject: 'Toán Học' },
            { name: 'Toán Hình Học 10A1', code: 'GEO10', teacherId: teachers[0]!._id, students: studentIds.slice(0, 8), status: 'Active', subject: 'Toán Học' },
            { name: 'Ngữ Văn 11B1', code: 'LIT11', teacherId: teachers[1]!._id, students: studentIds.slice(4, 12), status: 'Active', subject: 'Ngữ Văn' },
            { name: 'Ngữ Văn 11B2', code: 'LIT11B2', teacherId: teachers[1]!._id, students: studentIds.slice(2, 10), status: 'Active', subject: 'Ngữ Văn' },
            { name: 'Vật Lý 12C1', code: 'PHY12', teacherId: teachers[2]!._id, students: studentIds, status: 'Active', subject: 'Vật Lý' }
        ]);

        console.log('Creating assignments...');
        const assignments = await AssignmentModel.insertMany([
            { title: 'Bài tập Đại số chương 1', description: 'Giải các phương trình', classId: classes[0]!._id, dueDate: new Date(Date.now() + 86400000) },
            { title: 'Kiểm tra 15p Toán', description: 'Trắc nghiệm online', classId: classes[0]!._id, dueDate: new Date() },
            { title: 'Phân tích Chí Phèo', description: 'Viết bài luận', classId: classes[2]!._id, dueDate: new Date(Date.now() + 86400000 * 3) },
            { title: 'Bài tập Động học chất điểm', description: 'Giải toán Vật Lý', classId: classes[4]!._id, dueDate: new Date(Date.now() - 86400000) }
        ]);

        console.log('Creating submissions and grades...');
        for (let i = 0; i < assignments.length; i++) {
            const assignment = assignments[i];
            if (!assignment) continue;
            const cls = classes.find(c => c._id.toString() === assignment.classId.toString());
            if (cls) {
                // Have some students submit
                const submitters = cls.students.slice(0, Math.floor(cls.students.length * 0.8));
                for (const stId of submitters) {
                    await SubmissionModel.create({
                        assignmentId: assignment._id,
                        studentId: stId,
                        submissionText: 'Em nộp bài ạ',
                        status: 'submitted',
                        attachments: []
                    });

                    // Grade 80% of submissions
                    if (Math.random() > 0.2) {
                        // Generate random score between 5 and 10
                        const score = Math.floor(Math.random() * 6) + 5;
                        await GradeModel.create({
                            assignmentId: assignment._id,
                            studentId: stId,
                            score,
                            feedback: 'Làm tốt'
                        });
                    }
                }
            }
        }

        console.log('Creating attendances...');
        for (const cls of classes) {
            await AttendanceModel.create({
                classId: cls._id,
                date: new Date(),
                records: cls.students.map((stId, idx) => ({
                    studentId: stId,
                    status: idx % 10 === 0 ? 'absent' : 'present'
                }))
            });
        }

        console.log('Creating notifications...');
        await NotificationModel.insertMany([
            {
                title: 'Bảo trì hệ thống',
                sender: teachers[0]!._id,
                recipientRole: 'admin',
                type: 'announcement',
                message: 'Hệ thống đã hoàn tất sao lưu dữ liệu ngày hôm nay.',
                createdAt: new Date(Date.now() - 3600000)
            },
            {
                title: 'Lớp học mới',
                sender: teachers[1]!._id,
                recipientRole: 'admin',
                type: 'classroom',
                message: 'Giáo viên Trần Thị B đã tạo lớp học Ngữ Văn 11B1',
                createdAt: new Date(Date.now() - 7200000)
            },
            {
                title: 'Lớp học mới',
                sender: teachers[2]!._id,
                recipientRole: 'admin',
                type: 'classroom',
                message: 'Giáo viên Lê Văn C đã tạo lớp học Vật Lý 12C1',
                createdAt: new Date(Date.now() - 86400000)
            }
        ]);

        console.log('Data seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedFullData();
