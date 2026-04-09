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
} from "lucide-react";
import toast from "react-hot-toast";

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

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10 px-4 md:px-0">
            {/* Header Admin */}
            <div className="bg-black text-white p-6 md:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-lg gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <Settings
                            className="text-blue-400 animate-spin-slow"
                            size={32}
                        />
                        Hệ thống Quản trị
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm md:text-base">
                        Giám sát và vận hành ứng dụng STYLO
                    </p>
                </div>
                <div className="text-left sm:text-right bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <p className="font-medium text-xs md:text-sm text-gray-300">
                        Admin Account
                    </p>
                    <p className="font-bold text-blue-300 text-sm md:text-base break-words">
                        {user?.email}
                    </p>
                </div>
            </div>

            {/* THẺ THỐNG KÊ (METRICS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CỘT TRÁI: FORM DANH MỤC */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full sticky top-24">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-blue-500" /> Thêm loại quần áo
                        </h2>
                        <form onSubmit={submitCategory} className="space-y-5 flex-1">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                    Nhóm (Type)
                                </label>
                                <select
                                    value={newCatType}
                                    onChange={(e) => setNewCatType(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black bg-gray-50 transition-all hover:bg-white"
                                >
                                    <option value="Tops">Tops (Áo)</option>
                                    <option value="Bottoms">Bottoms (Quần/Váy)</option>
                                    <option value="Outerwear">Outerwear (Áo khoác)</option>
                                    <option value="Footwear">Footwear (Giày dép)</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                    Tên danh mục
                                </label>
                                <input
                                    type="text"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    placeholder="VD: Áo thun form rộng"
                                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black bg-gray-50 transition-all hover:bg-white"
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        "Thêm vào hệ thống"
                                    )}
                                </button>
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
            </div>
        </div>
    );
}
