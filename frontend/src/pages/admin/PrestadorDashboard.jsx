import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { User, MapPin, Phone, Clock, LogOut, Save, Loader2, Star, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const PrestadorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [prestador, setPrestador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPrestador = async () => {
      try {
        // Find prestador linked to this user
        const response = await axios.get(`${API}/prestadores`);
        const found = response.data.prestadores?.find(p => p.user_id === user?.user_id);
        if (found) {
          setPrestador(found);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrestador();
  }, [user?.user_id]);

  const handleSave = async () => {
    if (!prestador) return;
    setSaving(true);
    try {
      await axios.put(`${API}/prestadores/${prestador.id}`, {
        descripcion: prestador.descripcion,
        telefono: prestador.telefono,
        whatsapp: prestador.whatsapp,
        horarios: prestador.horarios,
        direccion: prestador.direccion,
      });
      toast.success("Información actualizada");
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#F9A825]" />
      </div>
    );
  }

  if (!prestador) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8" data-testid="prestador-no-profile">
        <User className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sin perfil de prestador</h1>
        <p className="text-gray-500 text-center max-w-md mb-6">
          Tu cuenta no tiene un perfil de prestador vinculado. Contacta al administrador.
        </p>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="prestador-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F9A825] rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">{prestador.nombre}</h1>
              <p className="text-xs text-gray-500">Panel de Prestador</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} className="bg-[#F9A825] hover:bg-[#F57F17]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar cambios
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            {prestador.foto_url ? (
              <img src={prestador.foto_url} alt="" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-[#F9A825]/20 flex items-center justify-center">
                <User className="w-12 h-12 text-[#F9A825]" />
              </div>
            )}
            <h2 className="font-semibold text-lg text-gray-900">{prestador.nombre}</h2>
            <p className="text-sm text-gray-500">{prestador.tipo}</p>
            
            {prestador.verificado && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <BadgeCheck className="w-4 h-4" />
                Verificado
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t text-left space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Star className="w-4 h-4 text-[#F9A825]" />
                <span className="font-medium">{prestador.calificacion_promedio || 0}</span>
                <span className="text-gray-500">({prestador.total_resenas || 0} reseñas)</span>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Información del servicio</h3>
              <div className="space-y-4">
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={prestador.descripcion || ""}
                    onChange={(e) => setPrestador({ ...prestador, descripcion: e.target.value })}
                    placeholder="Describe tu servicio..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={prestador.telefono || ""}
                      onChange={(e) => setPrestador({ ...prestador, telefono: e.target.value })}
                      placeholder="229-123-4567"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    value={prestador.whatsapp || ""}
                    onChange={(e) => setPrestador({ ...prestador, whatsapp: e.target.value })}
                    placeholder="522291234567"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Horarios y ubicación</h3>
              <div className="space-y-4">
                <div>
                  <Label>Horarios de atención</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={prestador.horarios || ""}
                      onChange={(e) => setPrestador({ ...prestador, horarios: e.target.value })}
                      placeholder="Lun-Vie 9:00-18:00"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Textarea
                      value={prestador.direccion || ""}
                      onChange={(e) => setPrestador({ ...prestador, direccion: e.target.value })}
                      placeholder="Dirección completa..."
                      className="pl-10"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrestadorDashboard;
