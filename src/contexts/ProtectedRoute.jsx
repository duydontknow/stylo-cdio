import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();

    // Nếu chưa đăng nhập, đá văng về trang /login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Nếu đã đăng nhập, cho phép đi tiếp vào trong (children)
    return children;
};
