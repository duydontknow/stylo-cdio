import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserClothes } from "../services/clothes";
import { getUserOutfits } from "../services/outfits";
import { Shirt, Layers, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useWeather } from "../hooks/useWeather";

export default function Dashboard() {
    const { user } = useAuth();
    const userName = user?.email?.split("@")[0] || "Bạn";

    // --- LOGIC TỰ ĐỘNG LỜI CHÀO ---
    const currentHour = new Date().getHours();
    const greeting =
        currentHour < 12
            ? "Chào buổi sáng"
            : currentHour < 18
              ? "Chào buổi chiều"
              : "Chào buổi tối";
    // ------------------------------

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

    if (loading)
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header chào mừng */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    {/* SỬ DỤNG BIẾN GREETING Ở ĐÂY */}
                    {greeting}, {userName}! 👋
                </h1>
                <p className="text-gray-500 mt-2">Hôm nay bạn muốn mặc gì?</p>
            </div>

            {/* Khu vực thẻ thống kê (Stats Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mr-4">
                        <Shirt className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                            Tổng quần áo
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                            {stats.clothes}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mr-4">
                        <Layers className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                            Bộ trang phục
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                            {stats.outfits}
                        </p>
                    </div>
                </div>

                {/* Khối Thời tiết tĩnh (Có thể tích hợp OpenWeather sau nếu muốn) */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-center relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-white/80 mb-1">
                            Thời tiết tại {weather.location}
                        </p>
                        <p className="text-2xl font-bold capitalize">
                            {weather.temp}°C - {weather.condition}
                        </p>
                        <p className="text-sm mt-1 text-white/90">
                            {weather.temp > 25
                                ? "Rất hợp mặc đồ thoáng mát!"
                                : "Nhớ mặc đủ ấm nhé!"}
                        </p>
                    </div>
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>
            </div>

            {/* Lời kêu gọi hành động linh hoạt */}
            {stats.clothes === 0 ? (
                <div className="bg-black rounded-3xl p-8 md:p-12 text-center text-white shadow-xl">
                    <h2 className="text-2xl font-bold mb-3">
                        Tủ đồ của bạn đang trống!
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        Hãy bắt đầu số hóa tủ đồ của bạn bằng cách thêm những
                        chiếc áo, chiếc quần yêu thích nhất.
                    </p>
                    <Link
                        to="/wardrobe"
                        className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all inline-block hover:scale-105"
                    >
                        + Thêm trang phục đầu tiên
                    </Link>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl">
                    <h2 className="text-2xl font-bold mb-3">
                        Không biết mặc gì hôm nay?
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        Hãy để AI phân tích {stats.clothes} món đồ trong tủ và
                        chọn ra trang phục hoàn hảo nhất cho bạn.
                    </p>
                    <Link
                        to="/ai-stylist"
                        className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all inline-block hover:scale-105"
                    >
                        ✨ Trải nghiệm AI Stylist
                    </Link>
                </div>
            )}
        </div>
    );
}
