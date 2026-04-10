import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserClothes } from "../services/clothes";
import { getUserOutfits } from "../services/outfits";
import { Shirt, Layers, Sparkles, Plus, ThermometerSun, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useWeather } from "../hooks/useWeather";
import { motion } from "framer-motion";
import Button from "../components/common/Button";

// -- SKELETON COMPONENT --
const DashboardSkeleton = () => (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-1/3 mb-2"></div>
        <div className="h-5 bg-gray-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-3xl"></div>
            ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-3xl mt-8"></div>
    </div>
);

// -- ANIMATION VARIANTS --
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
    const { user } = useAuth();
    const userName = user?.email?.split("@")[0] || "Bạn";

    const currentHour = new Date().getHours();
    const greeting =
        currentHour < 12
            ? "Chào buổi sáng"
            : currentHour < 18
              ? "Chào buổi chiều"
              : "Chào buổi tối";

    const { weather } = useWeather();
    const [stats, setStats] = useState({ clothes: 0, outfits: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [clothes, outfits] = await Promise.all([
                    getUserClothes(user.id),
                    getUserOutfits(user.id),
                ]);
                setStats({ clothes: clothes.length, outfits: outfits.length });
            } catch (error) {
                console.error("Lỗi tải thống kê", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [user.id]);

    if (loading) return <DashboardSkeleton />;

    return (
        <motion.div 
            className="max-w-5xl mx-auto space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* Header chào mừng */}
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
                    {greeting}, <span className="text-ai">{userName}!</span> 👋
                </h1>
                <p className="text-muted mt-2 text-lg">Hôm nay bạn muốn mặc gì?</p>
            </motion.div>

            {/* Bento Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Stats Card - Quần áo */}
                <motion.div 
                    variants={itemVariants} 
                    whileHover={{ scale: 1.02 }}
                    className="bg-surface p-6 rounded-3xl border border-gray-100 shadow-glass flex flex-col justify-between"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                            <Shirt className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-primary mb-1">{stats.clothes}</p>
                        <p className="text-sm font-medium text-muted">Tổng trang phục</p>
                    </div>
                </motion.div>

                {/* Stats Card - Outfits */}
                <motion.div 
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    className="bg-surface p-6 rounded-3xl border border-gray-100 shadow-glass flex flex-col justify-between"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-ai/10 text-ai rounded-2xl flex items-center justify-center">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-primary mb-1">{stats.outfits}</p>
                        <p className="text-sm font-medium text-muted">Bộ phối đồ</p>
                    </div>
                </motion.div>

                {/* Khối Thời tiết (Glassmorphism + Gradient) */}
                <motion.div 
                    variants={itemVariants}
                    className="col-span-1 md:col-span-1 bg-gradient-to-br from-ai to-purple-800 p-6 rounded-3xl shadow-glow text-white relative overflow-hidden flex flex-col justify-between"
                >
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center space-x-2 text-white/80 text-sm font-medium">
                            <MapPin className="w-4 h-4" />
                            <span>{weather.location}</span>
                        </div>
                        <ThermometerSun className="w-6 h-6 text-white/80" />
                    </div>
                    <div className="relative z-10 mt-6">
                        <p className="text-4xl font-bold capitalize tracking-tight">
                            {weather.temp}°C
                        </p>
                        <p className="text-lg font-medium text-white/90 capitalize mb-1">
                            {weather.condition}
                        </p>
                        <p className="text-sm text-white/80 leading-relaxed">
                            {weather.advice || "Đang cập nhật gợi ý..."}
                        </p>
                    </div>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-900/40 rounded-full blur-3xl pointer-events-none"></div>
                </motion.div>
            </div>

            {/* AI Call to Action banner */}
            <motion.div variants={itemVariants}>
                {stats.clothes === 0 ? (
                    <div className="relative bg-primary rounded-[2rem] p-8 md:p-12 text-center text-white shadow-soft overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">Tủ đồ của bạn đang trống!</h2>
                            <p className="text-muted mb-8 max-w-md mx-auto">
                                Hãy bắt đầu số hóa tủ đồ của bạn bằng cách thêm những chiếc áo, chiếc quần yêu thích nhất.
                            </p>
                            <Link to="/wardrobe">
                                <Button variant="secondary" size="lg" leftIcon={<Plus className="w-5 h-5"/>}>
                                    Thêm trang phục đầu tiên
                                </Button>
                            </Link>
                        </div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                    </div>
                ) : (
                    <div className="relative bg-gradient-to-r from-primary to-[#1e1b4b] rounded-[2rem] p-8 md:p-12 text-center text-white shadow-soft overflow-hidden">
                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-full mb-6">
                                <Sparkles className="w-8 h-8 text-ai-light" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Không biết mặc gì hôm nay?</h2>
                            <p className="text-gray-400 mb-8 max-w-lg mx-auto text-lg">
                                Hãy để AI phân tích <span className="text-white font-semibold">{stats.clothes} món đồ</span> trong tủ và chọn ra trang phục hoàn hảo nhất cho bạn.
                            </p>
                            <Link to="/ai-stylist">
                                <Button variant="secondary" size="lg" className="px-8 shadow-glow" leftIcon={<Sparkles className="w-5 h-5"/>}>
                                    Trải nghiệm AI Stylist
                                </Button>
                            </Link>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-ai/20 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-900/30 rounded-full blur-3xl pointer-events-none"></div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
