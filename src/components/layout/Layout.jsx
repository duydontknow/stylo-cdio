import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import {
    Home,
    Shirt,
    Layers,
    Sparkles,
    LogOut,
    Menu,
    User,
} from "lucide-react";

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();

    // Hàm xử lý đăng xuất
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    // Cấu hình các menu điều hướng
    const menuItems = [
        { path: "/dashboard", name: "Tổng quan", icon: Home },
        { path: "/wardrobe", name: "Tủ đồ", icon: Shirt },
        { path: "/outfits", name: "Phối đồ", icon: Layers },
        { path: "/ai-stylist", name: "AI Stylist", icon: Sparkles },
        { path: "/profile", name: "Hồ sơ", icon: User }, // Thêm dòng này
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar (Menu bên trái) - Ẩn trên điện thoại, hiện trên Desktop */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <h1 className="text-2xl font-black tracking-tighter">
                        STYLO.
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isActive
                                        ? "bg-black text-white shadow-md"
                                        : "text-gray-500 hover:bg-gray-100 hover:text-black"
                                }`}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Vùng nội dung chính */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header cho Mobile (Chỉ hiện trên màn hình nhỏ) */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:hidden">
                    <h1 className="text-xl font-black">STYLO.</h1>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Nơi render nội dung của từng trang */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
