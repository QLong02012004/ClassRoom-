import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User';
import bcrypt from 'bcrypt';
import { AuthRequest } from './authController';

// [GET] /api/v1/users
// Lấy danh sách user (có lọc theo role, status, search)
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { role, status, search } = req.query;
        let query: any = {};

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

        if (!newPassword || newPassword.length < 6) {
            res.status(400);
            return next(new Error('Mật khẩu mới phải có ít nhất 6 ký tự'));
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
        const { name, avatar, dob, gender, phone, address } = req.body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (dob !== undefined) updateData.dob = dob;
        if (gender !== undefined) updateData.gender = gender;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;

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
            return next(new Error('Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới'));
        }

        if (newPassword.length < 6) {
            res.status(400);
            return next(new Error('Mật khẩu mới phải có ít nhất 6 ký tự'));
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404);
            return next(new Error('Không tìm thấy người dùng'));
        }

        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
            res.status(400);
            return next(new Error('Mật khẩu cũ không chính xác'));
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
