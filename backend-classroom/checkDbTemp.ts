import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from './src/models/User';
import { ScheduleModel } from './src/models/Schedule';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        const teachers = await UserModel.find({ role: 'teacher' });
        console.log("Teachers:", teachers.map((u: any) => ({ id: u._id, email: u.email })));
        const schedules = await ScheduleModel.find();
        console.log("Schedules:", schedules);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
