import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./contexts/ProtectedRoute";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/layout/Layout";

// Import đầy đủ các trang
import Wardrobe from "./pages/Wardrobe";
import Outfits from "./pages/Outfits";
import AiStylist from "./pages/AiStylist";
import Profile from "./pages/Profile";

function App() {
    return (
        <AuthProvider>
            {/* Thêm Toaster ở đây */}
            <Toaster position="top-right" reverseOrder={false} />

            <Router>
                <Routes>
                    {/* Public Route */}
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes có chứa Layout */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/wardrobe" element={<Wardrobe />} />
                        <Route path="/outfits" element={<Outfits />} />
                        <Route path="/ai-stylist" element={<AiStylist />} />
                        <Route path="/profile" element={<Profile />} />
                    </Route>

                    {/* Fallback */}
                    <Route
                        path="*"
                        element={<Navigate to="/dashboard" replace />}
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
