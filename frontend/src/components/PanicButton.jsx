import { useState } from "react";
import { useAuth } from "@/App";
import { ShieldAlert, Phone, Cross, Building2, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PanicButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isAuthenticated } = useAuth();

  const emergencyContacts = [
    { name: "911", label: "Emergencias", icon: ShieldAlert, color: "bg-red-600" },
    { name: "800-903-9200", label: "Policía Turística", icon: Phone, color: "bg-blue-600" },
    { name: "229-937-3434", label: "Cruz Roja", icon: Cross, color: "bg-red-500" },
  ];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Veracruz Contigo - Emergencia",
        text: "Necesito ayuda. Mi ubicación:",
        url: window.location.href,
      });
    }
  };

  return (
    <>
      {/* Floating Panic Button */}
      <div className="fixed bottom-6 right-6 z-40" data-testid="panic-button-container">
        {isExpanded && (
          <div className="absolute bottom-20 right-0 bg-white rounded-2xl shadow-2xl p-4 w-72 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Contactos de Emergencia</h3>
              <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              {emergencyContacts.map((contact) => (
                <a
                  key={contact.name}
                  href={`tel:${contact.name.replace(/-/g, "")}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  data-testid={`emergency-${contact.label.toLowerCase().replace(' ', '-')}`}
                >
                  <div className={`w-10 h-10 ${contact.color} rounded-full flex items-center justify-center`}>
                    <contact.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{contact.label}</p>
                    <p className="text-sm text-gray-500">{contact.name}</p>
                  </div>
                </a>
              ))}
              
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Compartir ubicación</p>
                  <p className="text-sm text-gray-500">WhatsApp</p>
                </div>
              </button>
            </div>
            
            {isAuthenticated ? (
              <Link to="/emergencia">
                <Button 
                  className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white"
                  data-testid="full-emergency-btn"
                >
                  <ShieldAlert className="w-5 h-5 mr-2" />
                  Activar alerta completa
                </Button>
              </Link>
            ) : (
              <p className="mt-4 text-xs text-center text-gray-500">
                <Link to="/login" className="text-[#0277BD] hover:underline">Inicia sesión</Link>
                {" "}para activar la alerta con GPS
              </p>
            )}
          </div>
        )}
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isExpanded 
              ? "bg-gray-200 text-gray-700" 
              : "bg-[#D32F2F] text-white animate-pulse-ring"
          }`}
          data-testid="panic-button"
        >
          {isExpanded ? (
            <X className="w-7 h-7" />
          ) : (
            <ShieldAlert className="w-7 h-7" />
          )}
        </button>
      </div>
    </>
  );
};

export default PanicButton;
