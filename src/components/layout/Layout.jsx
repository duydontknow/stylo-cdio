import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    Shirt,
    Layers,
    Sparkles,
    LogOut,
    Menu,
    User,
    X,
} from "lucide-react";

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Đóng menu khi chuyển trang
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

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
        { path: "/profile", name: "Hồ sơ", icon: User },
    ];

    const SidebarContent = ({ className = "" }) => (
        <div className={`flex flex-col h-full ${className}`}>
            <div className="h-16 flex items-center px-6 border-b border-gray-200 shrink-0">
                <h1 className="text-2xl font-black tracking-tighter text-primary">
                    STYLO.
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                                isActive
                                    ? "bg-primary text-white shadow-soft"
                                    : "text-muted hover:bg-gray-100 hover:text-primary"
                            }`}
                        >
                            <Icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200 bg-white">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Đăng xuất
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* 1. Sidebar cho Desktop (Cố định ở bên trái) */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col shrink-0 overflow-hidden">
                <SidebarContent />
            </aside>

            {/* 2. Mobile Drawer using Framer Motion */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Overlay phía sau */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
                        />
                        {/* Nội dung Sidebar trượt ra */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-[70] w-72 bg-white shadow-2xl md:hidden"
                        >
                            <div className="absolute top-4 right-4 z-10">
                                <button 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-muted hover:text-primary bg-gray-100 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Vùng nội dung chính */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header cho Mobile (Chỉ hiện trên màn hình nhỏ) */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:hidden shrink-0 z-50">
                    <h1 className="text-xl font-black tracking-tighter text-primary uppercase">STYLO.</h1>
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2.5 text-primary hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Nơi render nội dung của từng trang */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
                    <div className="max-w-[1400px] mx-auto min-h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
