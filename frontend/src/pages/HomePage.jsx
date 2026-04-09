import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import MunicipioCard from "@/components/MunicipioCard";
import EventoCard from "@/components/EventoCard";
import PanicButton from "@/components/PanicButton";
import AlertBanner from "@/components/AlertBanner";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Users, ShieldAlert, BookOpen, Star, ChevronRight, Shield, BadgeCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const [municipios, setMunicipios] = useState([]);
  const [pueblosMagicos, setPueblosMagicos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [municipiosRes, pueblosRes, eventosRes, alertasRes] = await Promise.all([
          axios.get(`${API}/municipios`, { params: { estado: "publicado", limit: 8 } }),
          axios.get(`${API}/municipios`, { params: { pueblo_magico: true, limit: 6 } }),
          axios.get(`${API}/eventos`, { params: { publicado: true, limit: 6 } }),
          axios.get(`${API}/alertas`, { params: { activa: true } }),
        ]);
        
        setMunicipios(municipiosRes.data.municipios || []);
        setPueblosMagicos(pueblosRes.data.municipios || []);
        setEventos(eventosRes.data.eventos || []);
        setAlertas(alertasRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const heroImage = "https://static.prod-images.emergentagent.com/jobs/07c629d5-0a32-4a39-ad2b-56c36d398877/images/1dfbd1ccc2e730f1e11eae34660eec121d4642954de69a16ec66025b0dfad602.png";

  const quickLinks = [
    { href: "/explorar", label: "Explorar", icon: MapPin, color: "bg-[#1B5E20]" },
    { href: "/emergencia", label: "Emergencias", icon: ShieldAlert, color: "bg-[#D32F2F]" },
    { href: "/eventos", label: "Eventos", icon: Calendar, color: "bg-[#0277BD]" },
    { href: "/prestadores", label: "Prestadores", icon: Users, color: "bg-[#F9A825]" },
  ];

  const features = [
    { icon: Shield, title: "Viaja con Seguridad", description: "Botón de pánico con GPS para emergencias las 24 horas" },
    { icon: BadgeCheck, title: "Prestadores Verificados", description: "Servicios turísticos revisados y certificados" },
    { icon: Heart, title: "Experiencias Auténticas", description: "Descubre la verdadera esencia de Veracruz" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]" data-testid="home-page">
      <Header />
      <AlertBanner alertas={alertas} />
      
      {/* Hero Section */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 hero-overlay" />
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg"
            style={{ fontFamily: 'Playfair Display' }}
            data-testid="hero-title"
          >
            Veracruz te espera
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Explora con seguridad. Descubre la magia de nuestros 232 municipios, 
            playas paradisíacas y la mejor gastronomía de México.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar variant="hero" />
          </div>
          
          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-2 px-6 py-3 ${link.color} text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg`}
                data-testid={`quick-link-${link.label.toLowerCase()}`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/50 rounded-full flex items-start justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Pueblos Mágicos Section */}
      <section className="py-20 px-4" data-testid="pueblos-magicos-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-6 h-6 text-[#F9A825]" />
                <span className="text-[#F9A825] font-semibold uppercase tracking-wider text-sm">Destinos destacados</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
                Pueblos Mágicos de Veracruz
              </h2>
            </div>
            <Link to="/explorar?filter=pueblo_magico" className="hidden md:flex items-center gap-2 text-[#1B5E20] font-medium hover:underline">
              Ver todos
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          
          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            {pueblosMagicos.slice(0, 1).map((m) => (
              <div key={m.id} className="col-span-12 md:col-span-8 row-span-2">
                <MunicipioCard municipio={m} size="large" />
              </div>
            ))}
            {pueblosMagicos.slice(1, 3).map((m) => (
              <div key={m.id} className="col-span-12 md:col-span-4">
                <MunicipioCard municipio={m} />
              </div>
            ))}
          </div>
          
          {/* More Pueblos */}
          {pueblosMagicos.length > 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {pueblosMagicos.slice(3, 6).map((m) => (
                <MunicipioCard key={m.id} municipio={m} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Events Section */}
      <section className="py-20 px-4 bg-white" data-testid="eventos-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-6 h-6 text-[#0277BD]" />
                <span className="text-[#0277BD] font-semibold uppercase tracking-wider text-sm">Agenda cultural</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
                Próximos Eventos
              </h2>
            </div>
            <Link to="/eventos" className="hidden md:flex items-center gap-2 text-[#1B5E20] font-medium hover:underline">
              Ver todos
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.slice(0, 6).map((evento) => (
              <EventoCard key={evento.id} evento={evento} />
            ))}
          </div>
          
          {eventos.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Próximamente más eventos</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Veracruz Contigo */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#1B5E20] to-[#0D3311]" data-testid="features-section">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display' }}>
            ¿Por qué Veracruz Contigo?
          </h2>
          <p className="text-white/80 mb-12 max-w-2xl mx-auto">
            La plataforma oficial de turismo que te acompaña en cada paso de tu aventura
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-left">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Municipios Grid */}
      {municipios.length > 0 && (
        <section className="py-20 px-4" data-testid="municipios-section">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-6 h-6 text-[#1B5E20]" />
                  <span className="text-[#1B5E20] font-semibold uppercase tracking-wider text-sm">232 municipios</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
                  Explora Veracruz
                </h2>
              </div>
              <Link to="/explorar" className="hidden md:flex items-center gap-2 text-[#1B5E20] font-medium hover:underline">
                Ver todos
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {municipios.slice(0, 8).map((m) => (
                <MunicipioCard key={m.id} municipio={m} />
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Link to="/explorar">
                <Button className="bg-[#1B5E20] hover:bg-[#145218] text-white px-8 py-6 text-lg rounded-xl">
                  <MapPin className="w-5 h-5 mr-2" />
                  Explorar todos los municipios
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
      <PanicButton />
    </div>
  );
};

export default HomePage;
