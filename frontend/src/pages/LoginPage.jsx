import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/App";
import { MapPin, Mail, Lock, Loader2, Eye, EyeOff, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isAuthenticated, user } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/";

  // Redirect if already authenticated
  if (isAuthenticated) {
    const redirectTo = user?.rol === "superadmin" ? "/admin" 
      : user?.rol === "encargado" ? "/encargado"
      : user?.rol === "prestador" ? "/prestador-panel"
      : "/";
    navigate(redirectTo, { replace: true });
    return null;
  }

  const formatApiErrorDetail = (detail) => {
    if (detail == null) return "Algo salió mal. Inténtalo de nuevo.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
      return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userData = await login(email, password);
      toast.success("¡Bienvenido!");
      
      // Redirect based on role
      const redirectTo = userData.rol === "superadmin" ? "/admin" 
        : userData.rol === "encargado" ? "/encargado"
        : userData.rol === "prestador" ? "/prestador-panel"
        : from;
      
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const heroImage = "https://res.cloudinary.com/dcdjo3rtm/image/upload/v1775722094/hero-login.png_qnsnlk.png";

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        <div className="relative z-10 p-12 flex flex-col justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#1B5E20]" />
            </div>
            <span className="font-bold text-xl text-white" style={{ fontFamily: 'Playfair Display' }}>
              Veracruz Contigo
            </span>
          </Link>
          
          <div>
            <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display' }}>
              Explora con seguridad
            </h1>
            <p className="text-white/80 text-lg">
              232 municipios, playas paradisíacas, montañas cubiertas de niebla 
              y la mejor gastronomía de México te esperan.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F5F5F5]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[#1B5E20] rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
              Veracruz Contigo
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
                Iniciar sesión
              </h2>
              <p className="text-gray-500 mt-2">
                Accede a tu cuenta para disfrutar de todas las funciones
              </p>
            </div>

            {/* Google Login for Tourists */}
            <Button
              onClick={loginWithGoogle}
              variant="outline"
              className="w-full py-6 text-base font-medium"
              data-testid="google-login-btn"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </Button>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-gray-400">
                o con email
              </span>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full py-6 bg-[#1B5E20] hover:bg-[#145218] text-white"
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Esta área es para administradores, encargados municipales y prestadores de servicios.
              <br />
              <span className="text-[#1B5E20] font-medium">
                Los turistas pueden iniciar sesión con Google.
              </span>
            </p>

            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-sm text-gray-500 mb-2">¿Tienes un negocio turístico?</p>
              <Link to="/registro-prestador">
                <Button variant="outline" className="w-full border-[#F9A825] text-[#F9A825] hover:bg-[#F9A825]/10" data-testid="register-prestador-link">
                  <Building2 className="w-4 h-4 mr-2" />
                  Registra tu negocio
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/" className="text-[#0277BD] hover:underline">
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
