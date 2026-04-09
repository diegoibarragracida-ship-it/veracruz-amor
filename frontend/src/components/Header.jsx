import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Search, Menu, X, User, LogOut, MapPin, Calendar, Users, ShieldAlert, BookOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchBar from "./SearchBar";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { user, logout, isAuthenticated, isSuperAdmin, isEncargado, isPrestador } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHomePage = location.pathname === "/";
  const headerBg = isScrolled || !isHomePage 
    ? "bg-white/95 backdrop-blur-xl shadow-sm" 
    : "bg-transparent";
  const textColor = isScrolled || !isHomePage ? "text-gray-800" : "text-white";

  const navLinks = [
    { href: "/explorar", label: "Explorar", icon: MapPin },
    { href: "/eventos", label: "Eventos", icon: Calendar },
    { href: "/prestadores", label: "Prestadores", icon: Users },
    { href: "/guia", label: "Guía", icon: BookOpen },
    { href: "/emergencia", label: "Emergencias", icon: ShieldAlert },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (isSuperAdmin) return "/admin";
    if (isEncargado) return "/encargado";
    if (isPrestador) return "/prestador-panel";
    return "/perfil";
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`} data-testid="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
              <div className="w-10 h-10 bg-[#1B5E20] rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className={`font-bold text-lg ${textColor}`} style={{ fontFamily: 'Playfair Display' }}>
                  Veracruz Contigo
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[#1B5E20] ${
                    location.pathname === link.href 
                      ? "text-[#1B5E20]" 
                      : textColor
                  }`}
                  data-testid={`nav-${link.label.toLowerCase()}`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(!showSearch)}
                className={`${textColor} hover:bg-white/20`}
                data-testid="search-toggle"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Auth / User Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={`flex items-center gap-2 ${textColor}`} data-testid="user-menu-trigger">
                      {user?.foto_url ? (
                        <img src={user.foto_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#1B5E20] flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className="hidden md:block text-sm font-medium">{user?.nombre?.split(' ')[0]}</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b">
                      <p className="font-medium text-sm">{user?.nombre}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#1B5E20]/10 text-[#1B5E20] text-xs rounded-full capitalize">
                        {user?.rol}
                      </span>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to={getDashboardLink()} className="flex items-center gap-2 cursor-pointer" data-testid="dashboard-link">
                        <User className="w-4 h-4" />
                        {isSuperAdmin || isEncargado || isPrestador ? "Panel de Control" : "Mi Perfil"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer" data-testid="logout-btn">
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button className="bg-[#1B5E20] hover:bg-[#145218] text-white" data-testid="login-btn">
                    Iniciar sesión
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={`lg:hidden ${textColor}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        {showSearch && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg p-4">
            <div className="max-w-3xl mx-auto">
              <SearchBar onClose={() => setShowSearch(false)} />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t shadow-lg">
            <nav className="flex flex-col p-4 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === link.href
                      ? "bg-[#1B5E20]/10 text-[#1B5E20]"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
