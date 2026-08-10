import { Schema, model, Document } from 'mongoose';

export interface ISystemSettings extends Document {
    systemName: string;
    timezone: string;
    dateFormat: string;
    maintenanceMode: boolean;
    updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
    systemName: { type: String, default: "Classroom Manager Institutional" },
    timezone: { type: String, default: "gmt7" },
    dateFormat: { type: String, default: "ddmm" },
    maintenanceMode: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
});

export const SystemSettingsModel = model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
