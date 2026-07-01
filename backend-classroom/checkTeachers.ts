import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from './src/models/User';
import { ClassModel } from './src/models/Class';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        const teachers = await UserModel.find({ role: 'teacher' });
        const result = [];
        for (const t of teachers) {
            const classes = await ClassModel.find({ teacherId: t._id });
            if (classes.length > 0) {
                result.push(t.email);
            }
        }
        console.log("Teachers with classes:", result);
        process.exit(0);
    } catch(e) {
        process.exit(1);
    }
}
run();
