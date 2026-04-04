// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getProfile, upsertProfile } from "../services/profile";
import {
    User,
    Ruler,
    Weight,
    Scissors,
    Palette,
    Loader2,
    Save,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        height: "",
        weight: "",
        body_shape: "",
        skin_tone: "",
    });

    useEffect(() => {
        async function loadProfile() {
            const data = await getProfile(user.id);
            if (data) {
                setFormData({
                    height: data.height || "",
                    weight: data.weight || "",
                    body_shape: data.body_shape || "",
                    skin_tone: data.skin_tone || "",
                });
            }
            setLoading(false);
        }
        loadProfile();
    }, [user.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const toastId = toast.loading("Đang lưu thông tin...");
        try {
            await upsertProfile(user.id, {
                height: Number(formData.height) || null,
                weight: Number(formData.weight) || null,
                body_shape: formData.body_shape,
                skin_tone: formData.skin_tone,
            });
            toast.success("Lưu hồ sơ thành công!", { id: toastId });
        } catch (error) {
            toast.error("Lỗi khi lưu hồ sơ!", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="text-blue-500" /> Hồ sơ phong cách
                </h1>
                <p className="text-gray-500 mt-1">
                    Cập nhật chỉ số cơ thể để AI gợi ý trang phục chuẩn xác hơn.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Chiều cao */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Ruler size={16} /> Chiều cao (cm)
                        </label>
                        <input
                            type="number"
                            placeholder="VD: 170"
                            value={formData.height}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    height: e.target.value,
                                })
                            }
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                        />
                    </div>

                    {/* Cân nặng */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Weight size={16} /> Cân nặng (kg)
                        </label>
                        <input
                            type="number"
                            placeholder="VD: 65"
                            value={formData.weight}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    weight: e.target.value,
                                })
                            }
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none"
                        />
                    </div>

                    {/* Dáng người */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Scissors size={16} /> Dáng người
                        </label>
                        <select
                            value={formData.body_shape}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    body_shape: e.target.value,
                                })
                            }
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none bg-white"
                        >
                            <option value="">-- Chưa xác định --</option>
                            <option value="Chữ nhật">
                                Chữ nhật (Straight)
                            </option>
                            <option value="Quả lê">Quả lê (Pear)</option>
                            <option value="Quả táo">Quả táo (Apple)</option>
                            <option value="Đồng hồ cát">
                                Đồng hồ cát (Hourglass)
                            </option>
                            <option value="Tam giác ngược">
                                Tam giác ngược (Inverted Triangle)
                            </option>
                        </select>
                    </div>

                    {/* Tông da */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Palette size={16} /> Tông da
                        </label>
                        <select
                            value={formData.skin_tone}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    skin_tone: e.target.value,
                                })
                            }
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none bg-white"
                        >
                            <option value="">-- Chưa xác định --</option>
                            <option value="Sáng (Light)">Sáng (Light)</option>
                            <option value="Trung bình (Medium)">
                                Trung bình (Medium)
                            </option>
                            <option value="Ngăm (Dark)">Ngăm (Dark)</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-black text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <Save size={20} />
                    )}
                    Lưu thông tin
                </button>
            </form>
        </div>
    );
}
