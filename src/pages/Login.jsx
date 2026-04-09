import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { Mail, Lock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

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
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Background ambient glowing blurs */}
            <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-ai/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                className="w-full max-w-md md:max-w-[26rem] bg-surface/80 backdrop-blur-xl rounded-[2rem] shadow-glass border border-white/50 p-8 md:p-10 z-10"
            >
                {/* Logo & Tiêu đề */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <motion.div 
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
                        className="w-14 h-14 bg-primary text-white rounded-[1.25rem] flex items-center justify-center mb-5 shadow-soft"
                    >
                        <Sparkles size={26} className="text-ai-light" />
                    </motion.div>
                    <h2 className="text-2xl md:text-[1.75rem] font-bold text-primary tracking-tight">
                        {isLogin
                            ? "Mừng bạn trở lại!"
                            : "Tạo tài khoản STYLO"}
                    </h2>
                    <p className="text-muted text-sm mt-2.5 font-medium">
                        {isLogin
                            ? "Đăng nhập để AI chọn đồ cho bạn hôm nay."
                            : "Bắt đầu hành trình mặc đẹp cùng công nghệ AI."}
                    </p>
                </div>

                {/* Thông báo lỗi nếu có kèm animation */}
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-center font-medium shadow-sm relative">
                                {error}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form nhập liệu */}
                <form onSubmit={handleAuth} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        leftIcon={<Mail className="h-[18px] w-[18px]" />}
                    />

                    <Input
                        label="Mật khẩu"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={6}
                        leftIcon={<Lock className="h-[18px] w-[18px]" />}
                    />

                    {/* Ô Xác nhận mật khẩu (Chỉ hiển thị khi ở chế độ Đăng ký) */}
                    <AnimatePresence>
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4">
                                    <Input
                                        label="Xác nhận mật khẩu"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={6}
                                        leftIcon={<Lock className="h-[18px] w-[18px]" />}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        type="submit"
                        isLoading={loading}
                        variant="primary"
                        className="w-full !mt-8"
                        size="md"
                    >
                        {isLogin ? "Đăng nhập ngay" : "Tạo tài khoản"}
                    </Button>
                </form>

                {/* Chuyển đổi giữa Đăng nhập / Đăng ký */}
                <div className="mt-8 text-center text-sm">
                    <span className="text-muted font-medium">
                        {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                    </span>
                    <button
                        type="button"
                        onClick={toggleMode}
                        className="font-semibold text-primary hover:text-ai transition-colors focus:outline-none ml-1"
                    >
                        {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
