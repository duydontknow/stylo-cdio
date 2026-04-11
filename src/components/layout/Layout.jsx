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
    Sun,
    Moon,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

// Nút toggle Dark/Light mode với animation mượt
function ThemeToggleButton({ compact = false }) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            title={isDark ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
            className={`
                relative flex items-center gap-2.5 transition-all duration-300 font-bold text-sm
                ${compact
                    ? "p-2.5 rounded-xl"
                    : "w-full px-4 py-3 rounded-xl"
                }
                ${isDark
                    ? "bg-slate-700/60 text-yellow-300 hover:bg-slate-600/80"
                    : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                }
            `}
        >
            {/* Track pill (chỉ hiện khi không compact) */}
            <div className={`relative ${compact ? "" : "flex items-center gap-3 w-full"}`}>
                <div className="relative w-5 h-5 shrink-0">
                    <motion.div
                        initial={false}
                        animate={{ opacity: isDark ? 0 : 1, rotate: isDark ? -90 : 0, scale: isDark ? 0.5 : 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <Sun size={18} className="text-amber-500" />
                    </motion.div>
                    <motion.div
                        initial={false}
                        animate={{ opacity: isDark ? 1 : 0, rotate: isDark ? 0 : 90, scale: isDark ? 1 : 0.5 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <Moon size={18} className="text-indigo-300" />
                    </motion.div>
                </div>
                {!compact && (
                    <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
                )}
            </div>
        </motion.button>
    );
}

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
                                    ? "bg-primary text-white shadow-soft dark:bg-slate-700 dark:text-white"
                                    : "text-muted hover:bg-gray-100 hover:text-primary"
                            }`}
                        >
                            <Icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200 bg-white space-y-2">
                {/* Nút Dark/Light Mode */}
                <ThemeToggleButton />

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
                    <div className="flex items-center gap-2">
                        {/* Nút Dark Mode compact ở mobile header */}
                        <ThemeToggleButton compact />
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2.5 text-primary hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
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
