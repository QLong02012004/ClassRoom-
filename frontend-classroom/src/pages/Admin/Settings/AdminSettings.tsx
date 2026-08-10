import React, { useState, useEffect } from "react";
import {
  FadersHorizontal,
  ShieldCheck,
  EnvelopeSimple,
  PuzzlePiece,
  FloppyDisk,
  Image as ImageIcon,
  Warning,
  CircleNotch
} from "phosphor-react";

import { PrimaryButton } from "@/components/ui/Buttons/PrimaryButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "../../../components/Styles/ToastContext";
import { settingsService } from "@/service/settings.service";
import type { ISystemSettings } from "@/service/settings.service";

export default function AdminSettings() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [systemName, setSystemName] = useState("Classroom Manager Institutional");
  const [timezone, setTimezone] = useState("gmt7");
  const [dateFormat, setDateFormat] = useState("ddmm");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await settingsService.getSettings();
      if (res.data) {
        setSystemName(res.data.systemName || "Classroom Manager Institutional");
        setTimezone(res.data.timezone || "gmt7");
        setDateFormat(res.data.dateFormat || "ddmm");
        setMaintenanceMode(Boolean(res.data.maintenanceMode));
      }
    } catch (error: any) {
      console.error("Lỗi lấy cấu hình hệ thống:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await settingsService.updateSettings({
        systemName,
        timezone,
        dateFormat,
        maintenanceMode
      });
      if (res.data) {
        setSystemName(res.data.systemName);
        setTimezone(res.data.timezone);
        setDateFormat(res.data.dateFormat);
        setMaintenanceMode(Boolean(res.data.maintenanceMode));
        toast.success("Cập nhật cài đặt hệ thống thành công!", 3000);
      }
    } catch (error: any) {
      toast.error(error.message || "Cập nhật cấu hình thất bại!", 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-[1400px] mx-auto bg-[#F8FAFC] min-h-full">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl tracking-tight text-slate-900 font-bold">Cài đặt hệ thống</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Quản lý cấu hình toàn cục, bảo mật và thông báo cho Classroom Manager.
          </p>
        </div>

        <PrimaryButton
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="gap-2 bg-primary hover:opacity-90 text-primary-foreground font-semibold shadow-sm cursor-pointer"
        >
          {isSaving ? <CircleNotch size={18} className="animate-spin" /> : <FloppyDisk size={18} weight="fill" />}
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </PrimaryButton>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-2">
        {/* SIDEBAR TABS */}
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "general"
                ? "bg-primary text-primary-foreground shadow-sm font-bold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FadersHorizontal size={20} />
            Cấu hình chung
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "security"
                ? "bg-primary text-primary-foreground shadow-sm font-bold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck size={20} />
            Bảo mật
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "notifications"
                ? "bg-primary text-primary-foreground shadow-sm font-bold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <EnvelopeSimple size={20} />
            Thông báo
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "integrations"
                ? "bg-primary text-primary-foreground shadow-sm font-bold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <PuzzlePiece size={20} />
            Tích hợp
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col gap-6">

          {/* GENERAL SETTINGS CARD */}
          {activeTab === "general" && (
            <>
              <Card className="shadow-sm border-gray-200 bg-white">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <FadersHorizontal size={20} className="text-primary" />
                    <CardTitle className="text-xl">Cấu hình chung</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 grid gap-8">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="systemName" className="text-sm font-bold text-slate-700">Tên hệ thống</Label>
                      <Input
                        id="systemName"
                        value={systemName}
                        onChange={(e) => setSystemName(e.target.value)}
                        className="bg-slate-50 font-medium text-slate-900 border-slate-200"
                        placeholder="Nhập tên hệ thống..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Múi giờ hệ thống</Label>
                      <Select value={timezone} onValueChange={(val) => setTimezone(val)}>
                        <SelectTrigger className="bg-slate-50 border-slate-200 font-medium">
                          <SelectValue placeholder="Chọn múi giờ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gmt7">(GMT+07:00) Bangkok, Hanoi, Jakarta</SelectItem>
                          <SelectItem value="gmt8">(GMT+08:00) Beijing, Singapore</SelectItem>
                          <SelectItem value="gmt9">(GMT+09:00) Tokyo, Seoul</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Logo hệ thống (400x400px)</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 shadow-xs">
                          <ImageIcon size={28} />
                        </div>
                        <PrimaryButton variant="secondary" className="bg-blue-50 text-primary hover:bg-blue-100 font-semibold border border-blue-200">
                          Tải lên logo mới
                        </PrimaryButton>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-slate-700">Định dạng ngày tháng</Label>
                      <RadioGroup value={dateFormat} onValueChange={(val) => setDateFormat(val)} className="flex items-center gap-6 mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ddmm" id="ddmm" />
                          <Label htmlFor="ddmm" className="font-semibold text-slate-700 cursor-pointer">DD/MM/YYYY</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mmdd" id="mmdd" />
                          <Label htmlFor="mmdd" className="font-semibold text-slate-700 cursor-pointer">MM/DD/YYYY</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  {/* MAINTENANCE MODE SWITCH */}
                  <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                    maintenanceMode 
                      ? "bg-amber-500/10 border-amber-500/30 shadow-md" 
                      : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-black text-slate-900 cursor-pointer">Chế độ bảo trì (Maintenance Mode)</Label>
                        {maintenanceMode && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider animate-pulse shadow-sm">
                            Đang BẬT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
                        Khi bật công tắc này, hệ thống sẽ vô hiệu hóa truy cập của Học sinh và Giáo viên thông thường. Chỉ tài khoản Quản trị viên (Admin) mới có thể vào hệ thống.
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceMode}
                      onCheckedChange={(checked) => setMaintenanceMode(checked)}
                      className="cursor-pointer"
                    />
                  </div>

                </CardContent>
              </Card>

              {/* DANGER ZONE */}
              <Card className="border-red-200 bg-[#fffcfc] shadow-xs">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <Warning size={20} weight="bold" />
                    <h3 className="text-sm font-black uppercase tracking-wider">Khu vực nguy hiểm</h3>
                  </div>
                  <p className="text-sm text-red-700 mb-4 font-medium">
                    Đặt lại cấu hình cài đặt về mặc định ban đầu của nhà phát triển. Hành động này không thể hoàn tác.
                  </p>
                  <PrimaryButton variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold cursor-pointer">
                    Đặt lại cấu hình mặc định
                  </PrimaryButton>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab !== "general" && (
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-12 flex flex-col items-center justify-center text-slate-400">
                <ShieldCheck size={48} className="mb-4 opacity-20" />
                <p className="font-semibold text-slate-500">Tính năng đang được nâng cấp</p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
