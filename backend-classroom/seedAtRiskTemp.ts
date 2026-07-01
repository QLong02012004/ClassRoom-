import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from './src/models/User';
import { ClassModel } from './src/models/Class';
import { AttendanceModel } from './src/models/Attendance';
import { GradeModel } from './src/models/Grade';
import { AssignmentModel } from './src/models/Assignment';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        
        // Find a teacher
        const teacher = await UserModel.findOne({ role: 'teacher' });
        if (!teacher) {
            console.log("No teacher found");
            return;
        }

        // Find a class for this teacher
        const cls = await ClassModel.findOne({ teacherId: teacher._id });
        if (!cls || !cls.students || cls.students.length === 0) {
            console.log("No classes with students found for this teacher");
            return;
        }

        const studentIds = cls.students;
        
        // 1. Create bad attendance for first student (absent > 20%)
        const s1 = studentIds[0];
        // Create 5 attendances, 2 absent
        for(let i=0; i<5; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            if (s1) {
                await AttendanceModel.create({
                    classId: cls._id,
                    date: date,
                    records: [
                        {
                            studentId: s1,
                            status: i < 2 ? 'absent' : 'present'
                        }
                    ]
                });
            }
        }
        console.log("Created bad attendance for student 1");

        // 2. Create bad grades for second student (avg < 5.0)
        if (studentIds.length > 1) {
            const s2 = studentIds[1];
            // Create an assignment
            const assignment = await AssignmentModel.create({
                classId: cls._id,
                title: 'Bài tập Test At-Risk',
                description: 'Test',
                dueDate: new Date()
            });

            if (s2) {
                await GradeModel.create({
                    assignmentId: assignment._id,
                    studentId: s2,
                    score: 4.5,
                    feedback: 'Cần cố gắng hơn'
                });
                console.log("Created bad grade for student 2");
            }
        }

        console.log("Done seeding at-risk data!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
