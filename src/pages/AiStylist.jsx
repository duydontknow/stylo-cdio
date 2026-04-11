import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
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
    CheckCircle,
    Wand2,
    Target
} from "lucide-react";
import { getProfile } from "../services/profile";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Badge from "../components/common/Badge";

// -- SKELETON COMPONENTS --
const AiSkeleton = () => (
    <div className="flex justify-center p-20">
        <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-ai-light/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-ai rounded-full border-t-transparent animate-spin"></div>
        </div>
    </div>
);

// -- ANIMATION VARIANTS --
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const outfitVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

export default function AiStylist() {
    const { user } = useAuth();
    const { isDark } = useTheme();
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

    if (loading) return <AiSkeleton />;

    return (
        <div className="max-w-4xl mx-auto space-y-8 px-4 md:px-0 relative">
            {/* Ambient Backgrounds */}
            <div className="absolute top-0 right-10 w-96 h-96 bg-ai-light/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-40 left-10 w-80 h-80 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center relative z-10"
            >
                <div className="inline-flex items-center justify-center p-3.5 bg-ai/10 text-ai rounded-2xl mb-4 shadow-glow">
                    <Sparkles size={28} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
                    AI Stylist
                </h1>
                <p className="text-muted mt-3 text-lg font-medium">
                    Hãy để trí tuệ nhân tạo chọn ra trang phục hoàn hảo nhất cho bạn hôm nay.
                </p>
            </motion.div>

            {/* AI Control Box (Glassmorphism) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-surface/70 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-glass space-y-8 relative z-10"
            >
                {/* 1. Nút chọn nhanh */}
                <div>
                    <label className="block text-sm font-semibold text-primary mb-3 pl-1">Ngữ cảnh đề xuất nhanh:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { id: "Work", name: "Đi làm", icon: Briefcase, color: "bg-blue-500", shadow: "shadow-blue-500/30", bgHover: "hover:bg-blue-50" },
                            { id: "Casual", name: "Dạo phố", icon: Coffee, color: "bg-green-500", shadow: "shadow-green-500/30", bgHover: "hover:bg-green-50" },
                            { id: "Date", name: "Hẹn hò", icon: Heart, color: "bg-red-500", shadow: "shadow-red-500/30", bgHover: "hover:bg-red-50" },
                        ].map((ctx) => (
                            <motion.button
                                key={ctx.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setCustomContext(ctx.name);
                                    handleGenerate(ctx.name);
                                }}
                                disabled={isGenerating}
                                className={`flex flex-row sm:flex-col md:flex-row items-center justify-center gap-3 p-4 bg-white rounded-2xl ${ctx.bgHover} transition-colors border border-gray-100 shadow-sm`}
                            >
                                <div className={`shrink-0 w-10 h-10 ${ctx.color} text-white rounded-[14px] flex items-center justify-center shadow-md ${ctx.shadow}`}>
                                    <ctx.icon size={20} />
                                </div>
                                <span className="font-bold text-primary">{ctx.name}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="relative flex items-center">
                    <div className="flex-grow border-t border-gray-200/60"></div>
                    <span className="flex-shrink-0 mx-4 text-muted text-sm font-medium">Hoặc tự yêu cầu chi tiết</span>
                    <div className="flex-grow border-t border-gray-200/60"></div>
                </div>

                {/* 2. Custom Prompt + Phong cách */}
                <div className="flex flex-col md:flex-row gap-5">
                    <div className="flex-1">
                        <Input
                            label={<span className="flex items-center gap-1.5"><Target size={16} /> Ngữ cảnh cụ thể</span>}
                            type="text"
                            placeholder="VD: Dự tiệc sinh nhật ở nhà hàng sang trọng lúc 7h tối..."
                            value={customContext}
                            onChange={(e) => setCustomContext(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate(customContext)}
                            className="bg-white/50"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <label className="block text-sm font-medium text-primary mb-1.5 ml-1">Phong cách (Style)</label>
                        <select
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className="flex h-12 w-full rounded-2xl border border-gray-200 bg-white/50 px-4 py-2 text-sm text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-light"
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
                <Button
                    onClick={() => handleGenerate(customContext)}
                    disabled={isGenerating || !customContext.trim()}
                    variant="secondary"
                    size="lg"
                    className="w-full !mt-8 shadow-glow text-lg rounded-[1.25rem]"
                    leftIcon={!isGenerating && <Wand2 size={24} />}
                    isLoading={isGenerating}
                >
                    {isGenerating ? "AI Đang phân tích..." : "Bắt đầu phối đồ"}
                </Button>
            </motion.div>

            {/* Scanner / Loading Animation */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-center py-10 relative z-10"
                    >
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 border-[6px] border-ai-light/20 rounded-full"></div>
                            <div className="absolute inset-0 border-[6px] border-ai rounded-full border-t-transparent animate-spin"></div>
                            <Sparkles className="absolute inset-0 m-auto text-ai animate-pulse" size={32} />
                        </div>
                        <p className="text-ai font-semibold text-lg animate-pulse tracking-wide">
                            Đang rà soát {wardrobe.length} món đồ trong tủ của bạn...
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hiển thị kết quả AI */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10"
                variants={containerVariants}
                initial="hidden"
                animate={!isGenerating && suggestedOutfits.length > 0 ? "show" : "hidden"}
            >
                <AnimatePresence>
                    {!isGenerating && suggestedOutfits.map((outfit, idx) => (
                        <motion.div
                            key={idx}
                            variants={outfitVariants}
                            layout
                            className="bg-surface/90 backdrop-blur-md rounded-[2.5rem] md:rounded-[2rem] p-5 md:p-6 border border-gray-100 shadow-glass relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 z-10">
                                <Badge variant="ai" className="rounded-bl-2xl rounded-tr-[2rem] rounded-tl-none rounded-br-none px-4 py-1.5 font-bold">
                                    GỢI Ý #{idx + 1}
                                </Badge>
                            </div>

                            <h3 className="font-bold text-xl mb-5 pr-16 bg-gradient-to-r from-ai to-purple-800 bg-clip-text text-transparent">
                                {outfit.name}
                            </h3>

                            <div className="flex flex-wrap gap-4 mb-6">
                                {outfit.items.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        whileHover={{ y: -5 }}
                                        className="text-center relative"
                                    >
                                        <div 
                                            className="w-[104px] h-[132px] rounded-[1.25rem] overflow-hidden shadow-sm border border-gray-100/50"
                                            style={{ backgroundColor: '#ffffff' }}
                                        >
                                            <img
                                                src={item.image_url}
                                                className="w-full h-full object-cover mix-blend-multiply"
                                                alt="Outfit item"
                                            />
                                        </div>
                                        {/* Color Dot Indicator */}
                                        <div className="absolute -bottom-2 -left-2 bg-white flex items-center justify-center p-1.5 rounded-full shadow-sm border border-gray-100">
                                            <div
                                                className="w-4 h-4 rounded-full border border-gray-200"
                                                style={{ backgroundColor: item.color_hex }}
                                                title={item.color_hex}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Lý do AI */}
                            <div className="bg-ai/5 p-5 rounded-[1.5rem] mb-6 border border-ai/10 relative">
                                <Sparkles size={18} className="absolute top-4 left-4 text-ai-light/80" />
                                <p className="text-sm text-primary font-medium pl-8 leading-relaxed italic">
                                    "{outfit.reason}"
                                </p>
                            </div>

                            <Button
                                onClick={() => saveSuggestedOutfit(outfit)}
                                variant="primary"
                                className="w-full h-12 shadow-soft text-[15px]"
                                leftIcon={<CheckCircle size={18} />}
                            >
                                Lưu vào Bộ sưu tập
                            </Button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
