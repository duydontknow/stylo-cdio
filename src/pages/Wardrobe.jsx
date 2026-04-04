import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
    getCategories,
    getUserClothes,
    addCloth,
    deleteCloth,
    updateClothStatus,
    updateClothDetails,
} from "../services/clothes";
import {
    Plus,
    Loader2,
    UploadCloud,
    Trash2,
    RefreshCcw,
    Edit,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Wardrobe() {
    const { user } = useAuth();

    const [clothes, setClothes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho Form Thêm Mới
    const [showForm, setShowForm] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        category_id: "",
        color_hex: "#ffffff",
        weather_suitability: "All",
    });

    // State cho Modal Chỉnh sửa
    const [editingCloth, setEditingCloth] = useState(null);
    const [editFormData, setEditFormData] = useState({
        category_id: "",
        color_hex: "#ffffff",
        weather_suitability: "All",
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [cats, userClothes] = await Promise.all([
                    getCategories(),
                    getUserClothes(user.id),
                ]);
                setCategories(cats);
                setClothes(userClothes);
                if (cats.length > 0)
                    setFormData((prev) => ({
                        ...prev,
                        category_id: cats[0].id,
                    }));
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user.id]);

    // --- HÀM THÊM MỚI ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error("Vui lòng chọn một bức ảnh!");
            return;
        }

        const toastId = toast.loading("Đang tải trang phục lên...");
        setIsUploading(true);

        try {
            const newCloth = await addCloth(file, {
                ...formData,
                user_id: user.id,
            });
            const selectedCat = categories.find(
                (c) => c.id === formData.category_id,
            );
            setClothes([{ ...newCloth, categories: selectedCat }, ...clothes]);

            setShowForm(false);
            setFile(null);
            toast.success("Đã thêm vào tủ đồ!", { id: toastId });
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tải lên!", { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    // --- HÀM XÓA ---
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa món đồ này?")) return;

        const toastId = toast.loading("Đang xóa...");
        try {
            await deleteCloth(id);
            setClothes(clothes.filter((item) => item.id !== id));
            toast.success("Đã xóa trang phục", { id: toastId });
        } catch (error) {
            toast.error("Lỗi khi xóa trang phục", { id: toastId });
        }
    };

    // --- HÀM ĐỔI TRẠNG THÁI ---
    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === "Clean" ? "Washing" : "Clean";
        const toastId = toast.loading("Đang cập nhật...");
        try {
            await updateClothStatus(id, newStatus);
            setClothes(
                clothes.map((item) =>
                    item.id === id ? { ...item, status: newStatus } : item,
                ),
            );
            toast.success(
                newStatus === "Clean" ? "Đã giặt xong!" : "Đã mang đi giặt!",
                { id: toastId },
            );
        } catch (error) {
            toast.error("Lỗi cập nhật", { id: toastId });
        }
    };

    // --- HÀM MỞ MODAL CHỈNH SỬA ---
    const openEditModal = (item) => {
        setEditingCloth(item);
        // Lấy category_id từ quan hệ categories (nếu API trả về lồng nhau) hoặc trực tiếp từ item
        const currentCategoryId = item.category_id || item.categories?.id;
        setEditFormData({
            category_id:
                currentCategoryId ||
                (categories.length > 0 ? categories[0].id : ""),
            color_hex: item.color_hex || "#ffffff",
            weather_suitability: item.weather_suitability || "All",
        });
    };

    // --- HÀM LƯU CHỈNH SỬA ---
    const handleSaveEdit = async () => {
        const toastId = toast.loading("Đang lưu thay đổi...");
        try {
            await updateClothDetails(editingCloth.id, {
                category_id: editFormData.category_id,
                color_hex: editFormData.color_hex,
                weather_suitability: editFormData.weather_suitability,
            });

            // Cập nhật lại UI không cần load lại web
            const updatedCategory = categories.find(
                (c) => c.id === editFormData.category_id,
            );
            setClothes(
                clothes.map((item) => {
                    if (item.id === editingCloth.id) {
                        return {
                            ...item,
                            category_id: editFormData.category_id,
                            color_hex: editFormData.color_hex,
                            weather_suitability:
                                editFormData.weather_suitability,
                            categories: updatedCategory, // Cập nhật tên loại để hiển thị
                        };
                    }
                    return item;
                }),
            );

            setEditingCloth(null); // Đóng Modal
            toast.success("Cập nhật thành công!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Có lỗi khi cập nhật!", { id: toastId });
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-gray-400 w-8 h-8" />
            </div>
        );

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    Tủ đồ của tôi ({clothes.length})
                </h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800"
                >
                    <Plus className="w-4 h-4" /> Thêm đồ mới
                </button>
            </div>

            {/* FORM THÊM MỚI */}
            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 relative overflow-hidden">
                        {file ? (
                            <img
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                className="absolute inset-0 w-full h-full object-cover opacity-50"
                            />
                        ) : (
                            <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                        )}
                        <p className="text-sm text-gray-600 mb-2 relative z-10 font-medium">
                            {file ? file.name : "Nhấn để chọn ảnh quần áo"}
                        </p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="relative z-10 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Loại trang phục
                            </label>
                            {(() => {
                                // Tự động gộp nhóm theo 'type' (Tops, Bottoms...)
                                const groupedCategories = categories.reduce(
                                    (acc, cat) => {
                                        const type = cat.type || "Khác";
                                        acc[type] = acc[type] || [];
                                        acc[type].push(cat);
                                        return acc;
                                    },
                                    {},
                                );

                                // Dịch tiếng Anh sang tiếng Việt có kèm Icon
                                const translateType = {
                                    Tops: "CÁC LOẠI ÁO",
                                    Bottoms: "QUẦN & VÁY",
                                    Outerwear: "ÁO KHOÁC",
                                    Footwear: "GIÀY DÉP",
                                    Khác: "KHÁC",
                                };

                                return (
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                category_id: e.target.value,
                                            })
                                        }
                                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black bg-white"
                                    >
                                        {Object.keys(groupedCategories).map(
                                            (type) => (
                                                <optgroup
                                                    key={type}
                                                    label={
                                                        translateType[type] ||
                                                        type
                                                    }
                                                    className="font-bold text-gray-700 bg-gray-50"
                                                >
                                                    {groupedCategories[
                                                        type
                                                    ].map((cat) => (
                                                        <option
                                                            key={cat.id}
                                                            value={cat.id}
                                                            className="font-normal text-black bg-white"
                                                        >
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ),
                                        )}
                                    </select>
                                );
                            })()}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Màu sắc chính
                                </label>
                                <input
                                    type="color"
                                    value={formData.color_hex}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            color_hex: e.target.value,
                                        })
                                    }
                                    className="w-full h-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Thời tiết
                                </label>
                                <select
                                    value={formData.weather_suitability}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            weather_suitability: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="All">Bốn mùa</option>
                                    <option value="Hot">Mùa Hè (Nóng)</option>
                                    <option value="Cold">
                                        Mùa Đông (Lạnh)
                                    </option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isUploading}
                            className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex justify-center items-center gap-2 mt-4"
                        >
                            {isUploading ? (
                                <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                                "Lưu vào tủ đồ"
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* DANH SÁCH QUẦN ÁO */}
            {clothes.length === 0 && !showForm ? (
                <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                    Tủ đồ của bạn đang trống. Hãy thêm những món đồ đầu tiên
                    nhé!
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {clothes.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group relative"
                        >
                            {/* Overlay hiển thị các nút thao tác */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col items-center justify-center gap-3">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() =>
                                            handleToggleStatus(
                                                item.id,
                                                item.status,
                                            )
                                        }
                                        title={
                                            item.status === "Clean"
                                                ? "Mang đi giặt"
                                                : "Đã giặt xong"
                                        }
                                        className="bg-white p-2 rounded-full text-gray-800 hover:scale-110 transition-transform"
                                    >
                                        <RefreshCcw size={18} />
                                    </button>
                                    <button
                                        onClick={() => openEditModal(item)}
                                        title="Chỉnh sửa"
                                        className="bg-blue-500 p-2 rounded-full text-white hover:scale-110 transition-transform"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        title="Xóa trang phục"
                                        className="bg-red-500 p-2 rounded-full text-white hover:scale-110 transition-transform"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                                <img
                                    src={item.image_url}
                                    alt="Trang phục"
                                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${item.status === "Washing" ? "grayscale opacity-60" : ""}`}
                                />
                                {item.status === "Washing" && (
                                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                                        ĐANG GIẶT
                                    </div>
                                )}
                            </div>
                            <div className="p-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-sm">
                                        {item.categories?.name}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        {item.weather_suitability}
                                    </p>
                                </div>
                                <div
                                    className="w-5 h-5 rounded-full border border-gray-300 shadow-inner"
                                    style={{ backgroundColor: item.color_hex }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* POPUP MODAL CHỈNH SỬA */}
            {editingCloth && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-lg">
                                Chỉnh sửa trang phục
                            </h2>
                            <button
                                onClick={() => setEditingCloth(null)}
                                className="text-gray-500 hover:bg-gray-200 p-1 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex gap-4 items-center p-3 bg-gray-50 rounded-xl mb-4 border border-gray-100">
                                <img
                                    src={editingCloth.image_url}
                                    className="w-16 h-16 rounded-lg object-cover shadow-sm border border-gray-200"
                                    alt="Preview"
                                />
                                <p className="text-sm text-gray-500 italic">
                                    Lưu ý: Không thể đổi hình ảnh. Hãy xóa và
                                    tải lên lại nếu ảnh bị sai.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Đổi loại trang phục
                                </label>
                                <select
                                    value={editFormData.category_id}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            category_id: e.target.value,
                                        })
                                    }
                                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Màu sắc
                                    </label>
                                    <input
                                        type="color"
                                        value={editFormData.color_hex}
                                        onChange={(e) =>
                                            setEditFormData({
                                                ...editFormData,
                                                color_hex: e.target.value,
                                            })
                                        }
                                        className="w-full h-11 p-1 border border-gray-300 rounded-lg cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Thời tiết
                                    </label>
                                    <select
                                        value={editFormData.weather_suitability}
                                        onChange={(e) =>
                                            setEditFormData({
                                                ...editFormData,
                                                weather_suitability:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                                    >
                                        <option value="All">Bốn mùa</option>
                                        <option value="Hot">Mùa Hè</option>
                                        <option value="Cold">Mùa Đông</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => setEditingCloth(null)}
                                className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
