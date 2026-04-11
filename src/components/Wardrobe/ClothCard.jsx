import { RefreshCcw, Edit, Trash2, Droplets } from "lucide-react";
import { motion } from "framer-motion";
import Badge from "../common/Badge";
import { useTheme } from "../../contexts/ThemeContext";

export function ClothCard({ item, handleToggleStatus, openEditModal, handleDelete }) {
    const isWashing = item.status === "Washing";
    const { isDark } = useTheme();

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-surface rounded-[1.5rem] shadow-glass border border-gray-100 overflow-hidden group relative flex flex-col"
        >
            {/* Overlay Grid Actions (Glassmorphism) */}
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex flex-col items-center justify-center gap-4">
                <div className="flex gap-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <button
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        title={isWashing ? "Mang đi giặt" : "Đã giặt xong"}
                        className="bg-white/90 backdrop-blur-md p-3 rounded-2xl text-primary hover:text-ai hover:scale-110 transition-all shadow-lg"
                    >
                        <RefreshCcw size={20} />
                    </button>
                    <button
                        onClick={() => openEditModal(item)}
                        title="Chỉnh sửa"
                        className="bg-white/90 backdrop-blur-md p-3 rounded-2xl text-primary hover:text-blue-500 hover:scale-110 transition-all shadow-lg"
                    >
                        <Edit size={20} />
                    </button>
                    <button
                        onClick={() => handleDelete(item.id)}
                        title="Xóa trang phục"
                        className="bg-white/90 backdrop-blur-md p-3 rounded-2xl text-primary hover:text-red-500 hover:scale-110 transition-all shadow-lg"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Image container:
                - Light mode: bg-gray-50 (kem nhạt) + mix-blend-multiply → nền sạch, xóa phông tốt
                - Dark mode : bg-white      (trắng)    + mix-blend-multiply → giữ nguyên hiệu ứng
                Không dùng CSS override vì bg-gray-50 bị ghi đè global thành đen trong dark mode */}
            <div
                className="aspect-[3/4] relative overflow-hidden p-2"
                style={{ backgroundColor: isDark ? "#ffffff" : "#f9fafb" }}
            >
                <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    <img
                        src={item.image_url}
                        alt="Trang phục"
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 mix-blend-multiply ${
                            isWashing ? "grayscale opacity-50" : ""
                        }`}
                    />
                </div>
                
                {/* Status Badges */}
                <div className="absolute top-4 left-4 z-0 flex flex-col gap-2">
                    {isWashing && (
                        <Badge variant="warning" className="shadow-sm border border-yellow-200">
                            <Droplets size={12} className="mr-1" /> Đang giặt
                        </Badge>
                    )}
                </div>
            </div>

            {/* Info bar dưới — dùng bg-surface thay vì bg-white để dark mode tự override */}
            <div className="p-4 flex items-start justify-between bg-surface relative z-0">
                <div className="flex-1 overflow-hidden pr-2">
                    <p className="font-bold text-[15px] truncate text-primary">{item.categories?.name}</p>
                    <p className="text-xs font-medium text-muted mt-0.5">
                        {item.weather_suitability === 'All' ? 'Bốn mùa' : 
                         item.weather_suitability === 'Hot' ? 'Mùa hè' : 'Mùa đông'}
                    </p>
                </div>
                {/* Color Dot Indicator */}
                <div className="bg-surface p-1 rounded-full shadow-sm border border-gray-100 flex-shrink-0">
                    <div 
                        className="w-5 h-5 rounded-full border border-gray-200" 
                        style={{backgroundColor: item.color_hex}}
                        title={item.color_hex}
                    />
                </div>
            </div>
        </motion.div>
    );
}
