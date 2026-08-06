import nodemailer from 'nodemailer';

// Cấu hình transporter (sử dụng Gmail làm ví dụ, nhưng có thể dùng Ethereal cho test)
// Bạn cần thay thế bằng tài khoản thật và mật khẩu ứng dụng thật nếu muốn test gửi email thực tế.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'your_email@gmail.com', // Điền email của bạn vào .env
        pass: process.env.SMTP_PASS || 'your_app_password',    // Điền App Password vào .env
    }
});

// Hàm tạo mã OTP 6 số
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationEmail = async (toEmail: string, otp: string) => {
    const senderEmail = process.env.SMTP_USER || 'no-reply@classroom.com';
    const mailOptions = {
        from: `"ClassRoom" <${senderEmail}>`,
        to: toEmail,
        subject: `${otp} là mã xác thực tài khoản ClassRoom của bạn`,
        text: `Chào bạn,\n\nMã xác thực OTP của bạn là: ${otp}\n\nMã có hiệu lực trong 10 phút. Vui lòng không chia sẻ mã này cho người khác.\n\nTrân trọng,\nĐội ngũ ClassRoom`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #f47c20; margin: 0;">ClassRoom</h2>
                    <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Hệ thống quản lý lớp học</p>
                </div>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #0f172a; margin-top: 0;">Xác thực địa chỉ Email</h3>
                    <p style="color: #334155; line-height: 1.5;">Chào bạn,</p>
                    <p style="color: #334155; line-height: 1.5;">Cảm ơn bạn đã sử dụng dịch vụ ClassRoom. Mã xác nhận 6 chữ số của bạn là:</p>
                    
                    <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px dashed #cbd5e1;">
                        <span style="font-size: 32px; font-weight: bold; color: #f47c20; letter-spacing: 6px;">${otp}</span>
                    </div>
                    
                    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Mã này sẽ hết hạn sau 10 phút. Vì lý do bảo mật, vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <p style="color: #94a3b8; font-size: 12px;">© 2026 ClassRoom System. All rights reserved.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Lỗi khi gửi email:", error);
        return false;
    }
};
