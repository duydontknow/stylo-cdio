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
    Edit2,
    Mail,
    ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Badge from "../components/common/Badge";

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        height: "",
        weight: "",
        body_shape: "",
        skin_tone: "",
    });

    useEffect(() => {
        async function loadProfile() {
            const data = await getProfile(user?.id);
            if (data && (data.height || data.weight || data.body_shape || data.skin_tone)) {
                setFormData({
                    height: data.height || "",
                    weight: data.weight || "",
                    body_shape: data.body_shape || "",
                    skin_tone: data.skin_tone || "",
                });
                setIsEditing(false);
            } else {
                setIsEditing(true);
            }
            setLoading(false);
        }
        if (user) loadProfile();
    }, [user]);

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
            toast.success("Lưu hồ sơ tuyệt vời!", { id: toastId });
            setIsEditing(false);
        } catch (error) {
            toast.error("Lỗi khi lưu hồ sơ!", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="animate-spin text-ai" size={36} />
            </div>
        );

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
    };
    
    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-3xl mx-auto space-y-8 px-4 sm:px-0"
        >
            <motion.div variants={itemVariants} className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
                    Hồ sơ Cá nhân
                </h1>
                <p className="text-muted font-bold mt-1 text-base md:text-lg">
                    Cập nhật chỉ số cơ thể để AI gợi ý trang phục chuẩn xác nhất dành riêng cho bạn.
                </p>
            </motion.div>

            {/* Dữ liệu tài khoản cơ bản */}
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-primary to-slate-800 p-6 md:p-8 rounded-[2rem] shadow-soft text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-center gap-6">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center p-1 border border-white/20 backdrop-blur-md">
                        <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center">
                            <User size={32} className="text-white" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight text-white mb-0">Tài khoản STYLO</h2>
                            <Badge variant="ai" className="bg-ai text-white border-none py-1">Thành viên</Badge>
                        </div>
                        <p className="flex items-center gap-2 text-white/80 font-medium">
                            <Mail size={16} /> {user?.email || "Chưa có email"}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Form Hồ sơ AI */}
            <motion.form
                variants={itemVariants}
                onSubmit={handleSubmit}
                className="bg-surface p-6 md:p-8 rounded-[2rem] shadow-glass border border-gray-100 space-y-8 relative overflow-hidden"
            >
                {/* Ambient glow */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-ai/5 rounded-full blur-[100px] pointer-events-none -z-10" />

                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                        <ShieldCheck className="text-ai" size={24} /> Chỉ số Form Dáng
                    </h3>
                    <Badge variant={isEditing ? "outline" : "default"} className={isEditing ? "text-ai border-ai/30 bg-ai/5" : "bg-gray-100 text-gray-500"}>
                        {isEditing ? "Đang chỉnh sửa" : "Đã khóa"}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {/* Chiều cao */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-primary flex items-center gap-2">
                            <Ruler size={16} className="text-ai" /> Chiều cao (cm)
                        </label>
                        <Input
                            type="number"
                            placeholder="VD: 170"
                            value={formData.height}
                            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                            disabled={!isEditing}
                            className={`transition-all ${!isEditing ? "bg-gray-50/50 text-gray-400 border-transparent shadow-none" : "bg-white"}`}
                        />
                    </div>

                    {/* Cân nặng */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-primary flex items-center gap-2">
                            <Weight size={16} className="text-ai" /> Cân nặng (kg)
                        </label>
                        <Input
                            type="number"
                            placeholder="VD: 65"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            disabled={!isEditing}
                            className={`transition-all ${!isEditing ? "bg-gray-50/50 text-gray-400 border-transparent shadow-none" : "bg-white"}`}
                        />
                    </div>

                    {/* Dáng người */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-primary flex items-center gap-2">
                            <Scissors size={16} className="text-ai" /> Dáng người
                        </label>
                        <div className="relative">
                            <select
                                value={formData.body_shape}
                                onChange={(e) => setFormData({ ...formData, body_shape: e.target.value })}
                                disabled={!isEditing}
                                className={`w-full h-12 px-4 border rounded-2xl outline-none focus:ring-2 focus:ring-ai text-primary appearance-none font-medium transition-all ${
                                    !isEditing ? "bg-gray-50/50 text-gray-400 border-transparent shadow-none cursor-not-allowed" : "bg-white border-gray-200 shadow-sm"
                                }`}
                            >
                                <option value="">-- Chọn dáng người --</option>
                                <option value="Chữ nhật">Chữ nhật (Straight)</option>
                                <option value="Quả lê">Quả lê (Pear)</option>
                                <option value="Quả táo">Quả táo (Apple)</option>
                                <option value="Đồng hồ cát">Đồng hồ cát (Hourglass)</option>
                                <option value="Tam giác ngược">Tam giác ngược (Inverted Triangle)</option>
                            </select>
                            {isEditing && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tông da */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-primary flex items-center gap-2">
                            <Palette size={16} className="text-ai" /> Tông da
                        </label>
                        <div className="relative">
                            <select
                                value={formData.skin_tone}
                                onChange={(e) => setFormData({ ...formData, skin_tone: e.target.value })}
                                disabled={!isEditing}
                                className={`w-full h-12 px-4 border rounded-2xl outline-none focus:ring-2 focus:ring-ai text-primary appearance-none font-medium transition-all ${
                                    !isEditing ? "bg-gray-50/50 text-gray-400 border-transparent shadow-none cursor-not-allowed" : "bg-white border-gray-200 shadow-sm"
                                }`}
                            >
                                <option value="">-- Chọn tông da --</option>
                                <option value="Sáng (Light)">Sáng (Light)</option>
                                <option value="Trung bình (Medium)">Trung bình (Medium)</option>
                                <option value="Ngăm (Dark)">Ngăm (Dark)</option>
                            </select>
                            {isEditing && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-50">
                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.div 
                                key="editing"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex gap-4"
                            >
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 bg-gray-50"
                                >
                                    Hủy thao tác
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={saving}
                                    leftIcon={!saving && <Save size={18} />}
                                    className="flex-[2] shadow-glow"
                                >
                                    Cập nhật hồ sơ
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="viewing"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                                    leftIcon={<Edit2 size={18} />}
                                    className="w-full border-gray-200 text-primary shadow-sm"
                                >
                                    Thay đổi thông tin
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.form>
        </motion.div>
    );
}
