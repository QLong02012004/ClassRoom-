import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
    await mongoose.connect(process.env.MONGO_URI as string);
    const db = mongoose.connection.db!;
    
    // Add status='open' to all quizzes that don't have a status field
    const result = await db.collection('quizzes').updateMany(
        { status: { $exists: false } },
        { $set: { status: 'open' } }
    );
    console.log(`Updated ${result.modifiedCount} quizzes with status='open'`);
    
    // Verify
    const quizzes = await db.collection('quizzes').find({}).project({ title: 1, status: 1 }).toArray();
    console.log('Current quizzes:', JSON.stringify(quizzes, null, 2));
    
    await mongoose.disconnect();
}

migrate().catch(console.error);
