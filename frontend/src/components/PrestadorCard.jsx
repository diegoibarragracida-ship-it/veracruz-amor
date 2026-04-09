import { Phone, MessageCircle, MapPin, Star, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAnalytics from "@/hooks/useAnalytics";

const PrestadorCard = ({ prestador }) => {
  const { trackContact } = useAnalytics();
  const defaultImage = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=85";
  
  const tipoColors = {
    HOSPEDAJE: "bg-blue-100 text-blue-800",
    GASTRONOMÍA: "bg-orange-100 text-orange-800",
    TRANSPORTE: "bg-green-100 text-green-800",
    TURISMO: "bg-purple-100 text-purple-800",
    ENTREGA: "bg-yellow-100 text-yellow-800",
    OTROS: "bg-gray-100 text-gray-800",
  };

  const handleWhatsApp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (prestador.whatsapp) {
      trackContact(prestador.id);
      window.open(`https://wa.me/${prestador.whatsapp}`, "_blank");
    }
  };

  const handleCall = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (prestador.telefono) {
      trackContact(prestador.id);
      window.location.href = `tel:${prestador.telefono}`;
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden card-hover"
      data-testid={`prestador-card-${prestador.id}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={prestador.foto_url || defaultImage}
          alt={prestador.nombre}
          className="w-full h-full object-cover"
        />
        
        {/* Type Badge */}
        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${tipoColors[prestador.tipo] || tipoColors.OTROS}`}>
          {prestador.subtipo || prestador.tipo}
        </span>
        
        {/* Verified Badge */}
        {prestador.verificado && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
            <BadgeCheck className="w-4 h-4 text-[#1B5E20]" />
            <span className="text-xs font-medium text-[#1B5E20]">Verificado</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
            {prestador.nombre}
          </h3>
          {prestador.calificacion_promedio > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-4 h-4 text-[#F9A825] fill-[#F9A825]" />
              <span className="text-sm font-medium">{prestador.calificacion_promedio}</span>
              <span className="text-xs text-gray-500">({prestador.total_resenas})</span>
            </div>
          )}
        </div>
        
        {prestador.descripcion && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {prestador.descripcion}
          </p>
        )}
        
        {prestador.direccion && (
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{prestador.direccion}</span>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          {prestador.whatsapp && (
            <Button
              onClick={handleWhatsApp}
              className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white"
              data-testid={`prestador-whatsapp-${prestador.id}`}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          )}
          {prestador.telefono && (
            <Button
              onClick={handleCall}
              variant="outline"
              className="flex-1"
              data-testid={`prestador-call-${prestador.id}`}
            >
              <Phone className="w-4 h-4 mr-2" />
              Llamar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrestadorCard;
