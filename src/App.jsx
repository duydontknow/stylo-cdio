import { Suspense, lazy } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./contexts/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";

import Login from "./pages/Login";
import Layout from "./components/layout/Layout";

// Lazy loading các trang để tối ưu Code-Splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Wardrobe = lazy(() => import("./pages/Wardrobe"));
const Outfits = lazy(() => import("./pages/Outfits"));
const AiStylist = lazy(() => import("./pages/AiStylist"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));

// Global Loader khi lazy load chunk mới
const PageLoader = () => (
    <div className="flex justify-center items-center h-[80vh] w-full">
        <Loader2 className="animate-spin text-gray-400 w-10 h-10" />
    </div>
);

function App() {
    return (
        <ThemeProvider>
        <AuthProvider>
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
                        <Route
                            path="/dashboard"
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <Dashboard />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/wardrobe"
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <Wardrobe />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/outfits"
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <Outfits />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/ai-stylist"
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <AiStylist />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <Profile />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <Admin />
                                </Suspense>
                            }
                        />
                    </Route>

                    {/* Fallback */}
                    <Route
                        path="*"
                        element={<Navigate to="/dashboard" replace />}
                    />
                </Routes>
            </Router>
        </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
