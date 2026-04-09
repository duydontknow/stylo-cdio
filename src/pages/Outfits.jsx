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

// Dnd-kit imports
import {
    DndContext,
    useDraggable,
    useDroppable,
    DragOverlay,
    pointerWithin,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

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
            className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing border-2 transition-all duration-200 bg-white ${isSelected
                ? "border-blue-500 shadow-md opacity-40 grayscale"
                : "border-transparent hover:border-gray-300"
                }`}
        >
            <img
                src={cloth.image_url}
                alt="Cloth"
                className="w-full h-full object-cover pointer-events-none"
            />
            {isSelected && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center pointer-events-none">
                    <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg">
                        <Check size={20} />
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
            className={`min-h-[250px] w-full border-2 rounded-2xl flex flex-col items-center justify-center p-6 transition-all duration-300 
                ${isOver ? "border-blue-500 bg-blue-50" : "border-dashed border-gray-300 bg-gray-50/50"}
            `}
        >
            {selectedClothesCount === 0 ? (
                <div className="text-center text-gray-400 pointer-events-none">
                    <div className="bg-gray-100 p-4 rounded-full inline-block mb-3">
                        <Shirt size={32} />
                    </div>
                    <p className="font-medium">Kéo thả trang phục vào đây</p>
                    <p className="text-xs mt-1">Chọn món đồ bên phải để phối màu</p>
                </div>
            ) : (
                <div className="flex flex-wrap items-center justify-center gap-3 w-full h-full pointer-events-auto">
                    {children}
                </div>
            )}
        </div>
    );
}

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
        selectedClothes: [], // Chứa MẢNG danh sách quần áo, thay vì chỉ ID
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
        // Trả về luôn object quần áo từ CSDL
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
                    false, // không phải tự tạo bởi AI
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

    // --- XỬ LÝ SỰ KIỆN KÉO THẢ ---
    const handleDragStart = (event) => {
        const { active } = event;
        setActiveDragItem(active.data.current.cloth);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveDragItem(null);

        // Nếu thả đúng vào vùng 'canvas-droppable'
        if (over && over.id === "canvas-droppable") {
            const cloth = active.data.current.cloth;

            // Nếu chưa có trong danh sách thì thêm vào
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
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );

    return (
        <div className="max-w-6xl mx-auto space-y-8 relative pb-10 px-4 md:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Bộ sưu tập phối đồ ({outfits.length})
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Những bộ trang phục bạn đã lưu hoặc tự tạo
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Link
                        to="/ai-stylist"
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                    >
                        <Sparkles size={18} /> <span className="hidden sm:inline">Phối bằng AI</span>
                    </Link>
                    <button
                        onClick={openCreateModal}
                        className="bg-black text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md"
                    >
                        <Plus size={18} /> <span className="hidden sm:inline">Tạo tự do</span>
                    </button>
                </div>
            </div>

            {outfits.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <p className="text-gray-400 mb-4">Bạn chưa có bộ đồ nào.</p>
                    <div className="flex justify-center gap-4">
                        <Link
                            to="/ai-stylist"
                            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                        >
                            ✨ Phối đồ bằng AI
                        </Link>
                        <button
                            onClick={openCreateModal}
                            className="text-black font-semibold hover:underline px-4 py-2"
                        >
                            Tự phối đồ ngay
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {outfits.map((outfit) => (
                        <div
                            key={outfit.id}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group relative hover:shadow-md transition-shadow"
                        >
                            <div className="absolute top-4 right-4 z-10 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 sm:translate-y-2 sm:group-hover:translate-y-0 bg-white p-1.5 rounded-2xl shadow-md border border-gray-200">
                                <button
                                    onClick={() => openEditModal(outfit)}
                                    className="p-2 text-gray-600 hover:text-white hover:bg-blue-500 rounded-xl transition-all"
                                >
                                    <Edit size={16} />
                                </button>
                                <div className="w-[1px] bg-gray-200 my-1"></div>
                                <button
                                    onClick={() => handleDelete(outfit.id)}
                                    className="p-2 text-gray-600 hover:text-white hover:bg-red-500 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="p-5 border-b border-gray-50 pt-6">
                                <h3 className="font-bold text-gray-900 text-lg leading-tight pr-10">
                                    {outfit.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                    <Calendar size={14} />
                                    <span>
                                        {new Date(outfit.created_at).toLocaleDateString("vi-VN")}
                                    </span>
                                    {!outfit.is_ai_generated && (
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                            TỰ PHỐI
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 flex-1 bg-gray-50/30">
                                <div className="grid grid-cols-2 gap-3">
                                    {outfit.outfit_items?.map((itemObj) => (
                                        <div
                                            key={itemObj.clothes.id}
                                            className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm bg-white"
                                        >
                                            <img
                                                src={itemObj.clothes.image_url}
                                                alt="Item"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="px-5 py-4 bg-white mt-auto">
                                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 w-fit px-3 py-1.5 rounded-full">
                                    <Tag size={12} />
                                    <span>{outfit.weather_suitability || "Bốn mùa"}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* POPUP MODAL VỚI KÉO THẢ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-lg md:text-xl flex items-center gap-2">
                                {editingOutfit ? "Chỉnh sửa bộ phối đồ" : "Tạo bộ phối đồ mới"}
                            </h2>
                            <button onClick={closeModal} className="text-gray-500 hover:bg-gray-200 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <DndContext
                            collisionDetection={pointerWithin}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                                {/* CỘT TRÁI: FORM + CANVAS KÉO THẢ */}
                                <div className="w-full lg:w-[45%] flex flex-col p-6 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-y-auto">
                                    <form id="outfit-form" onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                                Tên bộ trang phục <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VD: Phong cách đường phố thu đông..."
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black bg-gray-50 hover:bg-white transition-colors"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Dành cho thời tiết</label>
                                            <select
                                                value={formData.weather_suitability}
                                                onChange={(e) => setFormData({ ...formData, weather_suitability: e.target.value })}
                                                className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black bg-gray-50 hover:bg-white transition-colors"
                                            >
                                                <option value="All">Bốn mùa (All)</option>
                                                <option value="Hot">Mùa Hè (Hot)</option>
                                                <option value="Cold">Mùa Đông (Cold)</option>
                                            </select>
                                        </div>

                                        <div className="pt-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-3 flex justify-between items-center">
                                                <span>Canvas Mix & Match</span>
                                                <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                    Đã thả: {formData.selectedClothes.length} món
                                                </span>
                                            </label>

                                            <DroppableCanvas selectedClothesCount={formData.selectedClothes.length}>
                                                {/* Hiển thị các món đồ đã thả vào */}
                                                {formData.selectedClothes.map((cloth) => (
                                                    <div key={cloth.id} className="relative w-24 sm:w-32 aspect-[3/4] group border shadow-sm rounded-lg overflow-hidden bg-white">
                                                        <img
                                                            src={cloth.image_url}
                                                            alt="Selected"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {/* Nút xoá khỏi canvas */}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeClothFromCanvas(cloth.id)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </DroppableCanvas>
                                        </div>
                                    </form>

                                    <div className="mt-auto pt-6 flex justify-end gap-3 w-full">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-6 py-3 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition flex-1"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            form="outfit-form"
                                            disabled={isSaving}
                                            className="px-6 py-3 font-semibold bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2 flex-[2] shadow-lg pointer-events-auto"
                                        >
                                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : "Lưu bộ phối đồ"}
                                        </button>
                                    </div>
                                </div>

                                {/* CỘT PHẢI: TỦ ĐỒ (DRAGGABLE ITEMS) */}
                                <div className="w-full lg:w-[55%] bg-gray-50 flex flex-col overflow-hidden">
                                    <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
                                        <h3 className="font-bold text-gray-700">Tủ đồ cá nhân</h3>
                                        <span className="text-xs text-gray-400">Kéo sang trái để phối</span>
                                    </div>
                                    <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-10">
                                            {wardrobe.map((cloth) => {
                                                const isSelected = formData.selectedClothes.some((c) => c.id === cloth.id);
                                                return (
                                                    <DraggableItem key={cloth.id} cloth={cloth} isSelected={isSelected} />
                                                );
                                            })}
                                            {wardrobe.length === 0 && (
                                                <div className="col-span-full py-10 text-center text-gray-500 italic">
                                                    Không có đồ nào trong tủ.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Drag Overlay dành cho hiệu ứng khi đang kéo */}
                            <DragOverlay>
                                {activeDragItem ? (
                                    <div className="w-32 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl opacity-80 cursor-grabbing bg-white border-2 border-blue-500 transform scale-105">
                                        <img src={activeDragItem.image_url} alt="Drag" className="w-full h-full object-cover" />
                                    </div>
                                ) : null}
                            </DragOverlay>

                        </DndContext>
                    </div>
                </div>
            )}
        </div>
    );
}
