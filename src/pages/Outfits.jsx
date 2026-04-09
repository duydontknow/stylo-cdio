import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
    getUserOutfits,
    deleteOutfit,
    createOutfit,
    updateOutfit,
} from "../services/outfits";
import { getUserClothes } from "../services/clothes";
import {
    Loader2,
    Trash2,
    Calendar,
    Tag,
    Plus,
    Edit,
    X,
    Check,
    Shirt,
    Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    DndContext,
    useDraggable,
    useDroppable,
    DragOverlay,
    pointerWithin,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";

// --- Custom Draggable Item ---
function DraggableItem({ cloth, isSelected }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: cloth.id,
            data: { cloth },
        });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        touchAction: "none",
        zIndex: isDragging ? 100 : "auto",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border-[3px] transition-all duration-200 bg-white shadow-sm ${isSelected
                ? "border-ai shadow-glow opacity-80"
                : "border-transparent hover:border-gray-200 hover:shadow-md"
                }`}
        >
            <div className="w-full h-full bg-gray-50/50 p-2">
                <img
                    src={cloth.image_url}
                    alt="Cloth"
                    className="w-full h-full object-cover pointer-events-none rounded-xl mix-blend-multiply"
                />
            </div>
            {isSelected && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none backdrop-blur-[1px]">
                    <div className="bg-ai text-white rounded-full p-1.5 shadow-lg">
                        <Check size={24} strokeWidth={3} />
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Custom Droppable Canvas ---
function DroppableCanvas({ children, selectedClothesCount }) {
    const { isOver, setNodeRef } = useDroppable({
        id: "canvas-droppable",
    });

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[280px] w-full border-2 rounded-[2rem] flex flex-col items-center justify-center p-6 transition-all duration-300 relative overflow-hidden
                ${isOver ? "border-ai bg-ai/5 shadow-[inset_0_0_30px_rgba(139,92,246,0.1)]" : "border-dashed border-gray-300 bg-gray-50/50"}
            `}
        >
            {selectedClothesCount === 0 ? (
                <div className="text-center text-muted pointer-events-none z-10 flex flex-col items-center">
                    <div className="bg-white shadow-sm border border-gray-100 p-4 rounded-[1.25rem] mb-4">
                        <Shirt size={40} className="text-gray-300" />
                    </div>
                    <p className="font-bold text-primary">Kéo thả trang phục vào đây</p>
                    <p className="text-sm font-medium mt-1 max-w-[200px]">Bạn hãy chọn đồ bên phải để tạo tuyệt tác ngay nhé!</p>
                </div>
            ) : (
                <div className="flex flex-wrap items-center justify-center gap-4 w-full h-full pointer-events-auto z-10">
                    <AnimatePresence>
                        {children}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

const outfitCardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

export default function Outfits() {
    const { user } = useAuth();
    const [outfits, setOutfits] = useState([]);
    const [wardrobe, setWardrobe] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingOutfit, setEditingOutfit] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        weather_suitability: "All",
        selectedClothes: [], 
    });

    const [activeDragItem, setActiveDragItem] = useState(null);

    const fetchData = async () => {
        try {
            const [outfitsData, wardrobeData] = await Promise.all([
                getUserOutfits(user.id),
                getUserClothes(user.id),
            ]);
            setOutfits(outfitsData);
            setWardrobe(wardrobeData);
        } catch (error) {
            console.error("Lỗi:", error);
            toast.error("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user.id]);

    const openCreateModal = () => {
        setEditingOutfit(null);
        setFormData({
            name: "",
            weather_suitability: "All",
            selectedClothes: [],
        });
        setIsModalOpen(true);
    };

    const openEditModal = (outfit) => {
        setEditingOutfit(outfit);
        setFormData({
            name: outfit.name,
            weather_suitability: outfit.weather_suitability || "All",
            selectedClothes: outfit.outfit_items.map((i) => i.clothes),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingOutfit(null);
    };

    const removeClothFromCanvas = (clothId) => {
        setFormData((prev) => ({
            ...prev,
            selectedClothes: prev.selectedClothes.filter((c) => c.id !== clothId),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error("Vui lòng nhập tên bộ đồ!");
        if (formData.selectedClothes.length < 2) return toast.error("Cần ít nhất 2 món đồ!");

        setIsSaving(true);
        const toastId = toast.loading("Đang lưu bộ phối đồ...");

        try {
            const selectedIds = formData.selectedClothes.map(c => c.id);
            if (editingOutfit) {
                await updateOutfit(
                    editingOutfit.id,
                    formData.name,
                    formData.weather_suitability,
                    selectedIds,
                );
            } else {
                await createOutfit(
                    user.id,
                    formData.name,
                    formData.weather_suitability,
                    selectedIds,
                    false,
                );
            }

            await fetchData();
            closeModal();
            toast.success("Đã lưu thành công!", { id: toastId });
        } catch (error) {
            toast.error("Lỗi khi lưu bộ đồ", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xoá bộ trang phục này?")) return;
        const toastId = toast.loading("Đang xoá...");
        try {
            await deleteOutfit(id);
            setOutfits(outfits.filter((o) => o.id !== id));
            toast.success("Đã xoá", { id: toastId });
        } catch (error) {
            toast.error("Lỗi khi xoá", { id: toastId });
        }
    };

    // --- KÉO THẢ ---
    const handleDragStart = (event) => {
        const { active } = event;
        setActiveDragItem(active.data.current.cloth);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (over && over.id === "canvas-droppable") {
            const cloth = active.data.current.cloth;
            setFormData((prev) => {
                const isExist = prev.selectedClothes.some(c => c.id === cloth.id);
                if (isExist) return prev;
                return {
                    ...prev,
                    selectedClothes: [...prev.selectedClothes, cloth]
                };
            });
        }
    };

    if (loading)
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="animate-spin text-ai" size={36} />
            </div>
        );

    return (
        <div className="max-w-6xl mx-auto space-y-8 relative pb-10 px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary tracking-tight">
                        Bộ sưu tập Outfit
                    </h1>
                    <p className="text-muted font-medium mt-1">
                        Tổng cộng {outfits.length} bộ trang phục đã được lưu
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <Link to="/ai-stylist" className="flex-1 sm:flex-none">
                        <Button variant="secondary" leftIcon={<Sparkles size={18} />} className="w-full">
                            Phối bằng AI
                        </Button>
                    </Link>
                    <Button 
                        variant="primary" 
                        leftIcon={<Plus size={18} />} 
                        onClick={openCreateModal}
                        className="flex-1 sm:flex-none"
                    >
                        Tạo tự do
                    </Button>
                </div>
            </div>

            {/* Content */}
            {outfits.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center py-24 bg-surface rounded-[2rem] border border-dashed border-gray-300 flex flex-col items-center shadow-glass"
                >
                    <div className="w-20 h-20 bg-ai/10 text-ai rounded-[1.5rem] flex items-center justify-center mb-6">
                        <Shirt size={40} />
                    </div>
                    <h2 className="text-xl font-bold text-primary mb-2">Tủ áo của bạn trống trải quá</h2>
                    <p className="text-muted mb-8 max-w-md font-medium">Bắt đầu ngay bằng việc nhờ AI gợi ý một vài bộ đồ chuẩn trend, hoặc tự Mix & Match The Look của riêng bạn.</p>
                    <div className="flex justify-center gap-4">
                        <Link to="/ai-stylist">
                            <Button variant="secondary" leftIcon={<Sparkles size={18} />}>
                                ✨ Phối đồ ngay
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    <AnimatePresence>
                        {outfits.map((outfit) => (
                            <motion.div
                                key={outfit.id}
                                variants={outfitCardVariants}
                                initial="hidden"
                                animate="show"
                                exit="exit"
                                layout
                                className="bg-surface rounded-[2rem] shadow-glass border border-gray-100 overflow-hidden flex flex-col group relative"
                            >
                                {/* Nút Floating Edit/Delete */}
                                <div className="absolute top-4 right-4 z-20 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 lg:translate-y-2 lg:group-hover:translate-y-0 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-gray-100">
                                    <button
                                        onClick={() => openEditModal(outfit)}
                                        className="p-2.5 text-primary hover:text-white hover:bg-blue-500 rounded-xl transition-all"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(outfit.id)}
                                        className="p-2.5 text-primary hover:text-white hover:bg-red-500 rounded-xl transition-all"
                                        title="Xóa"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Thông tin đầu card */}
                                <div className="p-6 border-b border-gray-50 bg-white relative z-10">
                                    <h3 className="font-bold text-primary text-xl leading-snug pr-12 line-clamp-1">
                                        {outfit.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant={outfit.is_ai_generated ? "ai" : "default"} className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-lg">
                                            {outfit.is_ai_generated ? "AI GỢI Ý" : "TỰ PHỐI"}
                                        </Badge>
                                        <span className="text-xs text-muted font-medium flex items-center">
                                            <Calendar size={12} className="mr-1" />
                                            {new Date(outfit.created_at).toLocaleDateString("vi-VN")}
                                        </span>
                                    </div>
                                </div>

                                {/* Grid Quần áo */}
                                <div className="p-6 flex-1 bg-gray-50/50">
                                    <div className="grid grid-cols-2 gap-4">
                                        {outfit.outfit_items?.map((itemObj) => (
                                            <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                key={itemObj.clothes.id}
                                                className="relative aspect-[3/4] rounded-[1rem] overflow-hidden shadow-sm bg-white border border-gray-100 p-1"
                                            >
                                                <img
                                                    src={itemObj.clothes.image_url}
                                                    alt="Item"
                                                    className="w-full h-full object-cover rounded-xl mix-blend-multiply"
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Card */}
                                <div className="px-6 py-5 bg-white border-t border-gray-50 flex items-center justify-between mt-auto">
                                    <Badge variant="outline" className="px-3 py-1.5 border-gray-200 shadow-sm rounded-xl">
                                        <Tag size={12} className="mr-1.5 text-gray-500" />
                                        <span className="font-semibold text-primary">{outfit.weather_suitability === "Hot" ? "Mùa hè" : outfit.weather_suitability === "Cold" ? "Mùa đông" : "Bốn mùa"}</span>
                                    </Badge>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* DND MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingOutfit ? "Sửa bộ trang phục" : "Stylist Bàn Vẽ"}
                size="full" /* size lớn kịch kim dành riêng cho Dnd */
                className="max-w-5xl h-[85vh] flex flex-col"
                bodyClassName="flex-1 p-0 flex flex-col overflow-hidden" 
            >
                <DndContext
                    collisionDetection={pointerWithin}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex flex-col lg:flex-row flex-1 h-full overflow-hidden">
                        {/* LEFT COLUMN: BUILDER */}
                        <div className="w-full lg:w-[45%] flex flex-col p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-y-auto bg-white custom-scrollbar relative">
                            {/* Ambient background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-ai/5 rounded-full blur-[80px] pointer-events-none -z-10" />

                            <form id="outfit-form" onSubmit={handleSubmit} className="space-y-6">
                                <Input
                                    label="Tên bộ trang phục (Outfit)"
                                    placeholder="VD: Cà phê dạo phố thu đông..."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    autoFocus
                                    className="bg-white/50"
                                />

                                <div>
                                    <label className="block text-sm font-semibold text-primary mb-2">Điều kiện thời tiết</label>
                                    <select
                                        value={formData.weather_suitability}
                                        onChange={(e) => setFormData({ ...formData, weather_suitability: e.target.value })}
                                        className="w-full h-12 px-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-ai text-primary appearance-none font-medium bg-white/50 shadow-sm"
                                    >
                                        <option value="All">Phù hợp Bốn mùa 🌤️</option>
                                        <option value="Hot">Phù hợp Mùa Hè ☀️</option>
                                        <option value="Cold">Phù hợp Mùa Đông ❄️</option>
                                    </select>
                                </div>

                                <div className="pt-4">
                                    <div className="flex justify-between items-end mb-3">
                                        <label className="block text-sm font-semibold text-primary">
                                            Bàn vẽ kết hợp (Mix & Match)
                                        </label>
                                        <Badge variant="ai" className="font-bold py-1 px-3 shadow-sm">
                                            {formData.selectedClothes.length} món
                                        </Badge>
                                    </div>

                                    <DroppableCanvas selectedClothesCount={formData.selectedClothes.length}>
                                        {formData.selectedClothes.map((cloth) => (
                                            <motion.div 
                                                layout
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                key={cloth.id} 
                                                className="relative w-[110px] aspect-[3/4] group shadow-sm rounded-2xl overflow-hidden bg-white border border-gray-100 p-1.5"
                                            >
                                                <img
                                                    src={cloth.image_url}
                                                    alt="Selected"
                                                    className="w-full h-full object-cover rounded-[10px] mix-blend-multiply"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeClothFromCanvas(cloth.id)}
                                                    className="absolute top-0 right-0 m-2 bg-white/80 backdrop-blur-md text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded-full opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all shadow-md z-20"
                                                >
                                                    <X size={14} strokeWidth={3} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </DroppableCanvas>
                                </div>
                            </form>

                            <div className="mt-8 flex justify-end gap-3 w-full">
                                <Button
                                    variant="ghost"
                                    onClick={closeModal}
                                    className="flex-1 bg-gray-50"
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="submit"
                                    form="outfit-form"
                                    isLoading={isSaving}
                                    variant="primary"
                                    className="flex-[2] shadow-glow"
                                >
                                    Lưu ngay tuyệt tác
                                </Button>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: WARDROBE DRAGGABLE */}
                        <div className="w-full lg:w-[55%] bg-surface flex flex-col overflow-hidden relative">
                            {/* Inner Header */}
                            <div className="p-5 border-b border-gray-100 bg-white/80 backdrop-blur-xl flex justify-between items-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-10 sticky top-0">
                                <h3 className="font-bold text-primary flex items-center gap-2">
                                    <Shirt size={18} className="text-ai" /> Mở Tủ Quần Áo
                                </h3>
                                <Badge variant="outline" className="border-gray-200">
                                    Kéo & Thả
                                </Badge>
                            </div>
                            
                            {/* Grid */}
                            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50 inset-shadow-sm">
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5 pb-10">
                                    {wardrobe.map((cloth) => {
                                        const isSelected = formData.selectedClothes.some((c) => c.id === cloth.id);
                                        return (
                                            <DraggableItem key={cloth.id} cloth={cloth} isSelected={isSelected} />
                                        );
                                    })}
                                    {wardrobe.length === 0 && (
                                        <div className="col-span-full py-16 flex flex-col items-center text-center text-muted">
                                            <Shirt size={48} className="mb-3 opacity-20" />
                                            <span className="font-semibold text-lg">Tủ đồ trống trơn</span>
                                            <span className="text-sm mt-1">Hãy tải quần áo lên trước nhé.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DragOverlay>
                        {activeDragItem ? (
                            <div className="w-[120px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl opacity-90 cursor-grabbing bg-white border-2 border-ai/50 transform scale-105 p-1.5">
                                <img src={activeDragItem.image_url} alt="Drag" className="w-full h-full object-cover rounded-xl mix-blend-multiply" />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </Modal>
        </div>
    );
}
