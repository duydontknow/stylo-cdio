import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAdmin } from "../hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../components/Admin/StatCard";
import { CategoryTable } from "../components/Admin/CategoryTable";
import { UserTable } from "../components/Admin/UserTable";
import { AdminSkeleton } from "../components/common/Skeletons";
import {
    Loader2,
    Plus,
    Settings,
    Users,
    Shirt,
    Layout,
    Shield,
    Database
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

const ADMIN_EMAILS = ["admin@gmail.com", "tuancode@gmail.com"];

export default function Admin() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const {
        categories,
        usersList,
        stats,
        loading,
        handleAddCategory,
        handleDeleteCategory,
        handleToggleUserStatus,
    } = useAdmin(user?.email, ADMIN_EMAILS);

    // State form thêm mới danh mục
    const [newCatName, setNewCatName] = useState("");
    const [newCatType, setNewCatType] = useState("Tops");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bảo vệ Route
    useEffect(() => {
        if (user && !ADMIN_EMAILS.includes(user.email)) {
            toast.error("Bạn không có quyền truy cập trang này!");
            navigate("/");
        }
    }, [user, navigate]);

    const submitCategory = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await handleAddCategory(newCatName, newCatType);
        setIsSubmitting(false);
        if (success) {
            setNewCatName("");
        }
    };

    if (loading) return <AdminSkeleton />;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4, staggerChildren: 0.1 } }
    };
    
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto space-y-8 pb-10 px-4 md:px-0"
        >
            {/* Header Admin */}
            <motion.div variants={itemVariants} className="bg-primary text-white p-8 md:p-10 rounded-[2.5rem] flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-soft gap-6 relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
                    <Shield size={250} />
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-ai/20 to-transparent pointer-events-none" />
                
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-4 tracking-tight">
                        <Settings
                            className="text-ai-light animate-spin-slow"
                            size={36}
                        />
                        Hệ thống Quản trị
                    </h1>
                    <p className="text-white/70 mt-3 text-base md:text-lg font-medium">
                        Giám sát và vận hành ứng dụng STYLO
                    </p>
                </div>
                <div className="relative z-10 text-left sm:text-right bg-white/10 p-5 rounded-[1.5rem] backdrop-blur-md border border-white/20 shadow-glass w-full sm:w-auto">
                    <p className="font-bold text-xs uppercase tracking-wider text-white/50 mb-1">
                        Tài khoản Admin
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <p className="font-bold text-white text-base md:text-lg break-words">
                            {user?.email}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* THẺ THỐNG KÊ (METRICS) */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={Users}
                    title="Tổng Người Dùng"
                    value={stats.total_users}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatCard
                    icon={Shirt}
                    title="Quần Áo Trên Hệ Thống"
                    value={stats.total_clothes}
                    colorClass="bg-purple-50 text-purple-600"
                />
                <StatCard
                    icon={Layout}
                    title="Bộ Phối Đồ Đã Tạo"
                    value={stats.total_outfits}
                    colorClass="bg-green-50 text-green-600"
                />
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CỘT TRÁI: FORM DANH MỤC */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface p-6 rounded-[2rem] shadow-glass border border-gray-100 flex flex-col h-full sticky top-24">
                        <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-3 border-b border-gray-50 pb-4">
                            <Plus size={24} className="text-ai" /> Thêm danh mục
                        </h2>
                        <form onSubmit={submitCategory} className="space-y-6 flex-1">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-primary">
                                    Nhóm (Type)
                                </label>
                                <select
                                    value={newCatType}
                                    onChange={(e) => setNewCatType(e.target.value)}
                                    className="w-full h-12 px-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-ai text-primary appearance-none font-medium bg-gray-50 hover:bg-white transition-all"
                                >
                                    <option value="Tops">Tops (Áo)</option>
                                    <option value="Bottoms">Bottoms (Quần/Váy)</option>
                                    <option value="Outerwear">Outerwear (Áo khoác)</option>
                                    <option value="Footwear">Footwear (Giày dép)</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <Input
                                label="Tên danh mục"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                placeholder="VD: Áo thun form rộng"
                                required
                            />
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                    variant="primary"
                                    className="w-full shadow-glow"
                                    leftIcon={!isSubmitting && <Database size={18} />}
                                >
                                    Thêm vào hệ thống
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* CỘT PHẢI: QUẢN LÝ DB & DANH SÁCH USER */}
                <div className="lg:col-span-2 space-y-8">
                    <CategoryTable
                        categories={categories}
                        handleDeleteCategory={handleDeleteCategory}
                    />
                    <UserTable
                        usersList={usersList}
                        adminEmails={ADMIN_EMAILS}
                        handleToggleUserStatus={handleToggleUserStatus}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
}
