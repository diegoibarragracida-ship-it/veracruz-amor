import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { 
  LayoutDashboard, MapPin, Users, Calendar, AlertTriangle, ShieldAlert, 
  Settings, LogOut, Menu, X, Plus, Check, XCircle, Eye, ChevronRight,
  Loader2, UserPlus, Bell, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/analytics", label: "Analíticas", icon: BarChart3 },
    { path: "/admin/municipios", label: "Municipios", icon: MapPin },
    { path: "/admin/prestadores", label: "Prestadores", icon: Users },
    { path: "/admin/eventos", label: "Eventos", icon: Calendar },
    { path: "/admin/alertas", label: "Alertas", icon: AlertTriangle },
    { path: "/admin/emergencias", label: "Emergencias", icon: ShieldAlert },
    { path: "/admin/usuarios", label: "Usuarios", icon: UserPlus },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1B5E20] transform transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#1B5E20]" />
            </div>
            <span className="font-bold text-white text-sm">Veracruz Contigo</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}>
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">{user?.nombre?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{user?.nombre}</p>
              <p className="text-white/60 text-xs truncate">Super Admin</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 h-16 bg-white border-b flex items-center justify-between px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Panel de Administración</h1>
          <Link to="/" className="text-sm text-[#0277BD] hover:underline">Ver sitio público →</Link>
        </header>
        <main className="p-6">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="analytics" element={<AnalyticsDashboard isGlobal={true} />} />
            <Route path="municipios" element={<MunicipiosAdmin />} />
            <Route path="prestadores" element={<PrestadoresAdmin />} />
            <Route path="eventos" element={<EventosAdmin />} />
            <Route path="alertas" element={<AlertasAdmin />} />
            <Route path="emergencias" element={<EmergenciasAdmin />} />
            <Route path="usuarios" element={<UsuariosAdmin />} />
          </Routes>
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/admin/stats`)
      .then(r => setStats(r.data))
      .catch(e => console.error("Error fetching stats:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" /></div>;

  const statCards = [
    { label: "Municipios Publicados", value: stats?.municipios?.publicados || 0, total: stats?.municipios?.total || 232, icon: MapPin, color: "bg-green-500" },
    { label: "Prestadores Verificados", value: stats?.prestadores_verificados || 0, icon: Users, color: "bg-blue-500" },
    { label: "Turistas Registrados", value: stats?.turistas_total || 0, icon: Users, color: "bg-purple-500" },
    { label: "Emergencias Activas", value: stats?.emergencias?.activas || 0, icon: ShieldAlert, color: "bg-red-500" },
    { label: "Eventos Próximos", value: stats?.eventos_proximos || 0, icon: Calendar, color: "bg-orange-500" },
    { label: "Solicitudes Pendientes", value: stats?.solicitudes_pendientes || 0, icon: Bell, color: "bg-yellow-500" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {stat.total && <span className="text-sm text-gray-500">de {stat.total}</span>}
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/usuarios"><Button className="bg-[#1B5E20] hover:bg-[#145218]"><UserPlus className="w-4 h-4 mr-2" />Crear Encargado</Button></Link>
          <Link to="/admin/alertas"><Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50"><AlertTriangle className="w-4 h-4 mr-2" />Nueva Alerta</Button></Link>
          <Link to="/admin/prestadores"><Button variant="outline"><Check className="w-4 h-4 mr-2" />Revisar Solicitudes</Button></Link>
        </div>
      </div>
    </div>
  );
};

const MunicipiosAdmin = () => {
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const params = filter !== "all" ? { estado: filter, limit: 300 } : { limit: 300 };
    axios.get(`${API}/municipios`, { params })
      .then(r => setMunicipios(r.data.municipios || []))
      .catch(e => console.error("Error:", e))
      .finally(() => setLoading(false));
  }, [filter]);

  const estadoColors = { publicado: "bg-green-100 text-green-800", borrador: "bg-yellow-100 text-yellow-800", sin_configurar: "bg-gray-100 text-gray-800" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Municipios</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="publicado">Publicados</SelectItem>
            <SelectItem value="borrador">Borradores</SelectItem>
            <SelectItem value="sin_configurar">Sin configurar</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Municipio</TableHead><TableHead>Región</TableHead>
              <TableHead>Estado</TableHead><TableHead>Encargado</TableHead><TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : municipios.slice(0, 50).map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.nombre}{m.pueblo_magico && <Badge className="ml-2 bg-[#F9A825]">Pueblo Mágico</Badge>}</TableCell>
                <TableCell>{m.region}</TableCell>
                <TableCell><Badge className={estadoColors[m.estado] || estadoColors.sin_configurar}>{m.estado.replace("_", " ")}</Badge></TableCell>
                <TableCell>{m.encargado_id ? <span className="text-green-600">Asignado</span> : <span className="text-gray-400">Sin asignar</span>}</TableCell>
                <TableCell><Link to={`/municipio/${m.slug}`} target="_blank"><Button variant="ghost" size="sm"><Eye className="w-4 h-4 mr-1" />Ver</Button></Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const PrestadoresAdmin = () => {
  const [registros, setRegistros] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("registros");
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  const [approvedCredentials, setApprovedCredentials] = useState(null);

  const fetchData = async () => {
    try {
      const [regRes, prestRes] = await Promise.all([
        axios.get(`${API}/admin/registros-prestadores`, { params: { estado: "pendiente" } }),
        axios.get(`${API}/prestadores`, { params: { limit: 100 } }),
      ]);
      setRegistros(Array.isArray(regRes.data) ? regRes.data : regRes.data.registros || []);
      setPrestadores(prestRes.data.prestadores || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAprobar = async (registroId) => {
    try {
      const res = await axios.put(`${API}/admin/registros-prestadores/${registroId}`, {
        estado: "aprobado", comentario: "Aprobado por Super Admin"
      });
      setRegistros(registros.filter(r => r.id !== registroId));
      setSelectedRegistro(null);
      if (res.data.credentials) setApprovedCredentials(res.data.credentials);
      toast.success("Prestador aprobado. Cuenta creada.");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al aprobar");
    }
  };

  const handleRechazar = async (registroId) => {
    try {
      await axios.put(`${API}/admin/registros-prestadores/${registroId}`, {
        estado: "rechazado", comentario: "Rechazado por Super Admin"
      });
      setRegistros(registros.filter(r => r.id !== registroId));
      setSelectedRegistro(null);
      toast.success("Solicitud rechazada");
    } catch (error) {
      toast.error("Error al rechazar");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Prestadores de Servicios</h2>

      <div className="flex gap-2 flex-wrap">
        <Button variant={tab === "registros" ? "default" : "outline"} onClick={() => setTab("registros")} className={tab === "registros" ? "bg-[#1B5E20]" : ""} data-testid="tab-registros">
          Registros Nuevos ({registros.length})
        </Button>
        <Button variant={tab === "verificados" ? "default" : "outline"} onClick={() => setTab("verificados")} className={tab === "verificados" ? "bg-[#1B5E20]" : ""}>
          Verificados ({prestadores.filter(p => p.verificado).length})
        </Button>
      </div>

      {approvedCredentials && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4" data-testid="credentials-banner">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-green-800 mb-1">Credenciales generadas</p>
              <p className="text-sm text-green-700">Email: <span className="font-mono">{approvedCredentials.email}</span></p>
              <p className="text-sm text-green-700">Contraseña: <span className="font-mono">{approvedCredentials.password}</span></p>
              <p className="text-xs text-green-600 mt-1">Comparte estas credenciales con el prestador</p>
            </div>
            <button onClick={() => setApprovedCredentials(null)} className="text-green-400 hover:text-green-600"><X className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {tab === "registros" && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : registros.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No hay registros de prestadores pendientes</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead><TableHead>Tipo</TableHead>
                  <TableHead>Contacto</TableHead><TableHead>Municipio</TableHead>
                  <TableHead>Docs</TableHead><TableHead>Fecha</TableHead><TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nombre_negocio || r.nombre}</TableCell>
                    <TableCell><Badge className="bg-blue-100 text-blue-800">{r.tipo}</Badge></TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{r.nombre_contacto || r.responsable}</p>
                        <p className="text-gray-500">{r.email_contacto || r.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{r.municipio_nombre}</TableCell>
                    <TableCell><Badge className="bg-gray-100 text-gray-800">{r.documentos?.length || 0}</Badge></TableCell>
                    <TableCell>{new Date(r.fecha_registro || r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedRegistro(r)} data-testid={`view-registro-${r.id}`}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAprobar(r.id)} data-testid={`approve-registro-${r.id}`}><Check className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRechazar(r.id)}><XCircle className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {tab === "verificados" && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead><TableHead>Tipo</TableHead>
                <TableHead>Calificación</TableHead><TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prestadores.filter(p => p.verificado).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>{p.tipo}</TableCell>
                  <TableCell>⭐ {p.calificacion_promedio}</TableCell>
                  <TableCell><Badge className="bg-green-100 text-green-800">Verificado</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ✅ CORREGIDO: aria-describedby={undefined} para suprimir warning de accesibilidad */}
      <Dialog open={!!selectedRegistro} onOpenChange={() => setSelectedRegistro(null)}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Solicitud: {selectedRegistro?.nombre_negocio || selectedRegistro?.nombre}</DialogTitle>
          </DialogHeader>
          {selectedRegistro && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Tipo</p><p className="font-medium">{selectedRegistro.tipo}{selectedRegistro.subtipo ? ` - ${selectedRegistro.subtipo}` : ""}</p></div>
                <div><p className="text-gray-500">Municipio</p><p className="font-medium">{selectedRegistro.municipio_nombre}</p></div>
                <div><p className="text-gray-500">Responsable</p><p className="font-medium">{selectedRegistro.nombre_contacto || selectedRegistro.responsable}</p></div>
                <div><p className="text-gray-500">Email</p><p className="font-medium">{selectedRegistro.email_contacto || selectedRegistro.email}</p></div>
                <div><p className="text-gray-500">Teléfono</p><p className="font-medium">{selectedRegistro.telefono || "N/A"}</p></div>
                <div><p className="text-gray-500">WhatsApp</p><p className="font-medium">{selectedRegistro.whatsapp || "N/A"}</p></div>
              </div>
              {selectedRegistro.descripcion && (
                <div><p className="text-gray-500 text-sm">Descripción</p><p className="text-sm">{selectedRegistro.descripcion}</p></div>
              )}
              {selectedRegistro.documentos?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Documentos ({selectedRegistro.documentos.length})</p>
                  <div className="space-y-2">
                    {selectedRegistro.documentos.map((docUrl, i) => (
                      <a key={i} href={docUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#0277BD] hover:underline bg-blue-50 p-2 rounded">
                        <Eye className="w-4 h-4" />
                        Ver documento {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRegistro(null)}>Cerrar</Button>
            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleRechazar(selectedRegistro?.id)}>
              <XCircle className="w-4 h-4 mr-1" /> Rechazar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAprobar(selectedRegistro?.id)}>
              <Check className="w-4 h-4 mr-1" /> Aprobar y crear cuenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EventosAdmin = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/eventos`, { params: { limit: 100 } })
      .then(r => setEventos(r.data.eventos || []))
      .catch(e => console.error("Error:", e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Eventos</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Evento</TableHead><TableHead>Tipo</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : eventos.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.nombre}</TableCell>
                <TableCell>{e.tipo}</TableCell>
                <TableCell>{e.fecha_inicio}</TableCell>
                <TableCell><Badge className={e.publicado ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{e.publicado ? "Publicado" : "Borrador"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const AlertasAdmin = () => {
  const [alertas, setAlertas] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [newAlerta, setNewAlerta] = useState({ titulo: "", descripcion: "", tipo: "seguridad" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/alertas`)
      .then(r => setAlertas(r.data || []))
      .catch(e => console.error("Error:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateAlerta = async () => {
    try {
      const response = await axios.post(`${API}/alertas`, newAlerta);
      setAlertas([response.data, ...alertas]);
      setShowDialog(false);
      setNewAlerta({ titulo: "", descripcion: "", tipo: "seguridad" });
      toast.success("Alerta creada");
    } catch (error) {
      toast.error("Error al crear alerta");
    }
  };

  const tipoColors = { meteorológica: "bg-blue-100 text-blue-800", seguridad: "bg-red-100 text-red-800", vial: "bg-orange-100 text-orange-800", salud: "bg-purple-100 text-purple-800" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Alertas</h2>
        <Button onClick={() => setShowDialog(true)} className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-2" />Nueva Alerta</Button>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {alertas.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No hay alertas activas</div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead></TableRow></TableHeader>
            <TableBody>
              {alertas.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.titulo}</TableCell>
                  <TableCell><Badge className={tipoColors[a.tipo?.toLowerCase()] || "bg-gray-100"}>{a.tipo}</Badge></TableCell>
                  <TableCell><Badge className={a.activa ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}>{a.activa ? "Activa" : "Inactiva"}</Badge></TableCell>
                  <TableCell>{new Date(a.fecha_inicio).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ✅ CORREGIDO: aria-describedby={undefined} para suprimir warning de accesibilidad */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Nueva Alerta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={newAlerta.titulo} onChange={(e) => setNewAlerta({ ...newAlerta, titulo: e.target.value })} placeholder="Título de la alerta" /></div>
            <div><Label>Descripción</Label><Textarea value={newAlerta.descripcion} onChange={(e) => setNewAlerta({ ...newAlerta, descripcion: e.target.value })} placeholder="Descripción detallada" /></div>
            <div>
              <Label>Tipo</Label>
              <Select modal={false} value={newAlerta.tipo} onValueChange={(v) => setNewAlerta({ ...newAlerta, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meteorológica">Meteorológica</SelectItem>
                  <SelectItem value="seguridad">Seguridad</SelectItem>
                  <SelectItem value="vial">Vial</SelectItem>
                  <SelectItem value="salud">Salud</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateAlerta} className="bg-red-600 hover:bg-red-700">Crear Alerta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EmergenciasAdmin = () => {
  const [emergencias, setEmergencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/emergencias`)
      .then(r => setEmergencias(r.data || []))
      .catch(e => console.error("Error:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleResolver = async (id) => {
    try {
      await axios.put(`${API}/emergencias/${id}/resolver`, { notas: "Resuelta por admin" });
      setEmergencias(emergencias.map(e => e.id === id ? { ...e, estado: "resuelta" } : e));
      toast.success("Emergencia marcada como resuelta");
    } catch (error) {
      toast.error("Error al resolver");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Emergencias</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {emergencias.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No hay emergencias registradas</div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Turista</TableHead><TableHead>Ubicación</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {emergencias.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nombre_turista}</TableCell>
                  <TableCell><a href={`https://maps.google.com/?q=${e.lat},${e.lng}`} target="_blank" rel="noopener noreferrer" className="text-[#0277BD] hover:underline">Ver en mapa</a></TableCell>
                  <TableCell>{new Date(e.timestamp).toLocaleString()}</TableCell>
                  <TableCell><Badge className={e.estado === "activa" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>{e.estado}</Badge></TableCell>
                  <TableCell>{e.estado === "activa" && <Button size="sm" onClick={() => handleResolver(e.id)}>Resolver</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

// ✅ CORREGIDO: Formulario separado en su propio componente para aislar re-renders.
// Esto evita el error removeChild de Radix UI + React 18 cuando un Select dentro
// de un Dialog actualiza el estado y ambos intentan modificar el DOM al mismo tiempo.
const CreateUserDialogForm = ({ municipios, onUserCreated, onClose }) => {
  const [newUser, setNewUser] = useState({ email: "", nombre: "", rol: "encargado", municipio_id: "" });
  const [createdPassword, setCreatedPassword] = useState("");

  const handleCreateUser = async () => {
    try {
      const response = await axios.post(`${API}/admin/usuarios`, newUser);
      setCreatedPassword(response.data.password);
      onUserCreated(response.data);
      toast.success("Usuario creado");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear usuario");
    }
  };

  const handleClose = () => {
    setNewUser({ email: "", nombre: "", rol: "encargado", municipio_id: "" });
    setCreatedPassword("");
    onClose();
  };

  return (
    <>
      <DialogHeader><DialogTitle>Crear Usuario</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div><Label>Nombre completo</Label><Input value={newUser.nombre} onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })} placeholder="Nombre del usuario" /></div>
        <div><Label>Email</Label><Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@ejemplo.com" /></div>
        <div>
          <Label>Rol</Label>
          <Select modal={false} value={newUser.rol} onValueChange={(v) => setNewUser((prev) => ({ ...prev, rol: v, municipio_id: "" }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="encargado">Encargado Municipal</SelectItem>
              <SelectItem value="prestador">Prestador de Servicios</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div style={{ display: newUser.rol === "encargado" ? "block" : "none" }}>
          <Label>Municipio</Label>
          <Select modal={false} value={newUser.municipio_id} onValueChange={(v) => setNewUser((prev) => ({ ...prev, municipio_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Seleccionar municipio" /></SelectTrigger>
            <SelectContent>
              {municipios.filter(m => !m.encargado_id).map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {createdPassword && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800 font-medium">Usuario creado exitosamente</p>
            <p className="text-sm text-green-700 mt-1">Contraseña: <span className="font-mono">{createdPassword}</span></p>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>{createdPassword ? "Cerrar" : "Cancelar"}</Button>
        {!createdPassword && <Button onClick={handleCreateUser} className="bg-[#1B5E20] hover:bg-[#145218]">Crear Usuario</Button>}
      </DialogFooter>
    </>
  );
};

const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/admin/usuarios`),
      axios.get(`${API}/municipios`, { params: { limit: 300 } }),
    ]).then(([usersRes, munRes]) => {
      setUsuarios(usersRes.data || []);
      setMunicipios(munRes.data.municipios || []);
    }).catch(e => console.error("Error:", e))
      .finally(() => setLoading(false));
  }, []);

  const rolColors = { superadmin: "bg-purple-100 text-purple-800", encargado: "bg-blue-100 text-blue-800", prestador: "bg-orange-100 text-orange-800", turista: "bg-green-100 text-green-800" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
        <Button onClick={() => setShowDialog(true)} className="bg-[#1B5E20] hover:bg-[#145218]"><UserPlus className="w-4 h-4 mr-2" />Crear Usuario</Button>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : usuarios.map((u) => (
              <TableRow key={u.user_id}>
                <TableCell className="font-medium">{u.nombre}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Badge className={rolColors[u.rol] || "bg-gray-100"}>{u.rol}</Badge></TableCell>
                <TableCell><Badge className={u.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{u.activo ? "Activo" : "Inactivo"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent aria-describedby={undefined}>
          {showDialog && (
            <CreateUserDialogForm
              municipios={municipios}
              onUserCreated={(newUserData) => setUsuarios((prev) => [newUserData, ...prev])}
              onClose={() => setShowDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;