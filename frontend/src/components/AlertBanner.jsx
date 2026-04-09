import { AlertTriangle, X } from "lucide-react";

const AlertBanner = ({ alertas = [] }) => {
  const activeAlerts = alertas.filter(a => a.activa);
  
  if (activeAlerts.length === 0) return null;

  const tipoColors = {
    meteorológica: "bg-blue-600",
    seguridad: "bg-red-600",
    vial: "bg-orange-600",
    salud: "bg-purple-600",
  };

  return (
    <div className="fixed top-16 md:top-20 left-0 right-0 z-40" data-testid="alert-banner">
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`${tipoColors[alert.tipo?.toLowerCase()] || "bg-red-600"} text-white py-2 px-4`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold">{alert.titulo}</span>
                {alert.descripcion && (
                  <span className="hidden md:inline ml-2 text-white/90">— {alert.descripcion}</span>
                )}
              </div>
            </div>
            <button className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertBanner;
