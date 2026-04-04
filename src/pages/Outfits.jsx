import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
    getUserOutfits,
    deleteOutfit,
    createOutfit,
    updateOutfit,
} from "../services/outfits";
import { getUserClothes } from "../services/clothes"; // Import thêm để lấy tủ đồ
import {
    Loader2,
    Trash2,
    Calendar,
    Tag,
    Plus,
    Edit,
    X,
    Check,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Outfits() {
    const { user } = useAuth();
    const [outfits, setOutfits] = useState([]);
    const [wardrobe, setWardrobe] = useState([]); // Chứa danh sách quần áo để chọn
    const [loading, setLoading] = useState(true);

    // State cho Modal Thêm/Sửa
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingOutfit, setEditingOutfit] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        weather_suitability: "All",
        selectedClothes: [], // Mảng chứa ID các món đồ được chọn
    });

    // Tải dữ liệu bộ phối và tủ đồ cùng lúc
    const fetchData = async () => {
        try {
            const [outfitsData, wardrobeData] = await Promise.all([
                getUserOutfits(user.id),
                getUserClothes(user.id),
            ]);
            setOutfits(outfitsData);
            setWardrobe(wardrobeData);
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            toast.error("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user.id]);

    // --- CÁC HÀM XỬ LÝ MODAL ---
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
            selectedClothes: outfit.outfit_items.map((i) => i.clothes.id), // Lấy sẵn các ID đồ cũ
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingOutfit(null);
    };

    // --- HÀM CHỌN QUẦN ÁO TRONG MODAL ---
    const toggleClothSelection = (clothId) => {
        setFormData((prev) => ({
            ...prev,
            selectedClothes: prev.selectedClothes.includes(clothId)
                ? prev.selectedClothes.filter((id) => id !== clothId) // Nếu đã chọn thì bỏ chọn
                : [...prev.selectedClothes, clothId], // Nếu chưa chọn thì thêm vào
        }));
    };

    // --- HÀM LƯU (THÊM HOẶC SỬA) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim())
            return toast.error("Vui lòng nhập tên bộ đồ!");
        if (formData.selectedClothes.length < 2)
            return toast.error("Một bộ đồ cần ít nhất 2 món!");

        setIsSaving(true);
        const toastId = toast.loading("Đang lưu bộ phối đồ...");

        try {
            if (editingOutfit) {
                // Cập nhật
                await updateOutfit(
                    editingOutfit.id,
                    formData.name,
                    formData.weather_suitability,
                    formData.selectedClothes,
                );
            } else {
                // Thêm mới (Truyền false vì đây là người dùng tự tạo, không phải AI)
                await createOutfit(
                    user.id,
                    formData.name,
                    formData.weather_suitability,
                    formData.selectedClothes,
                    false,
                );
            }

            await fetchData(); // Tải lại danh sách mới nhất
            closeModal();
            toast.success("Đã lưu thành công!", { id: toastId });
        } catch (error) {
            toast.error("Lỗi khi lưu bộ đồ", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    // --- HÀM XÓA ---
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xoá bộ trang phục này?")) return;
        const toastId = toast.loading("Đang xoá...");
        try {
            await deleteOutfit(id);
            setOutfits(outfits.filter((o) => o.id !== id));
            toast.success("Đã xoá bộ trang phục", { id: toastId });
        } catch (error) {
            toast.error("Lỗi khi xoá", { id: toastId });
        }
    };

    if (loading)
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );

    return (
        <div className="max-w-6xl mx-auto space-y-8 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Bộ sưu tập phối đồ ({outfits.length})
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Những bộ trang phục bạn đã lưu hoặc tự tạo
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition shadow-sm"
                >
                    <Plus size={18} /> Tạo bộ đồ mới
                </button>
            </div>

            {outfits.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <p className="text-gray-400 mb-4">Bạn chưa có bộ đồ nào.</p>
                    <button
                        onClick={openCreateModal}
                        className="text-black font-semibold hover:underline"
                    >
                        Tự phối đồ ngay
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {outfits.map((outfit) => (
                        <div
                            key={outfit.id}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group relative"
                        >
                            {/* Menu thao tác nhanh (Sửa/Xóa) nổi bật */}
                            <div className="absolute top-4 right-4 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 bg-white p-1.5 rounded-2xl shadow-xl border border-gray-200">
                                <button
                                    onClick={() => openEditModal(outfit)}
                                    className="p-2 text-gray-600 hover:text-white hover:bg-blue-500 rounded-xl transition-all shadow-sm hover:shadow-md"
                                    title="Chỉnh sửa"
                                >
                                    <Edit size={16} />
                                </button>

                                {/* Dòng kẻ dọc phân cách */}
                                <div className="w-[1px] bg-gray-200 my-1"></div>

                                <button
                                    onClick={() => handleDelete(outfit.id)}
                                    className="p-2 text-gray-600 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm hover:shadow-md"
                                    title="Xóa bộ đồ"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Header của thẻ bộ đồ */}
                            <div className="p-5 border-b border-gray-50 flex justify-between items-start pt-6">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight pr-10">
                                        {outfit.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                        <Calendar size={14} />
                                        <span>
                                            {new Date(
                                                outfit.created_at,
                                            ).toLocaleDateString("vi-VN")}
                                        </span>
                                        {!outfit.is_ai_generated && (
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                                TỰ PHỐI
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách ảnh các món đồ */}
                            <div className="p-5 flex-1 bg-gray-50/30">
                                <div className="grid grid-cols-2 gap-3">
                                    {outfit.outfit_items?.map((itemObj) => (
                                        <div
                                            key={itemObj.clothes.id}
                                            className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white shadow-sm bg-white"
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

                            {/* Tag phân loại */}
                            <div className="px-5 py-4 bg-white mt-auto">
                                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-full">
                                    <Tag size={12} />
                                    <span>
                                        {outfit.weather_suitability ||
                                            "Bốn mùa"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* POPUP MODAL THÊM/SỬA BỘ ĐỒ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-xl">
                                {editingOutfit
                                    ? "Chỉnh sửa bộ phối đồ"
                                    : "Tự phối đồ mới"}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:bg-gray-200 p-2 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Tên bộ trang phục{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="VD: Dạo phố cuối tuần"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Dành cho thời tiết
                                    </label>
                                    <select
                                        value={formData.weather_suitability}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                weather_suitability:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black"
                                    >
                                        <option value="All">Bốn mùa</option>
                                        <option value="Hot">
                                            Mùa Hè (Nóng)
                                        </option>
                                        <option value="Cold">
                                            Mùa Đông (Lạnh)
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <label className="block text-sm font-medium">
                                        Chọn quần áo từ tủ đồ{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        Đã chọn:{" "}
                                        {formData.selectedClothes.length} món
                                    </span>
                                </div>

                                {/* Lưới chọn quần áo */}
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
                                    {wardrobe.map((cloth) => {
                                        const isSelected =
                                            formData.selectedClothes.includes(
                                                cloth.id,
                                            );
                                        return (
                                            <div
                                                key={cloth.id}
                                                onClick={() =>
                                                    toggleClothSelection(
                                                        cloth.id,
                                                    )
                                                }
                                                className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${isSelected ? "border-blue-500 shadow-md scale-[0.98]" : "border-transparent hover:border-gray-300"}`}
                                            >
                                                <img
                                                    src={cloth.image_url}
                                                    alt="Cloth"
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Lớp mờ và dấu check khi được chọn */}
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                        <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg">
                                                            <Check size={24} />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                                                    <p className="text-[10px] text-white truncate">
                                                        {cloth.categories?.name}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {wardrobe.length === 0 && (
                                    <p className="text-sm text-red-500 italic">
                                        Tủ đồ trống. Hãy thêm quần áo trước!
                                    </p>
                                )}
                            </div>
                        </form>

                        <div className="p-5 border-t flex justify-end gap-3 bg-gray-50">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-6 py-2.5 font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="px-6 py-2.5 font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <Loader2
                                        className="animate-spin"
                                        size={18}
                                    />
                                ) : (
                                    "Lưu bộ đồ"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
