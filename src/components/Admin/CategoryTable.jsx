import { Trash2, Database } from "lucide-react";
import { CategoryEmptyState } from "../common/EmptyStates";

export function CategoryTable({ categories, handleDeleteCategory }) {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Database size={18} className="text-gray-500" />
                <h2 className="font-bold">
                    Quản lý Danh mục ({categories.length})
                </h2>
            </div>
            
            {categories.length === 0 ? (
                <div className="p-6">
                    <CategoryEmptyState />
                </div>
            ) : (
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-white shadow-sm">
                            <tr className="text-gray-500">
                                <th className="p-4 font-medium">Nhóm</th>
                                <th className="p-4 font-medium">Tên hiển thị</th>
                                <th className="p-4 font-medium text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr
                                    key={cat.id}
                                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="p-4">
                                        <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-bold text-gray-600">
                                            {cat.type}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium">{cat.name}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
