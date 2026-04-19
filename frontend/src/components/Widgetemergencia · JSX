import { useState } from "react";
import { ShieldAlert, Phone, MapPin, AlertTriangle, X, ChevronRight } from "lucide-react";

const EMERGENCIAS = [
  { label: "Policía",       numero: "911",      color: "#1565C0", emoji: "🚔" },
  { label: "Bomberos",      numero: "911",      color: "#C62828", emoji: "🚒" },
  { label: "Cruz Roja",     numero: "800-911-2000", color: "#B71C1C", emoji: "🏥" },
  { label: "Protección Civil Veracruz", numero: "228-812-0001", color: "#E65100", emoji: "⚠️" },
  { label: "Turismo Seguro", numero: "800-903-9200", color: "#1B5E20", emoji: "🧳" },
];

const WidgetEmergencia = () => {
  const [expandido, setExpandido] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);

  const handlePanic = () => {
    if (!confirmando) { setConfirmando(true); return; }
    // Obtener ubicación y llamar al 911
    setGeoLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setUbicacion({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) });
        setGeoLoading(false);
        window.location.href = "tel:911";
      },
      () => { setGeoLoading(false); window.location.href = "tel:911"; }
    );
  };

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border border-red-100">
      {/* Header rojo */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm">Emergencias</p>
              <p className="text-white/60 text-xs">Ayuda inmediata</p>
            </div>
          </div>
          <button onClick={() => setExpandido(e => !e)}
            className="text-white/60 hover:text-white transition-colors">
            {expandido ? <X className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Botón de pánico */}
        <button
          onClick={handlePanic}
          onBlur={() => setConfirmando(false)}
          className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
            confirmando
              ? "bg-white text-red-700 animate-pulse"
              : "bg-white/15 border-2 border-white/30 text-white hover:bg-white/25"
          }`}>
          {geoLoading ? (
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <AlertTriangle className={`w-5 h-5 ${confirmando ? "text-red-600" : "text-white"}`} />
          )}
          {confirmando ? "¡Toca de nuevo para llamar!" : "🆘 Llamar al 911"}
        </button>

        {ubicacion && (
          <p className="text-white/50 text-[10px] text-center mt-2 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" /> {ubicacion.lat}, {ubicacion.lng}
          </p>
        )}
      </div>

      {/* Números de emergencia */}
      {expandido && (
        <div className="bg-white divide-y divide-gray-50">
          {EMERGENCIAS.map(({ label, numero, color, emoji }) => (
            <a key={label} href={`tel:${numero.replace(/\D/g, "")}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-xl">{emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{numero}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
              </div>
            </a>
          ))}
          <div className="px-5 py-3 bg-amber-50">
            <p className="text-xs text-amber-700 font-medium flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              En caso de emergencia real marca 911. Estos números son para México.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetEmergencia;