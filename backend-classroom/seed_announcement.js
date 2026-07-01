const mongoose = require('mongoose');
const uri = "mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/?appName=Cluster0";

async function seed() {
    try {
        await mongoose.connect(uri, { dbName: 'test' });
        
        const ClassModel = mongoose.model('Class', new mongoose.Schema({ name: String, teacherId: mongoose.Schema.Types.ObjectId, students: [mongoose.Schema.Types.ObjectId] }, { collection: 'classes' }));
        const UserModel = mongoose.model('User', new mongoose.Schema({ name: String, role: String }, { collection: 'users' }));
        const AnnouncementModel = mongoose.model('Announcement', new mongoose.Schema({
            classId: mongoose.Schema.Types.ObjectId,
            authorId: mongoose.Schema.Types.ObjectId,
            content: String,
            type: String,
            comments: [{ authorId: mongoose.Schema.Types.ObjectId, authorName: String, content: String, createdAt: Date }],
            isPinned: Boolean,
            createdAt: Date
        }, { collection: 'announcements' }));

        const classes = await ClassModel.find();
        if (!classes.length) {
            console.log("No classrooms found.");
            process.exit(1);
        }

        // Delete previous seeded announcements to avoid duplicates
        await AnnouncementModel.deleteMany({ content: /Chào các em, đây là bài thông báo ghim mẫu/ });

        const student = await UserModel.findOne({ role: 'student' });
        if (!student) {
            console.log("No student user found in DB.");
            process.exit(1);
        }

        const teacher = await UserModel.findOne({ role: 'teacher' });

        for (const classroom of classes) {
            let authorId = classroom.teacherId || teacher._id;
            
            const newAnn = new AnnouncementModel({
                classId: classroom._id,
                authorId: authorId,
                content: "Chào các em, đây là bài thông báo ghim mẫu để test tính năng bình luận nhé! Các em xem có thấy rõ không?",
                type: "announcement",
                isPinned: true,
                createdAt: new Date(),
                comments: [
                    {
                        authorId: student._id,
                        authorName: student.name,
                        content: "Dạ em thấy rất rõ ạ, tính năng ghim này tiện quá cô!",
                        createdAt: new Date(Date.now() + 60000)
                    },
                    {
                        authorId: student._id,
                        authorName: student.name,
                        content: "Em sẽ chú ý phần bài ghim này để không lỡ thông báo quan trọng.",
                        createdAt: new Date(Date.now() + 120000)
                    }
                ]
            });

            await newAnn.save();
        }

        console.log("Seeded announcement with student comments successfully for ALL classes.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
seed();
