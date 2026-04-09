import { RefreshCcw, Edit, Trash2 } from "lucide-react";

export function ClothCard({ item, handleToggleStatus, openEditModal, handleDelete }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group relative">
            {/* Overlay hiển thị các nút thao tác */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col items-center justify-center gap-3">
                <div className="flex gap-3">
                    <button
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        title={item.status === "Clean" ? "Mang đi giặt" : "Đã giặt xong"}
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
                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                        item.status === "Washing" ? "grayscale opacity-60" : ""
                    }`}
                />
                {item.status === "Washing" && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                        ĐANG GIẶT
                    </div>
                )}
            </div>
            <div className="p-3 flex justify-between items-center">
                <div>
                    <p className="font-semibold text-sm">{item.categories?.name}</p>
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
    );
}
