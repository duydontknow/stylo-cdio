import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserClothes } from "../services/clothes";
import { getUserOutfits } from "../services/outfits";
import { Shirt, Layers, Sparkles, Plus, ThermometerSun, MapPin, User, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getProfile } from "../services/profile";
import { useWeather } from "../hooks/useWeather";
import { motion } from "framer-motion";
import Button from "../components/common/Button";

// -- SKELETON COMPONENT --
const DashboardSkeleton = () => (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-1/3 mb-2"></div>
        <div className="h-5 bg-gray-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <div className="h-24 bg-gray-200 rounded-3xl"></div>
            <div className="h-24 bg-gray-200 rounded-3xl"></div>
            <div className="h-24 lg:col-span-2 bg-gray-200 rounded-3xl"></div>
        </div>
        <div className="h-24 bg-gray-200 rounded-3xl mt-8"></div>
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
    const [profileStatus, setProfileStatus] = useState({ isComplete: true, data: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [clothes, outfits, profile] = await Promise.all([
                    getUserClothes(user.id),
                    getUserOutfits(user.id),
                    getProfile(user.id),
                ]);

                setStats({ clothes: clothes.length, outfits: outfits.length });

                const isComplete = !!(profile?.height && profile?.weight && profile?.body_shape && profile?.skin_tone);
                setProfileStatus({ isComplete, data: profile });

            } catch (error) {
                console.error("Lỗi tải dữ liệu", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Stats Card - Quần áo */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    className="bg-surface p-5 rounded-3xl border border-gray-100 shadow-glass flex items-center gap-4"
                >
                    <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center shrink-0">
                        <Shirt className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-primary leading-none mb-1">{stats.clothes}</p>
                        <p className="text-xs font-medium text-muted uppercase tracking-wider">Trang phục</p>
                    </div>
                </motion.div>

                {/* Stats Card - Outfits */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    className="bg-surface p-5 rounded-3xl border border-gray-100 shadow-glass flex items-center gap-4"
                >
                    <div className="w-12 h-12 bg-ai/10 text-ai rounded-2xl flex items-center justify-center shrink-0">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-primary leading-none mb-1">{stats.outfits}</p>
                        <p className="text-xs font-medium text-muted uppercase tracking-wider">Phối đồ</p>
                    </div>
                </motion.div>

                {/* Khối Thời tiết (Glassmorphism + Gradient) */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 lg:col-span-2 bg-gradient-to-br from-ai to-purple-800 p-6 rounded-3xl shadow-glow text-white relative overflow-hidden flex flex-col justify-between"
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

                {/* Personalization Suggestion Card */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    className={`col-span-1 md:col-span-2 lg:col-span-4 p-6 rounded-3xl border border-gray-100 shadow-glass overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-6 ${profileStatus.isComplete
                            ? "bg-surface"
                            : "bg-gradient-to-r from-ai/5 to-purple-50 dark:from-ai/10 dark:to-slate-900"
                        }`}
                >
                    <div className="flex items-center gap-6 relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${profileStatus.isComplete ? "bg-green-50 text-green-600" : "bg-ai/10 text-ai"
                            }`}>
                            <User className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-1">
                                {profileStatus.isComplete ? "Hồ sơ đã hoàn tất" : "Cá nhân hóa gợi ý"}
                            </h3>
                            <p className="text-muted text-sm max-w-md">
                                {profileStatus.isComplete
                                    ? "AI đang sử dụng chỉ số cơ thể của bạn để đưa ra những gợi ý phù hợp nhất."
                                    : "Cập nhật chỉ số cơ thể và phong cách để AI có thể đưa ra những gợi ý trang phục chuẩn xác hơn cho riêng bạn."}
                            </p>
                        </div>
                    </div>

                    <Link to="/profile" className="relative z-10 group shrink-0">
                        <Button
                            variant={profileStatus.isComplete ? "outline" : "primary"}
                            size="sm"
                            className="pr-2"
                            rightIcon={<ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        >
                            {profileStatus.isComplete ? "Chỉnh sửa hồ sơ" : "Hoàn thiện ngay"}
                        </Button>
                    </Link>

                    {/* Decorative background elements */}
                    {!profileStatus.isComplete && (
                        <>
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-ai/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute top-0 left-1/2 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
                        </>
                    )}
                </motion.div>
            </div>

            {/* AI Call to Action banner */}
            <motion.div variants={itemVariants}>
                {stats.clothes === 0 ? (
                    <div className="relative bg-primary rounded-[2rem] p-8 md:p-12 text-center text-white shadow-soft overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">Tủ đồ của bạn đang trống!</h2>
                            <p className="text-muted dark:text-slate-300 mb-8 max-w-md mx-auto">
                                Hãy bắt đầu số hóa tủ đồ của bạn bằng cách thêm những chiếc áo, chiếc quần yêu thích nhất.
                            </p>
                            <Link to="/wardrobe">
                                <Button variant="secondary" size="lg" leftIcon={<Plus className="w-5 h-5" />}>
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
                                <Button variant="secondary" size="lg" className="px-8 shadow-glow" leftIcon={<Sparkles className="w-5 h-5" />}>
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
