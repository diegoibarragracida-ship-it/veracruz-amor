import { Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const EventoCard = ({ evento, municipioNombre }) => {
  const defaultImage = "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=85";
  
  const tipoColors = {
    Cultural: "bg-purple-100 text-purple-800",
    Gastronómico: "bg-orange-100 text-orange-800",
    Deportivo: "bg-green-100 text-green-800",
    Musical: "bg-pink-100 text-pink-800",
    Religioso: "bg-blue-100 text-blue-800",
    Feria: "bg-yellow-100 text-yellow-800",
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "d MMM", { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden card-hover"
      data-testid={`evento-card-${evento.id}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={evento.foto_url || defaultImage}
          alt={evento.nombre}
          className="w-full h-full object-cover"
        />
        
        {/* Date Badge */}
        <div className="absolute top-3 left-3 bg-white rounded-lg overflow-hidden shadow-lg">
          <div className="bg-[#1B5E20] text-white text-xs font-semibold px-3 py-1 text-center">
            {formatDate(evento.fecha_inicio).split(' ')[1]?.toUpperCase()}
          </div>
          <div className="text-2xl font-bold text-center py-1 px-3">
            {formatDate(evento.fecha_inicio).split(' ')[0]}
          </div>
        </div>
        
        {/* Type Badge */}
        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${tipoColors[evento.tipo] || "bg-gray-100 text-gray-800"}`}>
          {evento.tipo}
        </span>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-2">
          {evento.nombre}
        </h3>
        
        {evento.descripcion && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {evento.descripcion}
          </p>
        )}
        
        <div className="space-y-2">
          {municipioNombre && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{municipioNombre}</span>
            </div>
          )}
          
          {evento.lugar && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>{evento.lugar}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(evento.fecha_inicio)}
              {evento.fecha_fin && evento.fecha_fin !== evento.fecha_inicio && ` - ${formatDate(evento.fecha_fin)}`}
            </span>
          </div>
        </div>
        
        {evento.link_externo && (
          <a
            href={evento.link_externo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-[#0277BD] hover:text-[#01579B] font-medium text-sm"
          >
            Más información →
          </a>
        )}
      </div>
    </div>
  );
};

export default EventoCard;
