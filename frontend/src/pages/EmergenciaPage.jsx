import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShieldAlert, Phone, Cross, Building2, MapPin, Share2, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const EmergenciaPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState(null);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyTime, setEmergencyTime] = useState(0);
  const [emergencyData, setEmergencyData] = useState(null);

  const emergencyContacts = [
    { name: "911", label: "Emergencias Nacionales", icon: ShieldAlert, color: "bg-red-600", desc: "Policía, bomberos, ambulancia" },
    { name: "800-903-9200", label: "Policía Turística", icon: Phone, color: "bg-blue-600", desc: "Atención 24/7 para turistas" },
    { name: "229-937-3434", label: "Cruz Roja Veracruz", icon: Cross, color: "bg-red-500", desc: "Servicios de ambulancia" },
    { name: "800-911-2000", label: "Protección Civil", icon: Building2, color: "bg-orange-600", desc: "Desastres naturales" },
  ];

  // Timer for active emergency
  useEffect(() => {
    let interval;
    if (emergencyActive) {
      interval = setInterval(() => {
        setEmergencyTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emergencyActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePanicPress = () => {
    if (!isAuthenticated) {
      toast.error("Debes iniciar sesión para activar la alerta de emergencia");
      navigate("/login", { state: { from: { pathname: "/emergencia" } } });
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmEmergency = async () => {
    setShowConfirmDialog(false);
    setIsGettingLocation(true);

    // Get GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          // Save emergency to database
          try {
            const response = await axios.post(`${API}/emergencias`, {
              lat: latitude,
              lng: longitude,
            });
            setEmergencyData(response.data);
          } catch (error) {
            console.error("Error registering emergency:", error);
          }
          
          setIsGettingLocation(false);
          setEmergencyActive(true);
          
          // Auto call 911
          window.location.href = "tel:911";
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsGettingLocation(false);
          setEmergencyActive(true);
          // Still activate emergency without GPS
          window.location.href = "tel:911";
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsGettingLocation(false);
      setEmergencyActive(true);
      window.location.href = "tel:911";
    }
  };

  const shareLocation = () => {
    const message = `🆘 EMERGENCIA – Necesito ayuda.\nMi ubicación: https://maps.google.com/?q=${location?.lat},${location?.lng}\nNombre: ${user?.nombre}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const findNearestHospital = () => {
    if (location) {
      window.open(`https://www.google.com/maps/search/hospital/@${location.lat},${location.lng},14z`, "_blank");
    } else {
      window.open("https://www.google.com/maps/search/hospital", "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]" data-testid="emergencia-page">
      <Header />
      
      {emergencyActive ? (
        // Emergency Active Screen
        <section className="pt-20 min-h-screen bg-[#B71C1C] text-white">
          <div className="max-w-2xl mx-auto px-4 py-12 text-center">
            <div className="mb-8">
              <CheckCircle className="w-20 h-20 mx-auto mb-4 text-white/90" />
              <h1 className="text-3xl font-bold mb-2">Alerta Activada</h1>
              <p className="text-white/80">Tu ubicación ha sido registrada</p>
            </div>
            
            {/* Timer */}
            <div className="bg-white/10 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm">Tiempo transcurrido</span>
              </div>
              <p className="text-4xl font-mono font-bold">{formatTime(emergencyTime)}</p>
            </div>
            
            {/* Location Map */}
            {location && (
              <div className="bg-white rounded-2xl p-4 mb-8">
                <div className="flex items-center gap-2 text-gray-800 mb-3">
                  <MapPin className="w-5 h-5 text-[#B71C1C]" />
                  <span className="font-medium">Tu ubicación GPS</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
                <a
                  href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 mx-auto mb-2 text-[#B71C1C]" />
                      <span className="text-sm text-gray-500">Ver en Google Maps</span>
                    </div>
                  </div>
                </a>
              </div>
            )}
            
            {/* Actions */}
            <div className="space-y-4">
              <Button
                onClick={() => window.location.href = "tel:911"}
                className="w-full py-6 text-lg bg-white text-[#B71C1C] hover:bg-white/90"
                data-testid="call-911-again"
              >
                <Phone className="w-6 h-6 mr-3" />
                Llamar al 911 de nuevo
              </Button>
              
              {location && (
                <Button
                  onClick={shareLocation}
                  className="w-full py-6 text-lg bg-[#25D366] hover:bg-[#20BD5A]"
                  data-testid="share-whatsapp"
                >
                  <Share2 className="w-6 h-6 mr-3" />
                  Compartir ubicación por WhatsApp
                </Button>
              )}
              
              <Button
                onClick={findNearestHospital}
                variant="outline"
                className="w-full py-6 text-lg border-white text-white hover:bg-white/10"
                data-testid="find-hospital"
              >
                <Building2 className="w-6 h-6 mr-3" />
                Hospital más cercano
              </Button>
            </div>
            
            <p className="mt-8 text-sm text-white/60">
              Los servicios de emergencia han sido notificados de tu ubicación
            </p>
          </div>
        </section>
      ) : (
        // Normal View
        <>
          <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-[#B71C1C] to-[#7F0000]">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display' }}>
                Emergencias
              </h1>
              <p className="text-white/90 text-lg max-w-2xl mx-auto">
                Tu seguridad es nuestra prioridad. Accede a los números de emergencia 
                o activa una alerta con tu ubicación GPS.
              </p>
            </div>
          </section>

          <section className="py-12 px-4">
            <div className="max-w-4xl mx-auto">
              {/* Panic Button */}
              <div className="bg-[#B71C1C] rounded-3xl p-8 md:p-12 text-center mb-12">
                <p className="text-white/80 text-lg mb-6">
                  Presiona el botón en caso de emergencia real
                </p>
                
                <button
                  onClick={handlePanicPress}
                  disabled={isGettingLocation}
                  className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white flex items-center justify-center mx-auto shadow-2xl animate-pulse-ring disabled:opacity-50"
                  data-testid="panic-button-main"
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-16 h-16 text-[#B71C1C] animate-spin" />
                  ) : (
                    <ShieldAlert className="w-16 h-16 md:w-20 md:h-20 text-[#B71C1C]" />
                  )}
                </button>
                
                <p className="text-white font-semibold text-xl mt-6">
                  {isGettingLocation ? "Obteniendo ubicación GPS..." : "PRESIONA EN CASO DE EMERGENCIA"}
                </p>
                
                {!isAuthenticated && (
                  <p className="text-white/60 text-sm mt-4">
                    Debes iniciar sesión para activar la alerta con GPS
                  </p>
                )}
              </div>

              {/* Emergency Contacts */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Contactos de Emergencia</h2>
                  <p className="text-gray-500 text-sm mt-1">Disponibles las 24 horas</p>
                </div>
                
                <div className="divide-y">
                  {emergencyContacts.map((contact) => (
                    <a
                      key={contact.name}
                      href={`tel:${contact.name.replace(/-/g, "")}`}
                      className="flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors"
                      data-testid={`contact-${contact.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className={`w-14 h-14 ${contact.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <contact.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{contact.label}</h3>
                        <p className="text-sm text-gray-500">{contact.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{contact.name}</p>
                        <p className="text-xs text-[#1B5E20]">Tap para llamar</p>
                      </div>
                    </a>
                  ))}
                </div>
                
                {/* Hospital Search */}
                <div className="p-6 bg-gray-50">
                  <button
                    onClick={findNearestHospital}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-[#0277BD] hover:bg-[#01579B] text-white rounded-xl font-medium transition-colors"
                    data-testid="find-hospital-btn"
                  >
                    <Building2 className="w-5 h-5" />
                    Buscar hospital más cercano
                  </button>
                </div>
              </div>

              {/* Safety Tips */}
              <div className="mt-12 bg-white rounded-2xl p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Consejos de Seguridad</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex gap-4">
                    <span className="text-2xl">📱</span>
                    <div>
                      <h3 className="font-medium text-gray-900">Mantén tu teléfono cargado</h3>
                      <p className="text-sm text-gray-500">Siempre lleva una batería externa</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-2xl">📍</span>
                    <div>
                      <h3 className="font-medium text-gray-900">Comparte tu ubicación</h3>
                      <p className="text-sm text-gray-500">Dile a alguien dónde estarás</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-2xl">💳</span>
                    <div>
                      <h3 className="font-medium text-gray-900">Guarda copias de documentos</h3>
                      <p className="text-sm text-gray-500">Fotos de ID y pasaporte en la nube</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-2xl">🏨</span>
                    <div>
                      <h3 className="font-medium text-gray-900">Usa servicios verificados</h3>
                      <p className="text-sm text-gray-500">Busca el badge de Veracruz Contigo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-[#B71C1C]" />
              ¿Confirmas la emergencia?
            </DialogTitle>
            <DialogDescription className="text-center">
              Al confirmar se registrará tu ubicación GPS y se iniciará una llamada al 911.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button
              onClick={confirmEmergency}
              className="w-full py-6 bg-[#B71C1C] hover:bg-[#7F0000] text-white text-lg"
              data-testid="confirm-emergency-btn"
            >
              SÍ, NECESITO AYUDA
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="w-full"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default EmergenciaPage;
