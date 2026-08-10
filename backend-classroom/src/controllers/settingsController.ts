import { Request, Response, NextFunction } from 'express';
import { SystemSettingsModel } from '../models/SystemSettings';
import { notifySettingsUpdate } from '../socket';

// Lấy cài đặt hệ thống (Công khai hoặc Authenticated)
export const getSystemSettings = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        let settings = await SystemSettingsModel.findOne();
        if (!settings) {
            settings = await SystemSettingsModel.create({
                systemName: "Classroom Manager Institutional",
                timezone: "gmt7",
                dateFormat: "ddmm",
                maintenanceMode: false
            });
        }

        res.status(200).json({
            message: 'Lấy cấu hình hệ thống thành công',
            data: settings
        });
    } catch (error) {
        next(error);
    }
};

// Cập nhật cài đặt hệ thống (Dành cho Admin)
export const updateSystemSettings = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { systemName, timezone, dateFormat, maintenanceMode } = req.body;

        let settings = await SystemSettingsModel.findOne();
        if (!settings) {
            settings = new SystemSettingsModel();
        }

        if (systemName !== undefined) settings.systemName = systemName;
        if (timezone !== undefined) settings.timezone = timezone;
        if (dateFormat !== undefined) settings.dateFormat = dateFormat;
        if (maintenanceMode !== undefined) settings.maintenanceMode = Boolean(maintenanceMode);
        settings.updatedAt = new Date();

        await settings.save();
        notifySettingsUpdate();

        res.status(200).json({
            message: 'Cập nhật cấu hình hệ thống thành công',
            data: settings
        });
    } catch (error) {
        next(error);
    }
};
