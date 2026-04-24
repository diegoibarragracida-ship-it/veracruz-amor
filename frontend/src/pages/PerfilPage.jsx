import { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  User, Heart, MapPin, Calendar, Users, Star,
  Trash2, Loader2, BadgeCheck, Phone, Edit2, Save,
  Clock, DollarSign, CheckCircle, XCircle, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const ESTADO_COLORS = {
  pendiente:  "bg-amber-100 text-amber-800 border-amber-200",
  aceptada:   "bg-blue-100 text-blue-800 border-blue-200",
  completada: "bg-green-100 text-green-800 border-green-200",
  cancelada:  "bg-red-100 text-red-800 border-red-200",
};

const PerfilPage = () => {
  const { user, logout, setUser } = useAuth();
  const [favoritos,  setFavoritos]  = useState([]);
  const [reservas,   setReservas]   = useState([]);
  const [resenas,    setResenas]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [editando,   setEditando]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [perfil,     setPerfil]     = useState({ nombre: user?.nombre || "", telefono: user?.telefono || "" });

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [favRes, resvRes, resenasRes] = await Promise.all([
          axios.get(`${API}/favoritos`).catch(() => ({ data: [] })),
          axios.get(`${API}/reservas/mis-reservas`).catch(() => ({ data: { reservas: [] } })),
          axios.get(`${API}/resenas/mis-resenas`).catch(() => ({ data: { resenas: [] } })),
        ]);
        setFavoritos(favRes.data || []);
        setReservas(resvRes.data.reservas || resvRes.data || []);
        setResenas(resenasRes.data.resenas || resenasRes.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleRemoveFavorito = async (id) => {
    try {
      await axios.delete(`${API}/favoritos/${id}`);
      setFavoritos(prev => prev.filter(f => f.id !== id));
      toast.success("Eliminado de favoritos");
    } catch { toast.error("Error al eliminar"); }
  };

  const handleSavePerfil = async () => {
    setSaving(true);
    try {
      const { data } = await axios.put(`${API}/auth/perfil`, perfil);
      setUser(prev => ({ ...prev, ...data }));
      setEditando(false);
      toast.success("Perfil actualizado");
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const cancelarReserva = async (id) => {
    if (!confirm("¿Cancelar esta reserva?")) return;
    try {
      await axios.put(`${API}/reservas/${id}/estado`, { estado: "cancelada" });
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: "cancelada" } : r));
      toast.success("Reserva cancelada");
    } catch { toast.error("Error al cancelar"); }
  };

  const municipioFav  = favoritos.filter(f => f.tipo === "municipio");
  const eventFav      = favoritos.filter(f => f.tipo === "evento");
  const prestFav      = favoritos.filter(f => f.tipo === "prestador");
  const reservasPend  = reservas.filter(r => r.estado === "pendiente");
  const reservasAcept = reservas.filter(r => r.estado === "aceptada");

  return (
    <div className="min-h-screen bg-gray-50" data-testid="perfil-page">
      <Header />

      {/* Hero */}
      <section className="pt-20 pb-8 px-4 bg-gradient-to-br from-[#1B5E20] to-[#0D3311]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              {user?.foto_url ? (
                <img src={user.foto_url} alt={user.nombre}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              {user?.rol === "turista" && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{user?.nombre}</h1>
              <p className="text-white/70 text-sm mt-0.5">{user?.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                <span className="px-3 py-1 bg-white/15 rounded-full text-white text-xs font-semibold capitalize">
                  {user?.rol}
                </span>
                {reservasPend.length > 0 && (
                  <span className="px-3 py-1 bg-amber-400 rounded-full text-amber-900 text-xs font-bold">
                    {reservasPend.length} reserva{reservasPend.length !== 1 ? "s" : ""} pendiente{reservasPend.length !== 1 ? "s" : ""}
                  </span>
                )}
                {reservasAcept.length > 0 && (
                  <span className="px-3 py-1 bg-blue-400 rounded-full text-white text-xs font-bold">
                    {reservasAcept.length} reserva{reservasAcept.length !== 1 ? "s" : ""} confirmada{reservasAcept.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats rápidos */}
      <div className="max-w-4xl mx-auto px-4 -mt-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Reservas",  value: reservas.length,  emoji: "📅", color: "text-blue-700" },
            { label: "Favoritos", value: favoritos.length, emoji: "❤️", color: "text-red-600" },
            { label: "Reseñas",   value: resenas.length,   emoji: "⭐", color: "text-amber-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <p className="text-2xl">{s.emoji}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue={reservas.length > 0 ? "reservas" : "favoritos"} className="space-y-5">
            <TabsList className="bg-white p-1 rounded-xl shadow-sm flex-wrap h-auto gap-1">
              <TabsTrigger value="reservas" className="rounded-lg flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Mis Reservas
                {reservasPend.length > 0 && <span className="w-4 h-4 bg-amber-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{reservasPend.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="favoritos" className="rounded-lg">
                <Heart className="w-4 h-4 mr-1.5" /> Favoritos
              </TabsTrigger>
              <TabsTrigger value="resenas" className="rounded-lg">
                <Star className="w-4 h-4 mr-1.5" /> Mis Reseñas
              </TabsTrigger>
              <TabsTrigger value="cuenta" className="rounded-lg">
                <User className="w-4 h-4 mr-1.5" /> Mi Cuenta
              </TabsTrigger>
            </TabsList>

            {/* ── RESERVAS ── */}
            <TabsContent value="reservas" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" /></div>
              ) : reservas.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Sin reservas aún</h3>
                  <p className="text-gray-500 text-sm mb-6">Explora hospedajes, restaurantes y actividades</p>
                  <Link to="/prestadores"><Button className="bg-[#1B5E20] hover:bg-[#145218]">Explorar servicios</Button></Link>
                </div>
              ) : (
                reservas.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-start gap-4 p-5">
                      {r.prestador_foto ? (
                        <img src={r.prestador_foto} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">🏢</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link to={`/prestador/${r.prestador_id}`} className="font-bold text-gray-900 hover:underline">
                              {r.prestador_nombre || "Prestador"}
                            </Link>
                            {r.servicio_nombre && <p className="text-xs text-gray-500 mt-0.5">🛏 {r.servicio_nombre}</p>}
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize flex-shrink-0 ${ESTADO_COLORS[r.estado] || "bg-gray-100 text-gray-600"}`}>
                            {r.estado}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{r.fecha_reserva || r.fecha_entrada}</span>
                          {r.fecha_salida && r.fecha_salida !== r.fecha_reserva && (
                            <span>→ {r.fecha_salida}</span>
                          )}
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{r.num_personas} persona{r.num_personas !== 1 ? "s" : ""}</span>
                        </div>
                        {r.nota_turista && (
                          <p className="text-xs text-gray-400 mt-1.5 italic">"{r.nota_turista}"</p>
                        )}
                      </div>
                    </div>
                    {r.estado === "pendiente" && (
                      <div className="px-5 pb-4">
                        <button onClick={() => cancelarReserva(r.id)}
                          className="w-full py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors">
                          Cancelar reserva
                        </button>
                      </div>
                    )}
                    {r.estado === "aceptada" && r.prestador_whatsapp && (
                      <div className="px-5 pb-4">
                        <a href={`https://wa.me/${r.prestador_whatsapp.replace(/\D/g,"")}?text=Hola, tengo una reserva confirmada para el ${r.fecha_reserva}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors">
                          Contactar por WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            {/* ── FAVORITOS ── */}
            <TabsContent value="favoritos">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" /></div>
              ) : favoritos.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Sin favoritos aún</h3>
                  <p className="text-gray-500 text-sm mb-6">Guarda municipios, eventos y prestadores que te interesen</p>
                  <Link to="/explorar"><Button className="bg-[#1B5E20] hover:bg-[#145218]">Explorar Veracruz</Button></Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { tipo: "municipio", label: "Municipios", icon: MapPin, color: "text-[#1B5E20]", link: (f) => `/municipio/${f.slug || f.referencia_id}` },
                    { tipo: "evento",    label: "Eventos",    icon: Calendar, color: "text-blue-600", link: (f) => `/evento/${f.referencia_id}` },
                    { tipo: "prestador", label: "Prestadores",icon: Users,    color: "text-amber-600", link: (f) => `/prestador/${f.referencia_id}` },
                  ].map(({ tipo, label, icon: Icon, color, link }) => {
                    const items = favoritos.filter(f => f.tipo === tipo);
                    if (items.length === 0) return null;
                    return (
                      <div key={tipo} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className={`font-bold text-gray-900 mb-3 flex items-center gap-2`}>
                          <Icon className={`w-4 h-4 ${color}`} /> {label} ({items.length})
                        </h3>
                        <div className="space-y-2">
                          {items.map(fav => (
                            <div key={fav.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                              <Link to={link(fav)} className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{fav.nombre || fav.referencia_id}</p>
                                {fav.descripcion && <p className="text-xs text-gray-400 truncate">{fav.descripcion}</p>}
                              </Link>
                              <button onClick={() => handleRemoveFavorito(fav.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0 ml-2">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── RESEÑAS ── */}
            <TabsContent value="resenas">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" /></div>
              ) : resenas.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                  <Star className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Sin reseñas escritas</h3>
                  <p className="text-gray-500 text-sm">Visita un negocio y comparte tu experiencia</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resenas.map(r => (
                    <div key={r.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Link to={`/prestador/${r.prestador_id}`}
                            className="font-bold text-gray-900 hover:underline text-sm">{r.prestador_nombre || "Prestador"}</Link>
                          <div className="flex items-center gap-1 mt-1">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= r.calificacion ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} />
                            ))}
                            <span className="text-xs text-gray-400 ml-1">{r.fecha?.slice(0,10)}</span>
                          </div>
                          {r.texto && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.texto}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── MI CUENTA ── */}
            <TabsContent value="cuenta">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Información personal</h3>
                  {!editando ? (
                    <button onClick={() => setEditando(true)}
                      className="flex items-center gap-1.5 text-xs text-[#1B5E20] font-semibold hover:underline">
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditando(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                      <button onClick={handleSavePerfil} disabled={saving}
                        className="flex items-center gap-1 text-xs text-white bg-[#1B5E20] px-3 py-1.5 rounded-lg hover:bg-[#145218] disabled:opacity-50">
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Guardar
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Nombre",         key: "nombre",    value: user?.nombre,   editable: true },
                    { label: "Email",          key: "email",     value: user?.email,    editable: false },
                    { label: "Teléfono",       key: "telefono",  value: user?.telefono, editable: true },
                    { label: "Tipo de cuenta", key: "rol",       value: user?.rol,      editable: false },
                    { label: "Miembro desde",  key: "fecha",     value: user?.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString("es-MX") : "N/A", editable: false },
                  ].map(({ label, key, value, editable }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-400 font-medium">{label}</span>
                      {editando && editable ? (
                        <Input value={perfil[key] || ""} onChange={e => setPerfil(p => ({ ...p, [key]: e.target.value }))}
                          className="max-w-[200px] h-8 text-sm" />
                      ) : (
                        <span className="text-sm font-semibold text-gray-800 capitalize">{value || "—"}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={logout}>
                    Cerrar sesión
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PerfilPage;