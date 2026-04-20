import { useState } from "react";
import { ShieldAlert, Phone, AlertTriangle, X, ChevronDown, ChevronUp } from "lucide-react";

const NUMS = [
  { label: "Policía / Ambulancia / Bomberos", numero: "911",           emoji: "🆘", color: "#C62828" },
  { label: "Cruz Roja",                       numero: "8009112000",    emoji: "🏥", color: "#B71C1C" },
  { label: "Protección Civil Veracruz",       numero: "2288120001",    emoji: "⚠️", color: "#E65100" },
  { label: "Turismo Seguro (24h)",            numero: "8009039200",    emoji: "🧳", color: "#1B5E20" },
  { label: "Denuncia Anónima",                numero: "8880020002",    emoji: "🔒", color: "#4A148C" },
];

const WidgetEmergencia = () => {
  const [expandido,   setExpandido]   = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const handlePanic = () => {
    if (!confirmando) { setConfirmando(true); setTimeout(() => setConfirmando(false), 3000); return; }
    window.location.href = "tel:911";
  };

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: "#0f0f0f" }}>
      {/* Header oscuro premium */}
      <div className="relative px-5 pt-5 pb-4 overflow-hidden">
        <div className="absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(ellipse at top left, #C62828 0%, transparent 60%)" }} />
        <div className="relative z-10 flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #C62828, #E53935)" }}>
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm leading-tight">Emergencias</p>
              <p className="text-white/40 text-xs">Ayuda inmediata 24/7</p>
            </div>
          </div>
        </div>

        {/* Botón pánico */}
        <button onClick={handlePanic}
          className={`relative w-full py-5 rounded-2xl font-black text-lg flex flex-col items-center justify-center gap-1 transition-all active:scale-95 overflow-hidden ${
            confirmando ? "scale-105" : ""
          }`}
          style={{
            background: confirmando
              ? "linear-gradient(135deg, #fff 0%, #ffebee 100%)"
              : "linear-gradient(135deg, #C62828 0%, #E53935 50%, #D32F2F 100%)",
            boxShadow: confirmando
              ? "0 0 30px rgba(198,40,40,0.6)"
              : "0 8px 32px rgba(198,40,40,0.4)",
            color: confirmando ? "#C62828" : "white",
          }}>
          {/* Pulso animado */}
          {!confirmando && (
            <span className="absolute inset-0 rounded-2xl animate-ping opacity-20"
              style={{ background: "linear-gradient(135deg, #C62828, #E53935)" }} />
          )}
          <span className="text-3xl">{confirmando ? "⚠️" : "🆘"}</span>
          <span className="text-base font-black leading-tight">
            {confirmando ? "¡TOCA OTRA VEZ PARA LLAMAR!" : "LLAMAR AL 911"}
          </span>
          {!confirmando && <span className="text-xs font-medium opacity-70">Botón de emergencia</span>}
        </button>
      </div>

      {/* Números */}
      <div className="px-4 pb-2">
        <button onClick={() => setExpandido(e => !e)}
          className="w-full flex items-center justify-between py-2.5 text-white/40 hover:text-white/70 transition-colors text-xs font-semibold">
          <span>Números de emergencia</span>
          {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expandido && (
          <div className="space-y-1.5 pb-3">
            {NUMS.map(({ label, numero, emoji, color }) => (
              <a key={label} href={`tel:${numero}`}
                className="flex items-center justify-between px-4 py-3 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{emoji}</span>
                  <div>
                    <p className="text-white text-xs font-bold leading-tight">{label}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color }}>{numero}</p>
                  </div>
                </div>
                <Phone className="w-4 h-4 text-white/30" />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pb-4">
        <p className="text-white/20 text-[10px] text-center">
          Solo para México · Emergencias reales únicamente
        </p>
      </div>
    </div>
  );
};

export default WidgetEmergencia;