import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import useAnalytics from "@/hooks/useAnalytics";
import { Search, MapPin, Calendar, Users, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const SearchBar = ({ onClose, variant = "default" }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ municipios: [], eventos: [], prestadores: [] });
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { trackSearch } = useAnalytics();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults({ municipios: [], eventos: [], prestadores: [] });
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/search`, { params: { q: query } });
        setResults(response.data);
        setShowResults(true);
        // Track search after getting results
        trackSearch(query);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (type, item) => {
    setShowResults(false);
    setQuery("");
    if (onClose) onClose();

    switch (type) {
      case "municipio":
        navigate(`/municipio/${item.slug}`);
        break;
      case "evento":
        navigate(`/eventos?id=${item.id}`);
        break;
      case "prestador":
        navigate(`/prestadores?id=${item.id}`);
        break;
      default:
        break;
    }
  };

  const hasResults = results.municipios.length > 0 || results.eventos.length > 0 || results.prestadores.length > 0;

  const isHero = variant === "hero";

  return (
    <div className="relative w-full">
      <div className={`relative ${isHero ? "max-w-2xl mx-auto" : ""}`}>
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isHero ? "w-6 h-6 text-gray-400" : "w-5 h-5 text-gray-400"}`} />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar municipios, eventos, prestadores..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${
            isHero 
              ? "w-full pl-14 pr-12 py-6 text-lg bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-2xl focus:ring-2 focus:ring-[#1B5E20]" 
              : "w-full pl-12 pr-10 py-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20]"
          }`}
          data-testid="search-input"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
        {query && !loading && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Filters */}
      {isHero && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {["Pueblo Mágico", "Playa", "Gastronomía", "Aventura", "Cultura"].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
              data-testid={`filter-${tag.toLowerCase().replace(' ', '-')}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Results Dropdown */}
      {showResults && hasResults && (
        <div className={`absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 ${isHero ? "max-w-2xl mx-auto" : ""}`}>
          {results.municipios.length > 0 && (
            <div className="p-3 border-b">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Municipios</h3>
              {results.municipios.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect("municipio", item)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  data-testid={`search-result-municipio-${item.slug}`}
                >
                  {item.foto_portada_url ? (
                    <img src={item.foto_portada_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#1B5E20]/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#1B5E20]" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{item.nombre}</p>
                    <p className="text-xs text-gray-500">{item.region}</p>
                  </div>
                  {item.pueblo_magico && (
                    <span className="ml-auto px-2 py-0.5 bg-[#F9A825]/20 text-[#F57F17] text-xs font-medium rounded-full">
                      Pueblo Mágico
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {results.eventos.length > 0 && (
            <div className="p-3 border-b">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Eventos</h3>
              {results.eventos.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect("evento", item)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  data-testid={`search-result-evento-${item.id}`}
                >
                  {item.foto_url ? (
                    <img src={item.foto_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#0277BD]/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#0277BD]" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{item.nombre}</p>
                    <p className="text-xs text-gray-500">{item.tipo} • {item.fecha_inicio}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.prestadores.length > 0 && (
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Prestadores</h3>
              {results.prestadores.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect("prestador", item)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  data-testid={`search-result-prestador-${item.id}`}
                >
                  {item.foto_url ? (
                    <img src={item.foto_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#F9A825]/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#F9A825]" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{item.nombre}</p>
                    <p className="text-xs text-gray-500">{item.tipo}</p>
                  </div>
                  {item.calificacion_promedio > 0 && (
                    <span className="ml-auto flex items-center gap-1 text-sm text-[#F9A825]">
                      ⭐ {item.calificacion_promedio}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showResults && !hasResults && query.length >= 2 && !loading && (
        <div className={`absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-8 text-center z-50 ${isHero ? "max-w-2xl mx-auto" : ""}`}>
          <p className="text-gray-500">No se encontraron resultados para "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
