// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { Mail, Lock, Loader2, Shirt } from "lucide-react";

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    // DANH SÁCH EMAIL ĐƯỢC CẤP QUYỀN ADMIN (Nhớ đổi thành email của mày)
    const ADMIN_EMAILS = ["admin@gmail.com", "tuancode@gmail.com"];

    const handleAuth = async (e) => {
        e.preventDefault();

        // Kiểm tra mật khẩu khớp nhau khi đăng ký
        if (!isLogin && password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp!");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                // Xử lý Đăng nhập
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // --- PHÂN QUYỀN RẼ NHÁNH TẠI ĐÂY ---
                if (ADMIN_EMAILS.includes(data.user.email)) {
                    navigate("/admin"); // Nếu là Admin thì vào thẳng Dashboard Admin
                } else {
                    navigate("/dashboard"); // Nếu là User thường thì vào trang chủ/dashboard của họ
                }
            } else {
                // Xử lý Đăng ký
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert("Đăng ký thành công! Hãy đăng nhập ngay.");

                // Reset form và chuyển về Đăng nhập
                setIsLogin(true);
                setPassword("");
                setConfirmPassword("");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Hàm chuyển đổi giữa Đăng nhập / Đăng ký
    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
        setConfirmPassword(""); // Xóa ô xác nhận mật khẩu khi chuyển mode
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Logo & Tiêu đề */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mb-4">
                        <Shirt size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isLogin
                            ? "Chào mừng trở lại STYLO"
                            : "Tạo tài khoản STYLO"}
                    </h2>
                    <p className="text-gray-500 text-sm mt-2">
                        {isLogin
                            ? "Đăng nhập để quản lý tủ đồ của bạn"
                            : "Bắt đầu hành trình mặc đẹp mỗi ngày"}
                    </p>
                </div>

                {/* Thông báo lỗi nếu có */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Form nhập liệu */}
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black sm:text-sm"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black sm:text-sm"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>

                    {/* Ô Xác nhận mật khẩu (Chỉ hiển thị khi ở chế độ Đăng ký) */}
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Xác nhận mật khẩu
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black sm:text-sm"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : isLogin ? (
                            "Đăng nhập"
                        ) : (
                            "Đăng ký"
                        )}
                    </button>
                </form>

                {/* Chuyển đổi giữa Đăng nhập / Đăng ký */}
                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-600">
                        {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                    </span>
                    <button
                        type="button"
                        onClick={toggleMode}
                        className="font-medium text-black hover:underline focus:outline-none"
                    >
                        {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                    </button>
                </div>
            </div>
        </div>
    );
}
