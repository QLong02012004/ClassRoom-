const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

(async () => {
  try {
    await mongoose.connect('mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true');
    const salt = await bcrypt.genSalt(10);
    const hash123456 = await bcrypt.hash('123456', salt);

    // Upsert student@gmail.com
    await mongoose.connection.collection('users').updateOne(
      { email: 'student@gmail.com' },
      {
        $set: {
          name: 'Học Sinh Mẫu',
          email: 'student@gmail.com',
          passwordHash: hash123456,
          role: 'student',
          status: 'Active',
          isEmailVerified: true,
          dob: '2007-01-15',
          gender: 'Nam',
          phone: '0905123456',
          bio: 'Em là học sinh chăm ngoan học giỏi.'
        }
      },
      { upsert: true }
    );
    console.log('✅ Updated student@gmail.com with password 123456, status: Active, verified: true');

    // Upsert teacher@gmail.com
    await mongoose.connection.collection('users').updateOne(
      { email: 'teacher@gmail.com' },
      {
        $set: {
          name: 'Thầy Giáo Mẫu',
          email: 'teacher@gmail.com',
          passwordHash: hash123456,
          role: 'teacher',
          status: 'Active',
          isEmailVerified: true,
          subject: 'Toán học',
          phone: '0905999888'
        }
      },
      { upsert: true }
    );
    // Upsert admin@gmail.com
    const hashAdmin123 = await bcrypt.hash('admin123', salt);
    await mongoose.connection.collection('users').updateOne(
      { email: 'admin@gmail.com' },
      {
        $set: {
          name: 'Quản Trị Viên Hệ Thống',
          email: 'admin@gmail.com',
          passwordHash: hashAdmin123,
          role: 'admin',
          status: 'Active',
          isEmailVerified: true,
          phone: '0905111222'
        }
      },
      { upsert: true }
    );
    console.log('✅ Updated admin@gmail.com with password admin123, status: Active, verified: true');

    await mongoose.disconnect();
    console.log('Database disconnected.');
  } catch (err) {
    console.error('Error in initTestAccounts:', err);
  }
})();
