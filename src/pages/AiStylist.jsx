import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserClothes } from "../services/clothes";
import { createOutfit } from "../services/outfits";
import { suggestOutfitsWithLLM } from "../utils/aiLogic";
import toast from "react-hot-toast";
import { useWeather } from "../hooks/useWeather";
import {
    Sparkles,
    Thermometer,
    Briefcase,
    Coffee,
    Heart,
    Loader2,
    CheckCircle,
} from "lucide-react";
import { getProfile } from "../services/profile";

export default function AiStylist() {
    const { user } = useAuth();
    const [wardrobe, setWardrobe] = useState([]);
    const [loading, setLoading] = useState(true);
    const [suggestedOutfits, setSuggestedOutfits] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const { weather } = useWeather();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        async function loadData() {
            const [clothesData, profileData] = await Promise.all([
                getUserClothes(user.id),
                getProfile(user.id),
            ]);
            setWardrobe(clothesData);
            setProfile(profileData);
            setLoading(false);
        }
        loadData();
    }, [user.id]);

    const handleGenerate = async (context) => {
        setIsGenerating(true);
        try {
            // Bây giờ AI thực sự đang làm việc!
            const results = await suggestOutfitsWithLLM(
                wardrobe,
                weather?.temp || 28,
                context,
                profile,
            );
            if (results.length > 0) {
                setSuggestedOutfits(results);
            } else {
                alert(
                    "AI đang bận hoặc tủ đồ của bạn chưa đủ đa dạng. Hãy thử lại!",
                );
            }
        } catch (error) {
            alert("Có lỗi khi kết nối với AI!");
        } finally {
            setIsGenerating(false);
        }
    };

    const saveSuggestedOutfit = async (outfit) => {
        const toastId = toast.loading("Đang lưu bộ trang phục...");
        try {
            const clothIds = outfit.items.map((i) => i.id);
            await createOutfit(user.id, outfit.name, "All", clothIds, true);
            toast.success("Đã lưu vào bộ sưu tập của bạn!", { id: toastId });
        } catch (error) {
            toast.error("Có lỗi xảy ra khi lưu!", { id: toastId });
        }
    };

    if (loading)
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="animate-spin" />
            </div>
        );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                    <Sparkles className="text-purple-500" /> AI Stylist
                </h1>
                <p className="text-gray-500 mt-2">
                    Để AI giúp bạn chọn bộ đồ hoàn hảo cho hôm nay
                </p>
            </div>

            {/* Chọn bối cảnh */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    {
                        id: "Work",
                        name: "Đi làm",
                        icon: Briefcase,
                        color: "bg-blue-500",
                    },
                    {
                        id: "Casual",
                        name: "Đi chơi",
                        icon: Coffee,
                        color: "bg-green-500",
                    },
                    {
                        id: "Date",
                        name: "Hẹn hò",
                        icon: Heart,
                        color: "bg-red-500",
                    },
                ].map((ctx) => (
                    <button
                        key={ctx.id}
                        onClick={() => handleGenerate(ctx.name)}
                        disabled={isGenerating}
                        className="flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div
                            className={`w-12 h-12 ${ctx.color} text-white rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                        >
                            <ctx.icon size={24} />
                        </div>
                        <span className="font-semibold text-gray-900">
                            {ctx.name}
                        </span>
                    </button>
                ))}
            </div>

            {/* Hiển thị kết quả AI */}
            {isGenerating && (
                <div className="text-center py-10">
                    <Loader2
                        className="animate-spin mx-auto mb-4 text-purple-500"
                        size={40}
                    />
                    <p className="text-gray-600 animate-pulse">
                        AI đang phân tích tủ đồ của bạn...
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!isGenerating &&
                    suggestedOutfits.map((outfit, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-3xl p-6 border-2 border-purple-100 shadow-xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-2xl text-xs font-bold">
                                GỢI Ý #{idx + 1}
                            </div>

                            <h3 className="font-bold text-xl mb-4">
                                {outfit.name}
                            </h3>

                            <div className="flex gap-4 mb-6">
                                {outfit.items.map((item) => (
                                    <div key={item.id} className="text-center">
                                        <img
                                            src={item.image_url}
                                            className="w-20 h-24 object-cover rounded-xl border border-gray-100 shadow-sm"
                                        />
                                        <p className="text-[10px] mt-1 text-gray-500">
                                            {item.categories?.name}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-purple-50 p-4 rounded-2xl mb-4">
                                <p className="text-sm text-purple-800 italic">
                                    " {outfit.reason} "
                                </p>
                            </div>

                            <button
                                onClick={() => saveSuggestedOutfit(outfit)}
                                className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                            >
                                <CheckCircle size={18} /> Lưu bộ đồ này
                            </button>
                        </div>
                    ))}
            </div>
        </div>
    );
}
