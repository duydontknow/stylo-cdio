import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";

export const useAdmin = (userEmail, adminEmails) => {
    const [categories, setCategories] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [stats, setStats] = useState({
        total_users: 0,
        total_clothes: 0,
        total_outfits: 0,
    });
    const [loading, setLoading] = useState(true);

    const isAdmin = adminEmails.includes(userEmail);

    const fetchAllAdminData = useCallback(async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const { data: catsData } = await supabase
                .from("categories")
                .select("*")
                .order("type", { ascending: true });
            if (catsData) setCategories(catsData);

            const { data: profilesData } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });
            if (profilesData) setUsersList(profilesData);

            const { data: statsData, error: statsError } =
                await supabase.rpc("get_admin_stats");
            if (statsData) setStats(statsData);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải dữ liệu hệ thống");
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchAllAdminData();
    }, [fetchAllAdminData]);

    const handleAddCategory = async (newCatName, newCatType) => {
        if (!newCatName.trim()) {
            toast.error("Vui lòng nhập tên danh mục");
            return false;
        }

        const toastId = toast.loading("Đang thêm...");
        try {
            const { data, error } = await supabase
                .from("categories")
                .insert([{ name: newCatName, type: newCatType }])
                .select();
            if (error) throw error;

            setCategories([...categories, data[0]]);
            toast.success("Thêm thành công!", { id: toastId });
            return true;
        } catch (error) {
            toast.error("Có lỗi xảy ra", { id: toastId });
            return false;
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`Xoá danh mục "${name}"?`)) return false;
        const toastId = toast.loading("Đang xoá...");
        try {
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", id);
            if (error) throw error;

            setCategories(categories.filter((c) => c.id !== id));
            toast.success("Đã xoá danh mục", { id: toastId });
            return true;
        } catch (error) {
            toast.error("Lỗi: Đang có đồ dùng danh mục này!", { id: toastId });
            return false;
        }
    };

    const handleToggleUserStatus = async (userId, targetEmail, currentStatus) => {
        if (adminEmails.includes(targetEmail)) {
            toast.error("Đừng tự sát! Bạn không thể khóa Admin.");
            return false;
        }

        const newStatus = currentStatus === "active" ? "banned" : "active";
        const actionName = newStatus === "banned" ? "Khóa" : "Mở khóa";

        if (!window.confirm(`Bạn có chắc muốn ${actionName} tài khoản ${targetEmail}?`))
            return false;

        const toastId = toast.loading(`Đang ${actionName}...`);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ status: newStatus })
                .eq("id", userId);

            if (error) throw error;

            setUsersList((prev) =>
                prev.map((u) =>
                    u.id === userId ? { ...u, status: newStatus } : u,
                ),
            );

            toast.success(`Đã ${actionName} tài khoản!`, { id: toastId });
            return true;
        } catch (error) {
            toast.error(`Lỗi khi ${actionName}`, { id: toastId });
            return false;
        }
    };

    return {
        categories,
        usersList,
        stats,
        loading,
        handleAddCategory,
        handleDeleteCategory,
        handleToggleUserStatus,
    };
};
