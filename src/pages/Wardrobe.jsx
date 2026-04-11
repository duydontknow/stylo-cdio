import { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useWardrobe } from "../hooks/useWardrobe";
import { useTheme } from "../contexts/ThemeContext";
import { ClothCard } from "../components/Wardrobe/ClothCard";
import { WardrobeSkeleton } from "../components/common/Skeletons";
import { WardrobeEmptyState } from "../components/common/EmptyStates";
import { Plus, Loader2, UploadCloud, ImageMinus } from "lucide-react";
import toast from "react-hot-toast";
import { fileToGenerativePart, analyzeClothingImage } from "../utils/aiLogic";
import { motion, AnimatePresence } from "framer-motion";

// Common Components
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";

const PREDEFINED_COLORS = [
    "#000000", "#ffffff", "#9ca3af", "#fef3c7",
    "#8b4513", "#1e3a8a", "#3b82f6", "#ef4444",
    "#22c55e", "#ec4899", "#eab308", "#8B5CF6"
];

export default function Wardrobe() {
    const { user } = useAuth();
    const { isDark } = useTheme();

    const {
        clothes,
        categories,
        loading,
        handleAddCloth,
        handleDeleteCloth,
        handleToggleClothStatus,
        handleUpdateClothDetails,
    } = useWardrobe(user?.id);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        category_id: "",
        color_hex: "#ffffff",
        weather_suitability: "All",
        description: "",
    });

    // Edit Modal states
    const [editingCloth, setEditingCloth] = useState(null);
    const [editFormData, setEditFormData] = useState({
        category_id: "",
        color_hex: "#ffffff",
        weather_suitability: "All",
        description: "",
    });

    // Initialize default category when categories jump in
    useMemo(() => {
        if (categories.length > 0 && !formData.category_id) {
            setFormData(prev => ({ ...prev, category_id: categories[0].id }));
        }
    }, [categories, formData.category_id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return toast.error("Vui lòng tải ảnh lên trước!");
        setIsUploading(true);
        const success = await handleAddCloth(file, formData);
        setIsUploading(false);
        if (success) {
            setShowForm(false);
            setFile(null);
        }
    };

    const openEditModal = (item) => {
        setEditingCloth(item);
        const currentCategoryId = item.category_id || item.categories?.id;
        setEditFormData({
            category_id: currentCategoryId || (categories.length > 0 ? categories[0].id : ""),
            color_hex: item.color_hex || "#ffffff",
            weather_suitability: item.weather_suitability || "All",
            description: item.description || "",
        });
    };

    const handleSaveEdit = async () => {
        const success = await handleUpdateClothDetails(editingCloth.id, editFormData);
        if (success) {
            setEditingCloth(null);
        }
    };

    if (loading) return <WardrobeSkeleton />;

    return (
        <div className="space-y-8 relative px-4 md:px-0">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
                        Tủ đồ của tôi
                    </h1>
                    <p className="text-muted font-bold mt-1">Đang có {clothes.length} món đồ</p>
                </div>

                <Button
                    variant="primary"
                    onClick={() => setShowForm(!showForm)}
                    leftIcon={showForm ? <ImageMinus size={20} /> : <Plus size={20} />}
                >
                    {showForm ? "Đóng form" : "Thêm đồ mới"}
                </Button>
            </div>

            {/* FORM THÊM MỚI (ANIMATED) */}
            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        onSubmit={handleSubmit}
                        className="bg-surface p-6 md:p-8 rounded-[2rem] shadow-glass border border-white overflow-hidden relative z-20"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
                            {/* KHU VỰC UPLOAD */}
                            <div className="border-2 border-dashed border-gray-200 rounded-[1.5rem] p-6 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50/50 hover:border-ai transition-all relative group min-h-[250px] md:min-h-[300px]">
                                {isAnalyzingImage && (
                                    <div className="absolute inset-0 z-30 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-[1.5rem]">
                                        <div className="relative w-12 h-12 mx-auto mb-3">
                                            <div className="absolute inset-0 border-4 border-ai-light/30 rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-ai rounded-full border-t-transparent animate-spin"></div>
                                        </div>
                                        <p className="text-sm font-bold text-primary">AI đang tách nền & phân tích...</p>
                                    </div>
                                )}
                                {file ? (
                                    <div
                                        className="w-full h-full p-4 flex items-center justify-center"
                                        style={{ backgroundColor: isDark ? '#ffffff' : 'transparent' }}
                                    >
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="Preview"
                                            className="w-full h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-40 transition-opacity"
                                        />
                                        <div className="absolute z-10 opacity-0 group-hover:opacity-100 bg-surface/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-glass border border-gray-100 transition-all font-bold text-sm text-primary">
                                            Nhấn đúp đổi ảnh
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="p-5 bg-ai/5 rounded-[1.5rem] mb-4 group-hover:scale-110 transition-transform group-hover:bg-ai/10">
                                            <UploadCloud className="w-10 h-10 text-ai" />
                                        </div>
                                        <h3 className="text-[17px] font-bold text-primary mb-1">Tải ảnh trang phục lên</h3>
                                        <p className="text-sm text-muted max-w-[220px]">
                                            AI sẽ tự động nhận diện màu sắc và phân loại giúp bạn.
                                        </p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const selectedFile = e.target.files[0];
                                        if (!selectedFile) return;
                                        setFile(selectedFile);

                                        try {
                                            setIsAnalyzingImage(true);
                                            const imagePart = await fileToGenerativePart(selectedFile);
                                            const aiResult = await analyzeClothingImage(imagePart, categories);

                                            if (aiResult?.category_id && aiResult?.color_hex) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    category_id: aiResult.category_id,
                                                    color_hex: aiResult.color_hex,
                                                    description: aiResult.description || ""
                                                }));
                                                toast.success("AI đã nhận diện xong!");
                                            }
                                        } catch (error) {
                                            console.error("AI Analysis Failed", error);
                                            toast.error("AI không thể nhận diện ảnh, bạn có thể chọn thủ công nhé.");
                                        } finally {
                                            setIsAnalyzingImage(false);
                                        }
                                    }}
                                    disabled={isAnalyzingImage || isUploading}
                                    className={`absolute inset-0 w-full h-full opacity-0 z-20 ${isAnalyzingImage || isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                />
                            </div>

                            {/* KHU VỰC ĐIỀN THÔNG TIN */}
                            <div className="space-y-6 flex flex-col justify-center">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-primary">
                                        Loại trang phục
                                    </label>
                                    <div className="relative">
                                        {(() => {
                                            // 1. Sort base categories: Name first, but move "Khác" to end
                                            const sortedItems = [...categories].sort((a, b) => {
                                                const aIsOther = a.name.includes("Khác") || a.name.includes("Other");
                                                const bIsOther = b.name.includes("Khác") || b.name.includes("Other");
                                                if (aIsOther && !bIsOther) return 1;
                                                if (!aIsOther && bIsOther) return -1;
                                                return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
                                            });

                                            // 2. Group by type
                                            const groupedCategories = sortedItems.reduce((acc, cat) => {
                                                const type = cat.type || "Khác";
                                                acc[type] = acc[type] || [];
                                                acc[type].push(cat);
                                                return acc;
                                            }, {});

                                            const typeOrder = ["Tops", "Bottoms", "Outerwear", "Footwear", "Accessories", "Khác"];
                                            const translateType = {
                                                Tops: "CÁC LOẠI ÁO",
                                                Bottoms: "QUẦN & VÁY",
                                                Outerwear: "ÁO KHOÁC",
                                                Footwear: "GIÀY DÉP",
                                                Accessories: "PHỤ KIỆN",
                                                Khác: "KHÁC",
                                            };

                                            // 3. Sort groups based on typeOrder
                                            const sortedGroups = Object.keys(groupedCategories).sort((a, b) => {
                                                const indexA = typeOrder.indexOf(a);
                                                const indexB = typeOrder.indexOf(b);
                                                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                                if (indexA !== -1) return -1;
                                                if (indexB !== -1) return 1;
                                                return a.localeCompare(b);
                                            });

                                            return (
                                                <select
                                                    value={formData.category_id}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, category_id: e.target.value })
                                                    }
                                                    className="w-full h-12 px-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-ai bg-surface transition-all appearance-none font-medium"
                                                >
                                                    {sortedGroups.map((type) => (
                                                        <optgroup key={type} label={translateType[type] || type} className="font-bold bg-white">
                                                            {[...groupedCategories[type]]
                                                                .sort((a, b) => {
                                                                    const aIsOther = a.name.includes("Khác") || a.name.includes("Không xác định") || a.name.includes("Other");
                                                                    const bIsOther = b.name.includes("Khác") || b.name.includes("Không xác định") || b.name.includes("Other");
                                                                    if (aIsOther && !bIsOther) return 1;
                                                                    if (!aIsOther && bIsOther) return -1;
                                                                    return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
                                                                })
                                                                .map((cat) => (
                                                                    <option key={cat.id} value={cat.id} className="font-medium">
                                                                        {cat.name}
                                                                    </option>
                                                                ))
                                                            }
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            );
                                        })()}
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Chọn Màu Sắc */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-primary">Màu sắc chính</label>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {PREDEFINED_COLORS.map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, color_hex: color })}
                                                    className={`w-[30px] h-[30px] rounded-full border shadow-sm transition-transform hover:scale-110 ${formData.color_hex.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-primary ring-offset-2 scale-110 border-transparent' : 'border-gray-200'}`}
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 border border-gray-200 p-1.5 rounded-xl bg-gray-50/50 w-fit">
                                            <input
                                                type="color"
                                                value={formData.color_hex}
                                                onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                                                className="w-7 h-7 rounded-[8px] cursor-pointer border-0 p-0 overflow-hidden"
                                                title="Mở bảng chọn màu nâng cao"
                                            />
                                            <span className="text-xs font-bold text-primary uppercase pr-3 font-mono">
                                                {formData.color_hex}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Chọn Thời tiết */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-primary">Thời tiết gợi ý</label>
                                        <div className="relative">
                                            <select
                                                value={formData.weather_suitability}
                                                onChange={(e) => setFormData({ ...formData, weather_suitability: e.target.value })}
                                                className="w-full h-12 px-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-ai bg-surface hover:bg-gray-50 transition-all appearance-none font-medium"
                                            >
                                                <option value="All">Bốn mùa 🌤️</option>
                                                <option value="Hot">Mùa Hè ☀️</option>
                                                <option value="Cold">Mùa Đông ❄️</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Ô nhập Mô tả chi tiết */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-primary pl-1">Đặc điểm & Chi tiết (Do AI tự nhập hoặc tự điền)</label>
                                    <textarea
                                        placeholder="Ví dụ: Áo thun Oversize chất cotton mềm, cổ tròn, họa tiết in graphic..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full min-h-[100px] p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-ai bg-white transition-all font-medium placeholder:text-gray-300 resize-none"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    isLoading={isUploading}
                                    variant="primary"
                                    className="w-full !mt-6 shadow-soft"
                                >
                                    {isUploading ? "Đang xử lý..." : "Lưu vào Tủ Đồ"}
                                </Button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* DANH SÁCH QUẦN ÁO BẰNG ANIMATE DASHBOARD */}
            {clothes.length === 0 && !showForm ? (
                <WardrobeEmptyState onAction={() => setShowForm(true)} />
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
                >
                    <AnimatePresence>
                        {clothes.map((item) => (
                            <ClothCard
                                key={item.id}
                                item={item}
                                handleToggleStatus={handleToggleClothStatus}
                                openEditModal={openEditModal}
                                handleDelete={handleDeleteCloth}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* POPUP MODAL CHỈNH SỬA - TÍCH HỢP UI COMPONENT */}
            <Modal
                isOpen={!!editingCloth}
                onClose={() => setEditingCloth(null)}
                title="Sửa thông tin đồ"
                size="md"
            >
                {editingCloth && (
                    <div className="space-y-6">
                        {/* Preview Ảnh Nhỏ */}
                        <div className="flex gap-4 items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            {/* bg luôn trắng để mix-blend-multiply hoạt động đúng cả light & dark */}
                            <div className="w-[72px] h-[88px] rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0" style={{ backgroundColor: '#ffffff' }}>
                                <img
                                    src={editingCloth.image_url}
                                    className="w-full h-full object-cover mix-blend-multiply"
                                    alt="Preview edit"
                                />
                            </div>
                            <p className="text-sm text-muted leading-relaxed font-medium">
                                Không thể thay thế hình ảnh. Nếu nhầm ảnh, bạn vui lòng xóa và đăng món đồ mới nhé.
                            </p>
                        </div>

                        {/* Fields */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-primary text-left">Đổi phân loại</label>
                                <select
                                    value={editFormData.category_id}
                                    onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })}
                                    className="w-full h-12 px-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-ai text-primary appearance-none font-medium"
                                >
                                    {/* reuse same sort logic for consistency */}
                                    {[...categories]
                                        .sort((a, b) => {
                                            const aIsOther = a.name.includes("Khác") || a.name.includes("Other");
                                            const bIsOther = b.name.includes("Khác") || b.name.includes("Other");
                                            if (aIsOther && !bIsOther) return 1;
                                            if (!aIsOther && bIsOther) return -1;
                                            return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
                                        })
                                        .map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2 sm:col-span-1 text-left">
                                    <label className="block text-sm font-semibold mb-2 text-primary">Chỉnh màu</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {PREDEFINED_COLORS.slice(0, 8).map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setEditFormData({ ...editFormData, color_hex: color })}
                                                className={`w-6 h-6 rounded-full border shadow-sm transition-transform hover:scale-110 ${editFormData.color_hex.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'border-gray-200'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={editFormData.color_hex}
                                            onChange={(e) => setEditFormData({ ...editFormData, color_hex: e.target.value })}
                                            className="w-8 h-8 rounded-xl cursor-pointer border-0 p-0"
                                        />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <label className="block text-sm font-semibold mb-2 text-primary">Thời tiết</label>
                                    <select
                                        value={editFormData.weather_suitability}
                                        onChange={(e) => setEditFormData({ ...editFormData, weather_suitability: e.target.value })}
                                        className="w-full h-12 px-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-ai text-primary appearance-none font-medium"
                                    >
                                        <option value="All">Bốn mùa</option>
                                        <option value="Hot">Mùa Hè</option>
                                        <option value="Cold">Mùa Đông</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-primary text-left">Đặc điểm món đồ</label>
                                <textarea
                                    placeholder="Miêu tả chi tiết..."
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="w-full min-h-[100px] p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-ai text-primary transition-all font-medium resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setEditingCloth(null)} className="flex-1 bg-gray-100 hover:bg-gray-200">
                                Hủy
                            </Button>
                            <Button variant="primary" onClick={handleSaveEdit} className="flex-1">
                                Cập nhật
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
