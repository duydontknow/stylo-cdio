import { Shirt, FolderOpen, SearchX } from "lucide-react";

export function EmptyState({ icon: Icon = Shirt, title, description, actionButton }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
            <div className="p-5 bg-gray-50 text-gray-400 rounded-full mb-4">
                <Icon size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-6 text-sm">{description}</p>
            {actionButton && <div>{actionButton}</div>}
        </div>
    );
}

// Preset Empty States
export function WardrobeEmptyState({ onAction }) {
    return (
        <EmptyState
            icon={Shirt}
            title="Tủ đồ đang trống"
            description="Bạn chưa có món đồ nào trong tủ. Hãy tải lên những bức ảnh đầu tiên để tạo bộ phối đồ cho riêng mình nhé!"
            actionButton={
                onAction && (
                    <button
                        onClick={onAction}
                        className="bg-black text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        Thêm đồ ngay
                    </button>
                )
            }
        />
    );
}

export function CategoryEmptyState() {
    return (
        <EmptyState
            icon={FolderOpen}
            title="Chưa có danh mục nào"
            description="Hệ thống hiện tại chưa có danh mục quần áo. Hãy tạo danh mục đầu tiên phía bên trái."
        />
    );
}

export function UserEmptyState() {
    return (
        <EmptyState
            icon={SearchX}
            title="Chưa có người dùng"
            description="Hệ thống chưa ghi nhận người dùng nào đăng ký."
        />
    );
}
