import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { ClassModel } from '../models/Class';
import { AttendanceModel } from '../models/Attendance';
import { UserModel } from '../models/User';

let sheetsClient: any = null;
let driveClient: any = null;

const getAuthClient = () => {
    if (sheetsClient && driveClient) {
        return { sheets: sheetsClient, drive: driveClient };
    }

    try {
        let auth;
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
            auth = new google.auth.GoogleAuth({
                credentials,
                scopes: [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive'
                ],
            });
        } else {
            const possiblePaths = [
                process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
                path.join(process.cwd(), 'google-key.json'),
                path.join(__dirname, '../config/google-key.json'),
                path.join(__dirname, '../../google-key.json')
            ].filter(Boolean) as string[];

            const keyPath = possiblePaths.find(p => fs.existsSync(p));

            if (keyPath) {
                auth = new google.auth.GoogleAuth({
                    keyFile: keyPath,
                    scopes: [
                        'https://www.googleapis.com/auth/spreadsheets',
                        'https://www.googleapis.com/auth/drive'
                    ],
                });
            } else {
                console.warn('[GoogleSheetsService] Chưa tìm thấy file google-key.json.');
                return { sheets: null, drive: null };
            }
        }

        sheetsClient = google.sheets({ version: 'v4', auth });
        driveClient = google.drive({ version: 'v3', auth });

        return { sheets: sheetsClient, drive: driveClient };
    } catch (err) {
        console.error('[GoogleSheetsService Auth Lỗi]:', err);
        return { sheets: null, drive: null };
    }
};

export class GoogleSheetsService {
    /**
     * Tự động khởi tạo dòng Tiêu đề (Header) cho File Google Sheet nếu file còn trống
     */
    static async initSheetHeaderIfEmpty(sheetId: string): Promise<boolean> {
        const { sheets } = getAuthClient();
        if (!sheets) return false;

        try {
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: 'A1:F1'
            }).catch(() => null);

            if (!res || !res.data || !res.data.values || res.data.values.length === 0) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId: sheetId,
                    range: 'A1:F1',
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: [
                            ['Ngày Điểm Danh', 'Mã Học Sinh', 'Họ Và Tên', 'Email', 'Trạng Thái', 'Ghi Chú / Lý Do']
                        ]
                    }
                });
            }
            return true;
        } catch (err) {
            console.error('[GoogleSheetsService initSheetHeaderIfEmpty Lỗi]:', err);
            return false;
        }
    }

    /**
     * Tự động tạo File Google Sheet mới cho Lớp học
     */
    static async createSheetForClassroom(className: string, teacherEmail?: string): Promise<{ sheetId: string; sheetUrl: string }> {
        const { sheets, drive } = getAuthClient();
        if (!sheets) {
            throw new Error('Chưa tìm thấy file google-key.json hoặc Service Account chưa được cấu hình.');
        }

        try {
            const createRes = await sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: `[Điểm Danh] - Lớp ${className}`,
                    },
                    sheets: [
                        {
                            properties: {
                                title: 'Lịch Sử Điểm Danh',
                                gridProperties: { frozenRowCount: 1 }
                            }
                        }
                    ]
                }
            });

            const sheetId = createRes.data.spreadsheetId;
            const sheetUrl = createRes.data.spreadsheetUrl;

            if (!sheetId || !sheetUrl) {
                throw new Error('Google Sheets API không trả về ID hoặc URL của Sheet mới.');
            }

            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: 'Lịch Sử Điểm Danh!A1:F1',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [
                        ['Ngày Điểm Danh', 'Mã Học Sinh', 'Họ Và Tên', 'Email', 'Trạng Thái', 'Ghi Chú / Lý Do']
                    ]
                }
            });

            if (teacherEmail && drive) {
                try {
                    await drive.permissions.create({
                        fileId: sheetId,
                        requestBody: {
                            role: 'writer',
                            type: 'user',
                            emailAddress: teacherEmail,
                        }
                    });
                } catch (permissionErr: any) {
                    console.error('[GoogleSheetsService Share Permission Lỗi (Không chặn tạo Sheet)]:', permissionErr?.message || permissionErr);
                }
            }

            return { sheetId, sheetUrl };
        } catch (error: any) {
            console.error('[GoogleSheetsService createSheetForClassroom Lỗi]:', error?.message || error);
            throw error;
        }
    }

    /**
     * Đồng bộ bản ghi điểm danh của 1 buổi học sang Google Sheet
     */
    static async syncAttendanceToSheet(attendanceId: string): Promise<boolean> {
        const { sheets } = getAuthClient();

        const attendance = await AttendanceModel.findById(attendanceId);
        if (!attendance) return false;

        const classroom = await ClassModel.findById(attendance.classId);
        if (!classroom || !classroom.googleSheetId || classroom.googleSheetSyncEnabled === false) {
            return false;
        }

        if (!sheets) {
            attendance.syncedToGoogleSheet = false;
            attendance.syncError = 'Chưa cấu hình Google Service Account credentials';
            await attendance.save();
            return false;
        }

        try {
            const studentIds = attendance.records.map(r => r.studentId);
            const studentsList = await UserModel.find({ _id: { $in: studentIds } });
            const studentMap = new Map(studentsList.map(s => [s._id.toString(), s]));

            const statusTextMap: Record<string, string> = {
                present: 'Có mặt',
                absent: 'Vắng mặt',
                late: 'Đi muộn'
            };

            const d = new Date(attendance.date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;

            const rowsToAppend = attendance.records.map(rec => {
                const st = studentMap.get(rec.studentId.toString());
                return [
                    formattedDate,
                    st?._id?.toString() || '',
                    st?.name || 'Học sinh',
                    st?.email || '',
                    statusTextMap[rec.status] || rec.status,
                    rec.note || ''
                ];
            });

            await sheets.spreadsheets.values.append({
                spreadsheetId: classroom.googleSheetId,
                range: 'A:F',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: rowsToAppend
                }
            });

            attendance.syncedToGoogleSheet = true;
            attendance.lastSyncedAt = new Date();
            attendance.syncError = '';
            await attendance.save();

            return true;
        } catch (error: any) {
            console.error(`[GoogleSheetSync Lỗi - AttendanceID ${attendanceId}]:`, error);
            attendance.syncedToGoogleSheet = false;
            attendance.syncError = error.message || 'Lỗi đồng bộ Google Sheets';
            await attendance.save();
            return false;
        }
    }
}
