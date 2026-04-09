import { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useWardrobe } from "../hooks/useWardrobe";
import { ClothCard } from "../components/Wardrobe/ClothCard";
import { WardrobeSkeleton } from "../components/common/Skeletons";
import { WardrobeEmptyState } from "../components/common/EmptyStates";
import { Plus, Loader2, UploadCloud, X } from "lucide-react";
import toast from "react-hot-toast";
import { fileToGenerativePart, analyzeClothingImage } from "../utils/aiLogic";

export default function Wardrobe() {
    const { user } = useAuth();
    
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
    });

    // Edit Modal states
    const [editingCloth, setEditingCloth] = useState(null);
    const [editFormData, setEditFormData] = useState({
        category_id: "",
        color_hex: "#ffffff",
        weather_suitability: "All",
    });

    // Initialize default category when categories jump in
    useMemo(() => {
        if (categories.length > 0 && !formData.category_id) {
            setFormData(prev => ({ ...prev, category_id: categories[0].id }));
        }
    }, [categories, formData.category_id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
        <div className="space-y-6 relative px-4 md:px-0">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    Tủ đồ của tôi ({clothes.length})
                </h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-black text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Thêm đồ mới</span>
                </button>
            </div>

            {/* FORM THÊM MỚI */}
            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all relative overflow-hidden group min-h-[250px]">
                        {isAnalyzingImage && (
                            <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 text-black animate-spin mb-3" />
                                <p className="text-sm font-bold text-gray-800">AI đang phân tích ảnh...</p>
                            </div>
                        )}
                        {file ? (
                            <>
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt="Preview"
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                                />
                                <div className="relative z-10 bg-white/90 p-3 rounded-lg shadow-sm border border-gray-100 backdrop-blur-sm">
                                    <p className="text-sm font-bold text-gray-800 line-clamp-1">{file.name}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Nhấn để thay đổi ảnh khác</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-gray-100 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                    <UploadCloud className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-base font-bold text-gray-800 mb-1">Tải ảnh trang phục lên</h3>
                                <p className="text-xs text-gray-500 max-w-[200px]">
                                    Hỗ trợ JPG, PNG. Ảnh nên được chụp rõ trên nền sáng.
                                </p>
                            </>
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
                                            color_hex: aiResult.color_hex
                                        }));
                                        toast.success("AI đã nhận diện xong!");
                                    }
                                } catch (error) {
                                    console.error("AI Analysis Failed", error);
                                    toast.error("AI không thể nhận diện ảnh, bạn có thể tự chọn thủ công.");
                                } finally {
                                    setIsAnalyzingImage(false);
                                }
                            }}
                            disabled={isAnalyzingImage || isUploading}
                            className={`absolute inset-0 w-full h-full opacity-0 z-20 ${isAnalyzingImage || isUploading ? 'cursor-not-allowed' : 'cursor-pointer'} text-sm text-gray-500`}
                        />
                    </div>

                    <div className="space-y-5 flex flex-col justify-center">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                Loại trang phục
                            </label>
                            <div className="relative">
                                {(() => {
                                    const groupedCategories = categories.reduce((acc, cat) => {
                                        const type = cat.type || "Khác";
                                        acc[type] = acc[type] || [];
                                        acc[type].push(cat);
                                        return acc;
                                    }, {});

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
                                                setFormData({ ...formData, category_id: e.target.value })
                                            }
                                            className="w-full p-3.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black bg-gray-50 transition-all hover:bg-white appearance-none"
                                        >
                                            {Object.keys(groupedCategories).map((type) => (
                                                <optgroup
                                                    key={type}
                                                    label={translateType[type] || type}
                                                    className="font-bold text-gray-500 bg-white"
                                                >
                                                    {groupedCategories[type].map((cat) => (
                                                        <option
                                                            key={cat.id}
                                                            value={cat.id}
                                                            className="font-normal text-gray-900"
                                                        >
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    );
                                })()}
                                {/* Custom arrow for select */}
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            {(() => {
                                const PREDEFINED_COLORS = [
                                    "#000000", "#ffffff", "#9ca3af", "#fef3c7", 
                                    "#8b4513", "#1e3a8a", "#3b82f6", "#ef4444", 
                                    "#22c55e", "#ec4899", "#eab308"
                                ];

                                return (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700">
                                            Màu sắc chính
                                        </label>
                                        <div className="space-y-3">
                                            {/* Bảng màu có sẵn để chọn nhanh */}
                                            <div className="flex flex-wrap gap-2">
                                                {PREDEFINED_COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, color_hex: color })}
                                                        className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110 ${formData.color_hex.toLowerCase() === color ? 'ring-2 ring-black ring-offset-2 scale-110' : 'border-gray-200'}`}
                                                        style={{ backgroundColor: color }}
                                                        title={color}
                                                    />
                                                ))}
                                            </div>

                                            {/* Custom Picker nếu muốn */}
                                            <div className="flex items-center gap-3 border border-gray-200 p-2 rounded-xl bg-gray-50 w-fit">
                                                <input
                                                    type="color"
                                                    value={formData.color_hex}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, color_hex: e.target.value })
                                                    }
                                                    className="w-6 h-6 rounded cursor-pointer border-0 p-0 overflow-hidden"
                                                    title="Mở bảng màu nâng cao"
                                                />
                                                <span className="text-xs font-medium text-gray-500 uppercase pr-2">
                                                    Mã: {formData.color_hex}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                    Thời tiết
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.weather_suitability}
                                        onChange={(e) =>
                                            setFormData({ ...formData, weather_suitability: e.target.value })
                                        }
                                        className="w-full p-3.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black bg-gray-50 hover:bg-white transition-all appearance-none"
                                    >
                                        <option value="All">Bốn mùa 🌤️</option>
                                        <option value="Hot">Mùa Hè ☀️</option>
                                        <option value="Cold">Mùa Đông ❄️</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isUploading}
                            className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 flex justify-center items-center gap-2 mt-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        >
                            {isUploading ? <Loader2 className="animate-spin w-5 h-5" /> : "Lưu vào Tủ Đồ"}
                        </button>
                    </div>
                </form>
            )}

            {/* DANH SÁCH QUẦN ÁO */}
            {clothes.length === 0 && !showForm ? (
                <WardrobeEmptyState onAction={() => setShowForm(true)} />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {clothes.map((item) => (
                        <ClothCard
                            key={item.id}
                            item={item}
                            handleToggleStatus={handleToggleClothStatus}
                            openEditModal={openEditModal}
                            handleDelete={handleDeleteCloth}
                        />
                    ))}
                </div>
            )}


            {/* POPUP MODAL CHỈNH SỬA */}
            {editingCloth && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-lg">Chỉnh sửa trang phục</h2>
                            <button
                                onClick={() => setEditingCloth(null)}
                                className="text-gray-500 hover:bg-gray-200 p-1 rounded-full transition-colors"
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
                                    Lưu ý: Không thể đổi hình ảnh. Hãy xóa và tải lên lại nếu ảnh bị sai.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Đổi loại trang phục
                                </label>
                                <select
                                    value={editFormData.category_id}
                                    onChange={(e) =>
                                        setEditFormData({ ...editFormData, category_id: e.target.value })
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
                                {(() => {
                                    const PREDEFINED_COLORS = [
                                        "#000000", "#ffffff", "#9ca3af", "#fef3c7", 
                                        "#8b4513", "#1e3a8a", "#3b82f6", "#ef4444", 
                                        "#22c55e", "#ec4899", "#eab308"
                                    ];
                                    
                                    return (
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-medium mb-2">Màu sắc chính</label>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {PREDEFINED_COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setEditFormData({ ...editFormData, color_hex: color })}
                                                        className={`w-7 h-7 rounded-full border shadow-sm transition-transform hover:scale-110 ${editFormData.color_hex.toLowerCase() === color ? 'ring-2 ring-black ring-offset-1 scale-110' : 'border-gray-200'}`}
                                                        style={{ backgroundColor: color }}
                                                        title={color}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-3 border border-gray-200 p-1.5 rounded-lg bg-gray-50 w-full">
                                                <input
                                                    type="color"
                                                    value={editFormData.color_hex}
                                                    onChange={(e) =>
                                                        setEditFormData({ ...editFormData, color_hex: e.target.value })
                                                    }
                                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0 overflow-hidden"
                                                />
                                                <span className="text-xs font-medium text-gray-500 uppercase">
                                                    Mã: {editFormData.color_hex}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Thời tiết</label>
                                    <select
                                        value={editFormData.weather_suitability}
                                        onChange={(e) =>
                                            setEditFormData({
                                                ...editFormData,
                                                weather_suitability: e.target.value,
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
