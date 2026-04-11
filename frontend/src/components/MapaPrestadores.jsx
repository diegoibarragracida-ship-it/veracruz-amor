import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API } from "@/App";
import { Loader2, MapPin, Hotel, Utensils, Mountain, Users, X, Phone, Star, MessageCircle } from "lucide-react";

const TIPOS_CONFIG = {
  hotel:      { color: "#1565C0", emoji: "🏨", label: "Hoteles" },
  restaurante:{ color: "#D32F2F", emoji: "🍽️", label: "Restaurantes" },
  actividad:  { color: "#2E7D32", emoji: "🎯", label: "Actividades" },
  tour:       { color: "#6A1B9A", emoji: "🗺️", label: "Tours" },
  transporte: { color: "#E65100", emoji: "🚗", label: "Transporte" },
  otro:       { color: "#546E7A", emoji: "📍", label: "Otros" },
};

const getTipoConfig = (tipo) =>
  TIPOS_CONFIG[tipo?.toLowerCase()] || TIPOS_CONFIG.otro;

const MapaPrestadores = ({ region, color }) => {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const [prestadores, setPrestadores] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filtros,     setFiltros]     = useState([]);
  const [seleccionado,setSeleccionado]= useState(null);
  const markersRef  = useRef([]);

  // Cargar prestadores
  useEffect(() => {
    const fetchPrestadores = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/prestadores/mapa`, {
          params: { region },
        });
        setPrestadores(data.prestadores || []);
      } catch (e) {
        console.error("Error cargando prestadores:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPrestadores();
  }, [region]);

  // Inicializar mapa Leaflet (una sola vez)
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    // Cargar CSS de Leaflet
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = window.L;
      if (!L || !mapRef.current) return;

      const centerByRegion = {
        orizaba: [18.855, -97.10],
        xalapa:  [19.54,  -96.91],
        tuxtlas: [18.43,  -95.12],
        norte:   [20.45,  -97.38],
        costa:   [19.19,  -96.14],
      };
      const center = centerByRegion[region] || [19.18, -96.14];

      const map = L.map(mapRef.current, { zoomControl: true }).setView(center, 11);
      mapInstance.current = map;

      // Tile layer bonito
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap · © CARTO",
        maxZoom: 18,
      }).addTo(map);
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.id    = "leaflet-js";
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Actualizar marcadores cuando cambian prestadores o filtros
  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstance.current) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtrados = prestadores.filter(p =>
      filtros.length === 0 || filtros.includes(p.tipo?.toLowerCase())
    );

    filtrados.forEach(p => {
      if (!p.lat || !p.lng) return;
      const cfg = getTipoConfig(p.tipo);

      // Icono personalizado SVG
      const iconHtml = `
        <div style="
          background: ${cfg.color};
          width: 32px; height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          <span style="transform: rotate(45deg); font-size: 14px;">${cfg.emoji}</span>
        </div>`;

      const icon = L.divIcon({
        html: iconHtml,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(mapInstance.current)
        .on("click", () => setSeleccionado(p));

      markersRef.current.push(marker);
    });
  }, [prestadores, filtros]);

  const tipos = [...new Set(prestadores.map(p => p.tipo?.toLowerCase()).filter(Boolean))];

  const toggleFiltro = (tipo) =>
    setFiltros(prev => prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]);

  const prestadoresFiltrados = prestadores.filter(p =>
    filtros.length === 0 || filtros.includes(p.tipo?.toLowerCase())
  );

  return (
    <div className="relative w-full" style={{ height: "600px" }}>
      {/* Barra de filtros */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-2">
        {tipos.map(tipo => {
          const cfg = getTipoConfig(tipo);
          const activo = filtros.includes(tipo) || filtros.length === 0;
          return (
            <button
              key={tipo}
              onClick={() => toggleFiltro(tipo)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all border-2 ${
                filtros.includes(tipo)
                  ? "text-white border-transparent"
                  : filtros.length === 0
                    ? "bg-white text-gray-700 border-white"
                    : "bg-white/60 text-gray-400 border-transparent"
              }`}
              style={filtros.includes(tipo) ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}>
              {cfg.emoji} {cfg.label}
              {filtros.length === 0 && (
                <span className="ml-1 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                  {prestadores.filter(p => p.tipo?.toLowerCase() === tipo).length}
                </span>
              )}
            </button>
          );
        })}
        {filtros.length > 0 && (
          <button onClick={() => setFiltros([])}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-800 text-white shadow-md">
            ✕ Todos
          </button>
        )}
      </div>

      {/* Counter */}
      <div className="absolute top-3 right-3 z-[1000] bg-white rounded-xl px-3 py-1.5 shadow-md text-xs font-semibold text-gray-700 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" style={{ color }} />
        {prestadoresFiltrados.length} prestadores verificados
      </div>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 z-[2000] bg-white/80 flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color }} />
            <p className="text-sm text-gray-500">Cargando prestadores…</p>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" />

      {/* Panel lateral del prestador seleccionado */}
      {seleccionado && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[1000] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ animation: "slideUp .2s ease-out" }}>
          <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

          {/* Foto o gradiente */}
          {seleccionado.foto_url ? (
            <img src={seleccionado.foto_url} alt={seleccionado.nombre}
              className="w-full h-32 object-cover" />
          ) : (
            <div className="w-full h-20 flex items-center justify-center text-4xl"
              style={{ background: `linear-gradient(135deg, ${getTipoConfig(seleccionado.tipo).color}33, ${getTipoConfig(seleccionado.tipo).color}66)` }}>
              {getTipoConfig(seleccionado.tipo).emoji}
            </div>
          )}

          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: getTipoConfig(seleccionado.tipo).color }}>
                  {getTipoConfig(seleccionado.tipo).label}
                  {seleccionado.subtipo && ` · ${seleccionado.subtipo}`}
                </span>
                <h4 className="font-bold text-gray-900 text-sm leading-tight">{seleccionado.nombre}</h4>
                {seleccionado.municipio_nombre && (
                  <p className="text-xs text-gray-400 mt-0.5">{seleccionado.municipio_nombre}, Ver.</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {seleccionado.calificacion_promedio > 0 && (
                  <span className="flex items-center gap-0.5 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-semibold">
                    <Star className="w-3 h-3 fill-current" />{seleccionado.calificacion_promedio.toFixed(1)}
                  </span>
                )}
                <button onClick={() => setSeleccionado(null)}
                  className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {seleccionado.descripcion && (
              <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">{seleccionado.descripcion}</p>
            )}

            {seleccionado.horarios && (
              <p className="text-xs text-gray-500 mb-3">🕐 {seleccionado.horarios}</p>
            )}

            <div className="flex gap-2">
              {seleccionado.whatsapp && (
                <a href={`https://wa.me/${seleccionado.whatsapp.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
              {seleccionado.telefono && (
                <a href={`tel:${seleccionado.telefono}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> Llamar
                </a>
              )}
              <a href={`https://www.google.com/maps/search/?api=1&query=${seleccionado.lat},${seleccionado.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                <MapPin className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaPrestadores;