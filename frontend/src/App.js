import { useState, useEffect, createContext, useContext, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages
import HomePage from "@/pages/HomePage";
import ExplorePage from "@/pages/ExplorePage";
import MunicipioPage from "@/pages/MunicipioPage";
import PrestadoresPage from "@/pages/PrestadoresPage";
import EventosPage from "@/pages/EventosPage";
import EmergenciaPage from "@/pages/EmergenciaPage";
import GuiaPage from "@/pages/GuiaPage";
import LoginPage from "@/pages/LoginPage";
import PerfilPage from "@/pages/PerfilPage";
import PrestadorRegistration from "@/pages/PrestadorRegistration";
import RutasPage from "@/pages/RutasPage";
import ChatBot from "@/components/ChatBot";
import DiarioViajero from "@/pages/DiarioViajero";
import MapaPrestadores from "@/components/MapaPrestadores";
import PrestadorPage from "@/pages/PrestadorPage";
import ConstructorPaquete from "@/components/ConstructorPaquete";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import EncargadoDashboard from "@/pages/admin/EncargadoDashboard";
import PrestadorDashboard from "@/pages/admin/PrestadorDashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios
axios.defaults.withCredentials = true;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    setUser(response.data);
    return response.data;
  };

  const loginWithGoogle = () => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  const redirectUri =
    "https://veracruz-amor.vercel.app/auth/callback";

  const scope = "email profile";

  const googleUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&access_type=offline` +
    `&prompt=consent`;

  window.location.href = googleUrl;
};

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin: user?.rol === "superadmin",
    isEncargado: user?.rol === "encargado",
    isPrestador: user?.rol === "prestador",
    isTurista: user?.rol === "turista",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Auth Callback Component
const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.post(`${API}/auth/google/callback`, { code });
        setUser(response.data);
        const role = response.data.rol;
        if (role === 'superadmin') {
          navigate('/admin', { replace: true });
        } else if (role === 'encargado') {
          navigate('/encargado', { replace: true });
        } else if (role === 'prestador') {
          navigate('/prestador-panel', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate('/login');
      }
    };

    processAuth();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#1B5E20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Iniciando sesión...</p>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="w-16 h-16 border-4 border-[#1B5E20] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// App Router
function AppRouter() {
  const location = useLocation();

  if (location.pathname === '/auth/callback') {
  return <AuthCallback />;
}

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/explorar" element={<ExplorePage />} />
      <Route path="/municipio/:slug" element={<MunicipioPage />} />
      <Route path="/prestadores" element={<PrestadoresPage />} />
      <Route path="/eventos" element={<EventosPage />} />
      <Route path="/emergencia" element={<EmergenciaPage />} />
      <Route path="/guia" element={<GuiaPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro-prestador" element={<PrestadorRegistration />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/rutas" element={<RutasPage />} />
      <Route path="/rutas/:region" element={<RutasPage />} />
      <Route path="/mi-diario" element={<ProtectedRoute><DiarioViajero /></ProtectedRoute>} />
      <Route path="/mi-diario/:itinerarioId" element={<ProtectedRoute><DiarioViajero /></ProtectedRoute>} />
      <Route path="/prestador/:prestadorId" element={<PrestadorPage />} />

      <Route path="/perfil" element={
        <ProtectedRoute allowedRoles={["turista", "superadmin", "encargado", "prestador"]}>
          <PerfilPage />
        </ProtectedRoute>
      } />

      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={["superadmin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/encargado/*" element={
        <ProtectedRoute allowedRoles={["encargado", "superadmin"]}>
          <EncargadoDashboard />
        </ProtectedRoute>
      } />

      <Route path="/prestador-panel/*" element={
        <ProtectedRoute allowedRoles={["prestador", "superadmin"]}>
          <PrestadorDashboard />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// 404 Page
const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1B5E20] to-[#0277BD] text-white p-8">
    <h1 className="text-8xl font-bold mb-4" style={{ fontFamily: 'Playfair Display' }}>404</h1>
    <p className="text-2xl mb-8">Página no encontrada</p>
    <a href="/" className="btn-gold px-8 py-4 rounded-xl text-lg font-semibold">
      Volver al inicio
    </a>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
        <ChatBot />  {/* ← AQUÍ, así aparece en TODAS las páginas */}
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
export { API, BACKEND_URL };