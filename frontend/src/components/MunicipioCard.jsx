import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";

const MunicipioCard = ({ municipio, size = "default" }) => {
  const isLarge = size === "large";
  
  const defaultImage = "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&q=85";
  
  return (
    <Link
      to={`/municipio/${municipio.slug}`}
      className={`group relative overflow-hidden rounded-2xl card-hover block ${
        isLarge ? "h-[400px] md:h-[500px]" : "h-[280px]"
      }`}
      data-testid={`municipio-card-${municipio.slug}`}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${municipio.foto_portada_url || defaultImage})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      
      {/* Pueblo Mágico Badge */}
      {municipio.pueblo_magico && (
        <div className="absolute top-4 right-4 pueblo-magico-badge px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white text-sm font-medium">
          <Star className="w-4 h-4" />
          Pueblo Mágico
        </div>
      )}
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
          <MapPin className="w-4 h-4" />
          <span>{municipio.region}</span>
        </div>
        <h3 
          className={`text-white font-bold ${isLarge ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"}`}
          style={{ fontFamily: 'Playfair Display' }}
        >
          {municipio.nombre}
        </h3>
        
        {/* Tags */}
        {municipio.tags && municipio.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {municipio.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag}
                className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Hover Button */}
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#1B5E20] rounded-xl font-medium text-sm">
            Descubrir
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MunicipioCard;
