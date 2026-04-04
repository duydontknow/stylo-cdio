import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

// Tạo hộp chứa dữ liệu người dùng
const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Kiểm tra xem có ai đang đăng nhập không khi web vừa mở
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false); // Đã kiểm tra xong
        });

        // 2. Lắng nghe mọi thay đổi (khi user bấm Đăng nhập hoặc Đăng xuất)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        // Dọn dẹp bộ nhớ khi component bị hủy
        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user }}>
            {/* Chỉ hiển thị giao diện khi đã kiểm tra xong trạng thái đăng nhập */}
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Hàm rút gọn để các trang khác lấy thông tin user dễ dàng hơn
export const useAuth = () => useContext(AuthContext);
