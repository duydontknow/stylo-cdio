import { useState, useEffect, useCallback } from "react";
import {
    getCategories,
    getUserClothes,
    addCloth,
    deleteCloth,
    updateClothStatus,
    updateClothDetails,
} from "../services/clothes";
import toast from "react-hot-toast";

export const useWardrobe = (userId) => {
    const [clothes, setClothes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const [cats, userClothes] = await Promise.all([
                getCategories(),
                getUserClothes(userId),
            ]);
            setCategories(cats);
            setClothes(userClothes);
        } catch (error) {
            console.error("Lỗi tải dữ liệu tủ đồ:", error);
            // toast.error("Có lỗi xảy ra khi tải tủ đồ!");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddCloth = async (file, formData) => {
        if (!file) {
            toast.error("Vui lòng chọn một bức ảnh!");
            return false;
        }

        const toastId = toast.loading("Đang tải trang phục lên...");
        try {
            const newCloth = await addCloth(file, {
                ...formData,
                user_id: userId,
            });
            const selectedCat = categories.find(
                (c) => c.id === formData.category_id,
            );
            setClothes([{ ...newCloth, categories: selectedCat }, ...clothes]);
            toast.success("Đã thêm vào tủ đồ!", { id: toastId });
            return true;
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tải lên!", { id: toastId });
            return false;
        }
    };

    const handleDeleteCloth = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa món đồ này?")) return false;

        const toastId = toast.loading("Đang xóa...");
        try {
            await deleteCloth(id);
            setClothes((prev) => prev.filter((item) => item.id !== id));
            toast.success("Đã xóa trang phục", { id: toastId });
            return true;
        } catch (error) {
            toast.error("Lỗi khi xóa trang phục", { id: toastId });
            return false;
        }
    };

    const handleToggleClothStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === "Clean" ? "Washing" : "Clean";
        const toastId = toast.loading("Đang cập nhật...");
        try {
            await updateClothStatus(id, newStatus);
            setClothes((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, status: newStatus } : item,
                ),
            );
            toast.success(
                newStatus === "Clean" ? "Đã giặt xong!" : "Đã mang đi giặt!",
                { id: toastId },
            );
            return true;
        } catch (error) {
            toast.error("Lỗi cập nhật", { id: toastId });
            return false;
        }
    };

    const handleUpdateClothDetails = async (editingClothId, editFormData) => {
        const toastId = toast.loading("Đang lưu thay đổi...");
        try {
            await updateClothDetails(editingClothId, editFormData);

            const updatedCategory = categories.find(
                (c) => c.id === editFormData.category_id,
            );
            
            setClothes((prev) =>
                prev.map((item) => {
                    if (item.id === editingClothId) {
                        return {
                            ...item,
                            ...editFormData,
                            categories: updatedCategory,
                        };
                    }
                    return item;
                }),
            );
            toast.success("Cập nhật thành công!", { id: toastId });
            return true;
        } catch (error) {
            console.error(error);
            toast.error("Có lỗi khi cập nhật!", { id: toastId });
            return false;
        }
    };

    return {
        clothes,
        categories,
        loading,
        handleAddCloth,
        handleDeleteCloth,
        handleToggleClothStatus,
        handleUpdateClothDetails,
    };
};
