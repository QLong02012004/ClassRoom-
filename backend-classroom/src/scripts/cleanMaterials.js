const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true';

async function cleanMaterials() {
  console.log('🔌 Đang kết nối MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Kết nối MongoDB thành công!\n');

  const db = mongoose.connection;
  const materials = await db.collection('materials').find({}).toArray();
  console.log(`Tìm thấy ${materials.length} tài liệu trong cơ sở dữ liệu:`);
  materials.forEach(m => console.log(` - [${m._id}] ${m.title} (${m.type}, ${m.subject || 'N/A'})`));

  // Xóa toàn bộ tài liệu mẫu trong collection materials
  const result = await db.collection('materials').deleteMany({});
  console.log(`\n🗑️  Đã xóa thành công ${result.deletedCount} tài liệu mẫu khỏi database!`);

  await mongoose.disconnect();
  console.log('🔌 Đã ngắt kết nối MongoDB.');
}

cleanMaterials().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
