import React, { useState } from "react";
import {
  FadersHorizontal,
  ShieldCheck,
  EnvelopeSimple,
  PuzzlePiece,
  FloppyDisk,
  Image as ImageIcon,
  Warning
} from "phosphor-react";

import { Button } from "@/components/ui/button";
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

export default function AdminSettings() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const handleSave = () => {
    toast.success("Đã lưu thay đổi cấu hình thành công!", 3000);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-[1400px] mx-auto bg-[#fafafa] min-h-full">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl tracking-tight text-slate-900 font-bold">Cài đặt hệ thống</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Quản lý cấu hình toàn cục, bảo mật và thông báo cho Classroom Manager.
          </p>
        </div>

        <Button onClick={handleSave} className="gap-2 bg-primary hover:opacity-90 text-primary-foreground font-semibold shadow-sm">
          <FloppyDisk size={18} weight="fill" />
          Lưu thay đổi
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-2">
        {/* SIDEBAR TABS */}
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "general"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
              }`}
          >
            <FadersHorizontal size={20} />
            Cấu hình chung
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "security"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
              }`}
          >
            <ShieldCheck size={20} />
            Bảo mật
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "notifications"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
              }`}
          >
            <EnvelopeSimple size={20} />
            Thông báo
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "integrations"
                ? "bg-primary text-primary-foreground shadow-sm"
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
              <Card className="shadow-sm border-gray-200">
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
                        defaultValue="Classroom Manager Institutional"
                        className="bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Múi giờ hệ thống</Label>
                      <Select defaultValue="gmt7">
                        <SelectTrigger className="bg-slate-50">
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
                        <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400">
                          <ImageIcon size={24} />
                        </div>
                        <Button variant="secondary" className="bg-blue-50 text-primary hover:bg-blue-100 font-medium">
                          Tải lên logo mới
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-slate-700">Định dạng ngày tháng</Label>
                      <RadioGroup defaultValue="ddmm" className="flex items-center gap-6 mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ddmm" id="ddmm" />
                          <Label htmlFor="ddmm" className="font-normal text-slate-700 cursor-pointer">DD/MM/YYYY</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mmdd" id="mmdd" />
                          <Label htmlFor="mmdd" className="font-normal text-slate-700 cursor-pointer">MM/DD/YYYY</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 mt-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold text-slate-800">Chế độ bảo trì</Label>
                      <p className="text-xs text-slate-500">
                        Vô hiệu hóa truy cập của người dùng thông thường để bảo trì hệ thống.
                      </p>
                    </div>
                    <Switch />
                  </div>

                </CardContent>
              </Card>

              {/* DANGER ZONE */}
              <Card className="border-red-200 bg-[#fffcfc]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <Warning size={20} weight="bold" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Khu vực nguy hiểm</h3>
                  </div>
                  <p className="text-sm text-red-700 mb-4">
                    Xóa toàn bộ dữ liệu hệ thống hoặc đặt lại cài đặt gốc. Hành động này không thể hoàn tác.
                  </p>
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold">
                    Đặt lại cấu hình hệ thống
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab !== "general" && (
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-12 flex flex-col items-center justify-center text-slate-400">
                <ShieldCheck size={48} className="mb-4 opacity-20" />
                <p>Tính năng đang được phát triển</p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
