import { Trash2, Database } from "lucide-react";
import { CategoryEmptyState } from "../common/EmptyStates";
import Badge from "../common/Badge";
import Button from "../common/Button";

export function CategoryTable({ categories, handleDeleteCategory }) {
    return (
        <div className="bg-surface rounded-[2rem] shadow-glass border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3 bg-white/50 backdrop-blur-md">
                <div className="w-10 h-10 bg-ai/10 rounded-xl flex items-center justify-center text-ai">
                    <Database size={20} />
                </div>
                <h2 className="font-bold text-primary text-xl">
                    Quản lý Danh mục 
                    <span className="ml-2 text-sm font-medium text-muted">({categories.length} mục)</span>
                </h2>
            </div>
            
            {categories.length === 0 ? (
                <div className="p-10">
                    <CategoryEmptyState />
                </div>
            ) : (
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-md z-10">
                            <tr className="text-muted font-bold text-xs uppercase tracking-wider">
                                <th className="p-5 font-bold">Nhóm Type</th>
                                <th className="p-5 font-bold">Tên hiển thị</th>
                                <th className="p-5 font-bold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {categories.map((cat) => (
                                <tr
                                    key={cat.id}
                                    className="hover:bg-gray-50/50 transition-colors group"
                                >
                                    <td className="p-5">
                                        <Badge variant="outline" className="font-bold border-gray-200">
                                            {cat.type}
                                        </Badge>
                                    </td>
                                    <td className="p-5 font-semibold text-primary">{cat.name}</td>
                                    <td className="p-5 text-right">
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                            className="p-2.5 text-gray-400 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                            title="Xóa danh mục"
                                        >
                                            <Trash2 size={16} strokeWidth={2.5}/>
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
