import React, { useState, useEffect } from "react";
import { materialService, type IMaterialData } from "../../../service/material.service";
import { useToast } from "../../../components/Styles/ToastContext";
import { Trash, Plus, Link, FilePdf, VideoCamera, FileDoc, Books } from "phosphor-react";

export default function AdminMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState<IMaterialData>({
    title: "",
    subject: "",
    grade: "",
    description: "",
    type: "pdf",
    fileUrl: "",
    size: "Link",
  });

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = (await materialService.getPublicMaterials()) as any;
      if (res && res.data) {
        setMaterials(res.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Lỗi tải danh sách tài liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;
    try {
      await materialService.deleteMaterial(id);
      toast.success("Xóa tài liệu thành công");
      fetchMaterials();
    } catch (error: any) {
      toast.error(error.message || "Lỗi xóa tài liệu");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await materialService.createMaterial(formData);
      toast.success("Thêm tài liệu thành công");
      setShowAddModal(false);
      setFormData({ title: "", subject: "", grade: "", description: "", type: "pdf", fileUrl: "", size: "Link" });
      fetchMaterials();
    } catch (error: any) {
      toast.error(error.message || "Lỗi thêm tài liệu");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "pdf": return <FilePdf size={24} color="#f47c20" />;
      case "video": return <VideoCamera size={24} color="#2f8fa3" />;
      case "doc": return <FileDoc size={24} color="#3B82F6" />;
      case "link": return <Link size={24} color="#2f8fa3" />;
      default: return <Books size={24} />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý Kho Tài Liệu Chung</h2>
          <p className="text-slate-500">Tải lên và quản lý tài liệu công khai cho toàn trường</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Thêm tài liệu
        </button>
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => (
            <div key={m._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {getIcon(m.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 line-clamp-1" title={m.title}>{m.title}</h3>
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                      {m.subject} - {m.grade}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleDelete(m._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md">
                  <Trash size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4 flex-1 line-clamp-3">{m.description}</p>
              <a
                href={m.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 font-semibold hover:underline"
              >
                Xem tài liệu / Link
              </a>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Thêm Tài Liệu Mới</h3>
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Tiêu đề tài liệu"
                required
                className="px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Môn học (VD: Toán)"
                  required
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Khối (VD: Khối 10)"
                  required
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                />
              </div>
              <textarea
                placeholder="Mô tả"
                rows={3}
                className="px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <select
                className="px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="pdf">Tài liệu PDF</option>
                <option value="doc">Văn bản Word</option>
                <option value="video">Video</option>
                <option value="link">Đường dẫn Web</option>
              </select>
              <input
                type="text"
                placeholder="URL File hoặc Web"
                required
                className="px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Lưu tài liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
