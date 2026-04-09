import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { BarChart3, TrendingUp, MapPin, Users, Search, Eye, Phone, Calendar, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const AnalyticsDashboard = ({ municipioId = null, isGlobal = true }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const endpoint = isGlobal 
          ? `${API}/analytics/global`
          : `${API}/analytics/municipio/${municipioId}`;
        
        const response = await axios.get(endpoint, { params: { days: parseInt(period) } });
        setAnalytics(response.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isGlobal || municipioId) {
      fetchAnalytics();
    }
  }, [isGlobal, municipioId, period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No hay datos de analíticas disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#1B5E20]" />
          {isGlobal ? "Analíticas Globales" : `Analíticas - ${analytics.municipio_nombre}`}
        </h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      {isGlobal && analytics.totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            icon={Eye} 
            label="Vistas Totales" 
            value={analytics.totals.views} 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={Phone} 
            label="Contactos" 
            value={analytics.totals.contacts} 
            color="bg-green-500" 
          />
          <StatCard 
            icon={Search} 
            label="Búsquedas" 
            value={analytics.totals.searches} 
            color="bg-purple-500" 
          />
        </div>
      )}

      {!isGlobal && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard 
            icon={Eye} 
            label="Vistas del Municipio" 
            value={analytics.total_views} 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={Calendar} 
            label="Eventos Publicados" 
            value={analytics.eventos_count} 
            color="bg-orange-500" 
          />
        </div>
      )}

      {/* Views Chart */}
      {analytics.views_by_day && analytics.views_by_day.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1B5E20]" />
            Vistas por día
          </h3>
          <div className="h-48 flex items-end gap-1">
            {analytics.views_by_day.map((day, index) => {
              const maxCount = Math.max(...analytics.views_by_day.map(d => d.count));
              const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              return (
                <div 
                  key={index}
                  className="flex-1 bg-[#1B5E20]/20 hover:bg-[#1B5E20]/40 transition-colors rounded-t relative group"
                  style={{ height: `${Math.max(height, 5)}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.count} vistas
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{analytics.views_by_day[0]?._id}</span>
            <span>{analytics.views_by_day[analytics.views_by_day.length - 1]?._id}</span>
          </div>
        </div>
      )}

      {/* Top Municipios (Global only) */}
      {isGlobal && analytics.top_municipios && analytics.top_municipios.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#1B5E20]" />
            Municipios más visitados
          </h3>
          <div className="space-y-3">
            {analytics.top_municipios.map((mun, index) => (
              <div key={mun.id} className="flex items-center gap-4">
                <span className="w-6 h-6 bg-[#1B5E20]/10 rounded-full flex items-center justify-center text-sm font-semibold text-[#1B5E20]">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{mun.nombre}</span>
                    {mun.pueblo_magico && (
                      <Badge className="bg-[#F9A825] text-xs">Pueblo Mágico</Badge>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500">{mun.views} vistas</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Prestadores */}
      {analytics.top_prestadores && analytics.top_prestadores.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F9A825]" />
            Prestadores más contactados
          </h3>
          <div className="space-y-3">
            {analytics.top_prestadores.map((pres, index) => (
              <div key={pres.id} className="flex items-center gap-4">
                <span className="w-6 h-6 bg-[#F9A825]/10 rounded-full flex items-center justify-center text-sm font-semibold text-[#F9A825]">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <span className="font-medium">{pres.nombre}</span>
                  <span className="text-sm text-gray-500 ml-2">({pres.tipo})</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{pres.contactos_total || 0} contactos</span>
                  <span className="text-xs text-gray-400 block">{pres.vistas_total || 0} vistas</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Searches (Global only) */}
      {isGlobal && analytics.top_searches && analytics.top_searches.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-500" />
            Términos más buscados
          </h3>
          <div className="flex flex-wrap gap-2">
            {analytics.top_searches.map((search, index) => (
              <span 
                key={index}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm"
              >
                {search._id} ({search.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value?.toLocaleString() || 0}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  </div>
);

export default AnalyticsDashboard;
