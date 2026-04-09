import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserClothes } from "../services/clothes";
import { createOutfit } from "../services/outfits";
import { suggestOutfitsWithLLM } from "../utils/aiLogic";
import toast from "react-hot-toast";
import { useWeather } from "../hooks/useWeather";
import {
    Sparkles,
    Briefcase,
    Coffee,
    Heart,
    Loader2,
    CheckCircle,
    Wand2,
    Target
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

    // AI Form states
    const [customContext, setCustomContext] = useState("");
    const [selectedStyle, setSelectedStyle] = useState("Bất kỳ");

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

    const handleGenerate = async (contextStr) => {
        if (!contextStr) {
            return toast.error("Vui lòng nhập trường hợp bạn muốn phối đồ!");
        }

        setIsGenerating(true);
        setSuggestedOutfits([]); // Xoá kết quả cũ

        try {
            const results = await suggestOutfitsWithLLM(
                wardrobe,
                weather?.temp || 28,
                { context: contextStr, style: selectedStyle },
                profile,
            );

            if (results.length > 0) {
                setSuggestedOutfits(results);
            } else {
                toast.error("AI không tìm thấy cách phối hợp lý. Vui lòng thêm đồ vào tủ!");
            }
        } catch (error) {
            toast.error("Có lỗi khi kết nối với AI!");
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
        <div className="max-w-4xl mx-auto space-y-8 px-4 md:px-0">
            <div className="text-center">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                    <Sparkles className="text-purple-500" /> AI Stylist Chuyên Nghiệp
                </h1>
                <p className="text-gray-500 mt-2">
                    Cố vấn phong cách AI sẽ giúp bạn thu hút mọi ánh nhìn
                </p>
            </div>

            {/* Vùng điều khiển AI */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                
                {/* 1. Nút chọn nhanh */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Chọn nhanh ngữ cảnh:</label>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        {[
                            { id: "Work", name: "Đi làm", icon: Briefcase, color: "bg-blue-500" },
                            { id: "Casual", name: "Dạo phố", icon: Coffee, color: "bg-green-500" },
                            { id: "Date", name: "Hẹn hò", icon: Heart, color: "bg-red-500" },
                        ].map((ctx) => (
                            <button
                                key={ctx.id}
                                onClick={() => {
                                    setCustomContext(ctx.name);
                                    handleGenerate(ctx.name);
                                }}
                                disabled={isGenerating}
                                className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 p-3 md:p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                                <div className={`w-8 h-8 md:w-10 md:h-10 ${ctx.color} text-white rounded-full flex items-center justify-center shadow-md`}>
                                    <ctx.icon size={18} className="md:w-5 md:h-5" />
                                </div>
                                <span className="font-semibold text-gray-800 text-sm md:text-base">{ctx.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Hoặc tự yêu cầu chi tiết</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {/* 2. Custom Prompt + Phong cách */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <Target size={16} /> Ngữ cảnh cụ thể
                        </label>
                        <input
                            type="text"
                            placeholder="VD: Đi dự tiệc sinh nhật ở nhà hàng sang trọng lúc 7h tối..."
                            value={customContext}
                            onChange={(e) => setCustomContext(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate(customContext)}
                            className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Phong cách (Style)</label>
                        <select
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                        >
                            <option value="Bất kỳ">Bất kỳ phong cách nào</option>
                            <option value="Minimalist (Tối giản)">Minimalist (Tối giản)</option>
                            <option value="Streetwear (Đường phố)">Streetwear (Đường phố)</option>
                            <option value="Vintage (Cổ điển)">Vintage (Cổ điển)</option>
                            <option value="Hàn Quốc (Thanh lịch)">Hàn Quốc (Thanh lịch)</option>
                            <option value="Y2K (Phá cách)">Y2K (Phá cách)</option>
                        </select>
                    </div>
                </div>

                {/* Nút bấm AI */}
                <button
                    onClick={() => handleGenerate(customContext)}
                    disabled={isGenerating || !customContext.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin" size={24} /> AI Đang tư duy...
                        </>
                    ) : (
                        <>
                            <Wand2 size={24} /> Bắt đầu phối đồ
                        </>
                    )}
                </button>
            </div>

            {/* Loaders */}
            {isGenerating && (
                <div className="text-center py-10">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                        <Sparkles className="absolute inset-0 m-auto text-purple-500 animate-pulse" size={28} />
                    </div>
                    <p className="text-gray-600 font-medium animate-pulse">
                        Đang phân tích {wardrobe.length} món đồ trong tủ...
                    </p>
                </div>
            )}

            {/* Hiển thị kết quả AI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!isGenerating &&
                    suggestedOutfits.map((outfit, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-3xl p-6 border-2 border-purple-100 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform"
                        >
                            <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1.5 rounded-bl-2xl text-xs font-bold z-10">
                                GỢI Ý #{idx + 1}
                            </div>

                            <h3 className="font-bold text-xl mb-4 pr-16 bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                                {outfit.name}
                            </h3>

                            <div className="flex flex-wrap gap-3 mb-6">
                                {outfit.items.map((item) => (
                                    <div key={item.id} className="text-center relative">
                                        <div className="w-24 h-32 rounded-xl overflow-hidden shadow-md border border-gray-100 bg-gray-50">
                                            <img
                                                src={item.image_url}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-2 -left-2 bg-white flex items-center justify-center p-1 rounded-full shadow-sm border border-gray-100">
                                            <div 
                                                className="w-4 h-4 rounded-full border border-gray-300" 
                                                style={{backgroundColor: item.color_hex}}
                                                title={item.color_hex}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-2xl mb-5 border border-purple-100/50 relative">
                                <Sparkles size={16} className="absolute top-3 left-3 text-purple-400" />
                                <p className="text-sm text-purple-900 font-medium pl-6 leading-relaxed">
                                    "{outfit.reason}"
                                </p>
                            </div>

                            <button
                                onClick={() => saveSuggestedOutfit(outfit)}
                                className="w-full bg-black text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-md"
                            >
                                <CheckCircle size={18} /> Lưu vào Bộ Sưu Tập
                            </button>
                        </div>
                    ))}
            </div>
        </div>
    );
}
