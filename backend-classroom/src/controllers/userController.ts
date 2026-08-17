import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User';
import bcrypt from 'bcrypt';
import { AuthRequest } from './authController';
import { notifyAdminStatsUpdate } from '../socket';
import { generateOTP, sendPasswordSetupEmail } from '../services/emailService';

// [GET] /api/v1/users
// Lấy danh sách user (có lọc theo role, status, search)
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { role, status, search } = req.query;
        let query: any = { isEmailVerified: { $ne: false } };

        if (role) {
            query.role = role;
        }

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search as string, $options: 'i' } },
                { email: { $regex: search as string, $options: 'i' } }
            ];
        }

        const users = await UserModel.find(query).select('-passwordHash').sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Lấy danh sách người dùng thành công',
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// [PUT] /api/v1/users/:id/status
// Khóa / Mở khóa tài khoản
export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Active', 'Locked'].includes(status)) {
            res.status(400);
            return next(new Error('Status không hợp lệ'));
        }

        const user = await UserModel.findByIdAndUpdate(id, { status }, { new: true }).select('-passwordHash');

        if (!user) {
            res.status(404);
            return next(new Error('Không tìm thấy người dùng'));
        }

        res.status(200).json({
            message: `Cập nhật trạng thái thành ${status} thành công`,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// [PUT] /api/v1/users/:id/role
// Phân quyền (chỉ dành cho admin)
export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['admin', 'teacher', 'student'].includes(role)) {
            res.status(400);
            return next(new Error('Role không hợp lệ'));
        }

        const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true }).select('-passwordHash');

        if (!user) {
            res.status(404);
            return next(new Error('Không tìm thấy người dùng'));
        }

        res.status(200).json({
            message: `Phân quyền thành ${role} thành công`,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// [PUT] /api/v1/users/:id/reset-password
// Reset mật khẩu
export const resetUserPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,}$/;
        if (!newPassword || !passwordRegex.test(newPassword)) {
            res.status(400);
            return next(new Error('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt!'));
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        const user = await UserModel.findByIdAndUpdate(id, { passwordHash }, { new: true }).select('-passwordHash');

        if (!user) {
            res.status(404);
            return next(new Error('Không tìm thấy người dùng'));
        }

        res.status(200).json({
            message: 'Khôi phục mật khẩu thành công',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// [DELETE] /api/v1/users/:id
// Xóa tài khoản
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;

        // Tùy chọn: Không cho phép tự xóa bản thân hoặc xóa admin cuối cùng
        if (req.user?._id.toString() === id) {
            res.status(400);
            return next(new Error('Bạn không thể tự xóa tài khoản của chính mình'));
        }

        const user = await UserModel.findByIdAndDelete(id);

        if (!user) {
            res.status(404);
            return next(new Error('Không tìm thấy người dùng'));
        }

        res.status(200).json({
            message: 'Xóa tài khoản thành công',
            data: { _id: id }
        });
    } catch (error) {
        next(error);
    }
};

// [PUT] /api/v1/users/profile
// Cập nhật thông tin hồ sơ cá nhân
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401);
            return next(new Error('Chưa đăng nhập'));
        }

        // Lấy dữ liệu từ body (chỉ cho phép cập nhật các trường được chỉ định)
        const { name, avatar, dob, gender, phone, address, bio, degree } = req.body;

        // Xác thực thông tin đầu vào
        if (name !== undefined) {
            const trimmedName = name.trim();
            if (!trimmedName) {
                res.status(400);
                return next(new Error('Họ và tên không được để trống!'));
            }
            if (trimmedName.length < 2 || trimmedName.length > 50) {
                res.status(400);
                return next(new Error('Họ và tên phải có độ dài từ 2 đến 50 ký tự!'));
            }
            const nameRegex = /^[\p{L}\s]+$/u;
            if (!nameRegex.test(trimmedName)) {
                res.status(400);
                return next(new Error('Họ và tên không được chứa chữ số hoặc ký tự đặc biệt!'));
            }
        }

        if (phone !== undefined && phone !== '') {
            const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
            if (!phoneRegex.test(phone)) {
                res.status(400);
                return next(new Error('Số điện thoại không đúng định dạng Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09)!'));
            }
        }

        if (dob !== undefined && dob !== '') {
            const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dobRegex.test(dob)) {
                res.status(400);
                return next(new Error('Ngày sinh không đúng định dạng YYYY-MM-DD!'));
            }

            const [yearStr] = dob.split('-');
            const year = parseInt(yearStr, 10);
            const currentYear = new Date().getFullYear();

            if (year < 1900 || year > currentYear) {
                res.status(400);
                return next(new Error(`Năm sinh không hợp lệ (phải từ 1900 đến ${currentYear})!`));
            }

            const dobDate = new Date(dob);
            const today = new Date();
            if (dobDate > today) {
                res.status(400);
                return next(new Error('Ngày sinh không được vượt quá ngày hiện tại!'));
            }
        }

        if (gender !== undefined && gender !== '') {
            if (!['Nam', 'Nữ', 'Khác'].includes(gender)) {
                res.status(400);
                return next(new Error('Giới tính không hợp lệ (chỉ chấp nhận Nam, Nữ, Khác)!'));
            }
        }

        if (bio !== undefined && bio.length > 500) {
            res.status(400);
            return next(new Error('Giới thiệu bản thân không được vượt quá 500 ký tự!'));
        }

        if (degree !== undefined && degree.length > 100) {
            res.status(400);
            return next(new Error('Bằng cấp không được vượt quá 100 ký tự!'));
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (dob !== undefined) updateData.dob = dob;
        if (gender !== undefined) updateData.gender = gender;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (bio !== undefined) updateData.bio = bio;
        if (degree !== undefined) updateData.degree = degree;

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-passwordHash');

        if (!updatedUser) {
            res.status(404);
            return next(new Error('Không tìm thấy người dùng'));
        }

        res.status(200).json({
            message: 'Cập nhật hồ sơ thành công',
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

// [PUT] /api/v1/users/change-password
// Tự đổi mật khẩu (yêu cầu mật khẩu cũ)
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401);
            return next(new Error('Chưa đăng nhập'));
        }

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            res.status(400);
            return next(new Error('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới'));
        }

        if (oldPassword === newPassword) {
            res.status(400);
            return next(new Error('Mật khẩu mới không được trùng với mật khẩu hiện tại!'));
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            res.status(400);
            return next(new Error('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt!'));
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404);
            return next(new Error('Không tìm thấy người dùng'));
        }

        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
            res.status(400);
            return next(new Error('Mật khẩu hiện tại không chính xác'));
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await UserModel.findByIdAndUpdate(userId, { passwordHash });

        res.status(200).json({
            message: 'Đổi mật khẩu thành công'
        });
    } catch (error) {
        next(error);
    }
};

// [PUT] /api/v1/users/:id
// Admin cập nhật thông tin người dùng (Họ tên, Email, Môn học, Vai trò)
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const { name, email, subject, role, parentPhone } = req.body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (subject !== undefined) updateData.subject = subject;
        if (role !== undefined) updateData.role = role;
        if (parentPhone !== undefined) updateData.parentPhone = parentPhone;

        // Nếu cập nhật email, kiểm tra xem email có bị trùng với tài khoản khác không
        if (email) {
            const emailExists = await UserModel.findOne({ email, _id: { $ne: id as any } } as any);
            if (emailExists) {
                res.status(400);
                return next(new Error('Email này đã được sử dụng bởi người dùng khác!'));
            }
        }

        const user = await UserModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select('-passwordHash');

        if (!user) {
            res.status(404);
            return next(new Error('Không tìm thấy người dùng'));
        }

        res.status(200).json({
            message: 'Cập nhật người dùng thành công',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/users/send-password-otp
export const sendPasswordOTP = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401);
            return next(new Error('Chưa đăng nhập'));
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404);
            return next(new Error('Không tìm thấy người dùng'));
        }

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        user.emailVerificationOTP = otp;
        user.emailVerificationExpires = otpExpires;
        await user.save();

        console.log(`[PASSWORD OTP] Sending password setup OTP ${otp} to ${user.email}`);
        await sendPasswordSetupEmail(user.email, otp);

        res.status(200).json({
            message: 'Mã xác thực OTP đã được gửi về email của bạn để bắt đầu thiết lập mật khẩu!'
        });
    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/users/setup-google-password
export const setupGooglePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401);
            return next(new Error('Chưa đăng nhập'));
        }

        const { otp, newPassword } = req.body;

        if (!otp || !newPassword) {
            res.status(400);
            return next(new Error('Vui lòng nhập đầy đủ mã OTP và mật khẩu mới!'));
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            res.status(400);
            return next(new Error('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt!'));
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404);
            return next(new Error('Không tìm thấy người dùng'));
        }

        // Kiểm tra OTP
        if (!user.emailVerificationOTP || user.emailVerificationOTP !== otp) {
            res.status(400);
            return next(new Error('Mã OTP không chính xác!'));
        }

        if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
            res.status(400);
            return next(new Error('Mã OTP đã hết hạn! Vui lòng gửi lại.'));
        }

        // Xóa OTP đã sử dụng
        user.emailVerificationOTP = undefined as any;
        user.emailVerificationExpires = undefined as any;

        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        user.isGoogleAccount = false; // Một khi đã tạo mật khẩu, chuyển về tài khoản thường để đăng nhập bình thường
        
        await user.save();

        res.status(200).json({
            message: 'Thiết lập mật khẩu thành công! Bây giờ bạn có thể đăng nhập bằng cả Google và Email/Mật khẩu.'
        });
    } catch (error) {
        next(error);
    }
};
