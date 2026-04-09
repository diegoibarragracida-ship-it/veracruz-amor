import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrestadorCard from "@/components/PrestadorCard";
import EventoCard from "@/components/EventoCard";
import PanicButton from "@/components/PanicButton";
import useAnalytics from "@/hooks/useAnalytics";
import { MapPin, Star, Heart, Share2, ArrowLeft, Camera, Video, Users, Calendar, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const MunicipioPage = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { trackView } = useAnalytics();
  const [municipio, setMunicipio] = useState(null);
  const [prestadores, setPrestadores] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [munRes] = await Promise.all([
          axios.get(`${API}/municipios/${slug}`),
        ]);
        
        setMunicipio(munRes.data);
        
        // Track view
        if (munRes.data.id) {
          trackView("municipio", munRes.data.id);
        }
        
        // Fetch related data
        if (munRes.data.id) {
          const [prestRes, eventosRes] = await Promise.all([
            axios.get(`${API}/prestadores`, { params: { municipio_id: munRes.data.id, verificado: true } }),
            axios.get(`${API}/eventos`, { params: { municipio_id: munRes.data.id, publicado: true } }),
          ]);
          setPrestadores(prestRes.data.prestadores || []);
          setEventos(eventosRes.data.eventos || []);
        }
      } catch (error) {
        console.error("Error fetching municipio:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${municipio.nombre} - Veracruz Contigo`,
        text: `Descubre ${municipio.nombre}, Veracruz`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Inicia sesión para guardar favoritos");
      return;
    }
    
    try {
      await axios.post(`${API}/favoritos`, {
        tipo: "municipio",
        referencia_id: municipio.id,
      });
      setIsFavorite(true);
      toast.success("Agregado a favoritos");
    } catch (error) {
      if (error.response?.status === 400) {
        toast.info("Ya está en tus favoritos");
      } else {
        toast.error("Error al agregar a favoritos");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-[#1B5E20]" />
        </div>
      </div>
    );
  }

  if (!municipio) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <Header />
        <div className="flex flex-col items-center justify-center h-[60vh] px-4">
          <MapPin className="w-16 h-16 text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Municipio no encontrado</h1>
          <p className="text-gray-500 mb-6">El municipio que buscas no existe o ha sido movido.</p>
          <Link to="/explorar">
            <Button className="bg-[#1B5E20] hover:bg-[#145218]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a explorar
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1600&q=90";

  return (
    <div className="min-h-screen bg-[#F5F5F5]" data-testid="municipio-page">
      <Header />
      
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${municipio.foto_portada_url || defaultImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Back button */}
        <div className="absolute top-24 left-4 md:left-8 z-10">
          <Link to="/explorar">
            <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
        
        {/* Actions */}
        <div className="absolute top-24 right-4 md:right-8 z-10 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/90 hover:bg-white"
            onClick={handleFavorite}
            data-testid="favorite-btn"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/90 hover:bg-white"
            onClick={handleShare}
            data-testid="share-btn"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-white/80 mb-3">
              <MapPin className="w-5 h-5" />
              <span>Región {municipio.region}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <h1 
                className="text-4xl md:text-6xl font-bold text-white"
                style={{ fontFamily: 'Playfair Display' }}
              >
                {municipio.nombre}
              </h1>
              {municipio.pueblo_magico && (
                <span className="pueblo-magico-badge px-4 py-2 rounded-full flex items-center gap-2 text-white font-semibold">
                  <Star className="w-5 h-5" />
                  Pueblo Mágico
                </span>
              )}
            </div>
            
            {/* Tags */}
            {municipio.tags && municipio.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {municipio.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {municipio.estado === "sin_configurar" || municipio.estado === "borrador" ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-[#1B5E20]/30" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display' }}>
                Próximamente
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Este municipio está preparando su contenido turístico. 
                Pronto podrás conocer todos sus atractivos.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="info" className="space-y-8">
              <TabsList className="bg-white p-1 rounded-xl shadow-sm">
                <TabsTrigger value="info" className="rounded-lg">Información</TabsTrigger>
                <TabsTrigger value="galeria" className="rounded-lg">
                  <Camera className="w-4 h-4 mr-2" />
                  Galería
                </TabsTrigger>
                <TabsTrigger value="prestadores" className="rounded-lg">
                  <Users className="w-4 h-4 mr-2" />
                  Servicios
                </TabsTrigger>
                <TabsTrigger value="eventos" className="rounded-lg">
                  <Calendar className="w-4 h-4 mr-2" />
                  Eventos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    {municipio.descripcion && (
                      <div className="bg-white rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display' }}>
                          Acerca de {municipio.nombre}
                        </h2>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                          {municipio.descripcion}
                        </p>
                      </div>
                    )}
                    
                    {/* History */}
                    {municipio.historia && (
                      <div className="bg-white rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display' }}>
                          Historia
                        </h2>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                          {municipio.historia}
                        </p>
                      </div>
                    )}
                    
                    {/* What to do */}
                    {municipio.que_hacer && municipio.que_hacer.length > 0 && (
                      <div className="bg-white rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display' }}>
                          Qué hacer aquí
                        </h2>
                        <ul className="space-y-3">
                          {municipio.que_hacer.map((item, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="w-6 h-6 bg-[#1B5E20]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="w-2 h-2 bg-[#1B5E20] rounded-full" />
                              </span>
                              <span className="text-gray-600">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Quick Info */}
                    <div className="bg-white rounded-2xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Información rápida</h3>
                      <div className="space-y-4">
                        {municipio.clima && (
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🌤️</span>
                            <div>
                              <p className="text-sm text-gray-500">Clima</p>
                              <p className="font-medium">{municipio.clima}</p>
                            </div>
                          </div>
                        )}
                        {municipio.altitud && (
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">⛰️</span>
                            <div>
                              <p className="text-sm text-gray-500">Altitud</p>
                              <p className="font-medium">{municipio.altitud}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📍</span>
                          <div>
                            <p className="text-sm text-gray-500">Región</p>
                            <p className="font-medium">{municipio.region}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* How to get there */}
                    {municipio.como_llegar && (
                      <div className="bg-white rounded-2xl p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Cómo llegar</h3>
                        <p className="text-gray-600 text-sm mb-4">{municipio.como_llegar}</p>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${municipio.lat},${municipio.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#0277BD] font-medium hover:underline"
                        >
                          <Navigation className="w-4 h-4" />
                          Ver en Google Maps
                        </a>
                      </div>
                    )}
                    
                    {/* Map Preview */}
                    <div className="bg-white rounded-2xl overflow-hidden">
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${municipio.lat},${municipio.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center"
                        >
                          <MapPin className="w-12 h-12 mx-auto mb-2 text-[#1B5E20]" />
                          <span className="text-sm text-gray-500">Ver en mapa</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="galeria">
                <div className="bg-white rounded-2xl p-8">
                  {municipio.fotos && municipio.fotos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {municipio.fotos.map((foto, index) => (
                        <div key={index} className="aspect-[4/3] rounded-xl overflow-hidden">
                          <img 
                            src={foto.url || foto} 
                            alt={foto.etiqueta || `Foto ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">Galería en preparación</p>
                    </div>
                  )}
                  
                  {municipio.videos && municipio.videos.length > 0 && (
                    <div className="mt-8">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Videos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {municipio.videos.map((video, index) => (
                          <div key={index} className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                            <iframe
                              src={video.replace("watch?v=", "embed/")}
                              title={`Video ${index + 1}`}
                              className="w-full h-full"
                              allowFullScreen
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="prestadores">
                {prestadores.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prestadores.map((p) => (
                      <PrestadorCard key={p.id} prestador={p} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No hay prestadores verificados en este municipio aún</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="eventos">
                {eventos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventos.map((e) => (
                      <EventoCard key={e.id} evento={e} municipioNombre={municipio.nombre} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No hay eventos programados próximamente</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>

      <Footer />
      <PanicButton />
    </div>
  );
};

export default MunicipioPage;
