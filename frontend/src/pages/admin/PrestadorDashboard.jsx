import { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck, Camera, Plus, Trash2, Edit3, Save,
  Clock, Users, Star, Calendar,
  CheckCircle, XCircle, AlertCircle, Phone,
  Utensils, Car, Loader2, Image, TrendingUp, Eye,
  MessageCircle, Package, MapPin, Navigation, ToggleLeft, ToggleRight, Link
} from "lucide-react";
import { toast } from "sonner";

// ── Constantes gastronómicas ──────────────────────────────────
const TIPOS_ALIMENTOS = [
  "GASTRONOMÍA","CAFETERÍA","BAR","BEBIDAS","RESTAURANTE","FOOD_TRUCK","PUESTO"
];

const CATEGORIAS_GASTRONOMICAS = [
  "Comida mexicana","Comida rápida","Parrilla y carnes","Mariscos",
  "Cocina internacional","Saludable","Cafetería y postres",
  "Bar y bebidas","Desayunos y brunch","Street food / puesto","Gourmet / alta cocina"
];

const SUBCATEGORIAS_POR_CATEGORIA = {
  "Comida mexicana": ["Taquería","Antojitos mexicanos","Comida corrida","Fonda","Cocina económica","Pozolería","Tamalería","Enchiladas / antojitos","Tlayudas","Garnachas","Cocina veracruzana","Cocina regional"],
  "Comida rápida": ["Hamburguesas","Hot dogs","Pizzería","Alitas","Boneless","Tortas","Sandwiches","Papas y snacks","Nuggets"],
  "Parrilla y carnes": ["Barbacoa","Asadero","Carnitas","Birria","Cortes finos","Parrilla argentina","Pollo asado","Rosticería"],
  "Mariscos": ["Marisquería","Ostionería","Aguachiles","Ceviches","Pescados fritos","Mariscos estilo Sinaloa"],
  "Cocina internacional": ["Italiana","Japonesa (sushi)","Japonesa (ramen)","China","Coreana","Americana","Argentina","Brasileña","Española","Francesa","Árabe","Mediterránea"],
  "Saludable": ["Vegano","Vegetariano","Orgánico","Fit","Keto","Ensaladas","Jugos / detox"],
  "Cafetería y postres": ["Cafetería","Café de especialidad","Espresso bar","Repostería","Pastelería","Heladería","Crepería","Churros","Panadería","Postres gourmet"],
  "Bar y bebidas": ["Bar","Cantina","Cervecería artesanal","Mezcalería","Pulquería","Coctelería","Bar karaoke","Coctelería clásica","Mixología moderna"],
  "Desayunos y brunch": ["Desayunos mexicanos","Desayunos americanos","Brunch","Chilaquiles","Cafetería desayuno"],
  "Street food / puesto": ["Puesto de tacos","Puesto de hamburguesas","Puesto de elotes/esquites","Food truck","Puesto ambulante","Puesto de jugos","Puesto de aguas frescas","Puesto de tepache","Puesto de micheladas"],
  "Gourmet / alta cocina": ["Cocina de autor","Fine dining","Fusión","Degustación"],
};

const ETIQUETAS_GRUPOS = [
  { grupo: "Precio", opciones: ["Económico","Precio medio","Caro","Gourmet"] },
  { grupo: "Experiencia", opciones: ["Familiar","Romántico","Para grupos","Casual","Elegante","Rápido","Experiencia premium"] },
  { grupo: "Servicio", opciones: ["Para comer ahí","Para llevar","A domicilio","Pickup","Reservación","Sin reservación"] },
  { grupo: "Ambiente", opciones: ["Nocturno","Música en vivo","DJ","Tranquilo","Fiesta","Bar","Terraza","Con vista"] },
  { grupo: "Especialidades", opciones: ["Por kilo","Buffet","A la carta","Comida corrida","Todo incluido"] },
  { grupo: "Preferencias", opciones: ["Vegano friendly","Vegetariano friendly","Sin gluten","Opciones saludables"] },
  { grupo: "Extras", opciones: ["Pet friendly","Área infantil","Estacionamiento","WiFi","Climatizado","Accesible"] },
  { grupo: "Estilo", opciones: ["Instagramable","Tradicional","Moderno","Rústico","Temático"] },
  { grupo: "Bebidas", opciones: ["Con alcohol","Sin alcohol","Cervezas artesanales","Mixología","Café de especialidad"] },
];

const MOMENTOS = ["Desayuno","Brunch","Comida","Cena","Antojos nocturnos"];
const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

const TIPOS_PRESTADOR = {
  HOSPEDAJE:    { label: "Hospedaje",    tabs: ["perfil","galeria","servicios","habitaciones","reservas","promociones","resenas","analiticas"] },
  GASTRONOMÍA:  { label: "Restaurante",  tabs: ["perfil","galeria","menu","reservas","promociones","resenas","analiticas"] },
  GASTRONOMIA:  { label: "Restaurante",  tabs: ["perfil","galeria","menu","reservas","promociones","resenas","analiticas"] },
  CAFETERÍA:    { label: "Cafetería",    tabs: ["perfil","galeria","menu","reservas","promociones","resenas","analiticas"] },
  BAR:          { label: "Bar",          tabs: ["perfil","galeria","menu","reservas","promociones","resenas","analiticas"] },
  BEBIDAS:      { label: "Bebidas",      tabs: ["perfil","galeria","menu","reservas","promociones","resenas","analiticas"] },
  RESTAURANTE:  { label: "Restaurante",  tabs: ["perfil","galeria","menu","reservas","promociones","resenas","analiticas"] },
  FOOD_TRUCK:   { label: "Food Truck",   tabs: ["perfil","galeria","menu","reservas","promociones","resenas","analiticas"] },
  PUESTO:       { label: "Puesto",       tabs: ["perfil","galeria","menu","reservas","promociones","resenas","analiticas"] },
  TURISMO:      { label: "Tour",         tabs: ["perfil","galeria","servicios","flota","reservas","promociones","resenas","analiticas"] },
  TRANSPORTE:   { label: "Transporte",   tabs: ["perfil","galeria","servicios","flota","reservas","promociones","resenas","analiticas"] },
  SERVICIOS:    { label: "Servicios",    tabs: ["perfil","galeria","servicios","reservas","promociones","resenas","analiticas"] },
  default:      { label: "Negocio",      tabs: ["perfil","galeria","servicios","reservas","promociones","resenas","analiticas"] },
};

const TAB_LABELS = {
  perfil:       "Perfil",
  galeria:      "Galería",
  servicios:    "Servicios",
  reservas:     "Reservas",
  menu:         "Menú",
  habitaciones: "Habitaciones",
  flota:        "Flota",
  promociones:  "Promociones",
  resenas:      "Reseñas",
  analiticas:   "Analíticas",
};

const esAlimentos = (tipo) => TIPOS_ALIMENTOS.includes(tipo?.toUpperCase());

// ── Componentes base ──────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
    {children}
  </div>
);

const Inp = (props) => (
  <input {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] placeholder-gray-400" />
);

const Txta = (props) => (
  <textarea {...props} rows={props.rows || 3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1B5E20] resize-none placeholder-gray-400" />
);

const Sel = ({ value, onChange, children, ...props }) => (
  <select value={value} onChange={onChange} {...props}
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1B5E20] bg-white">
    {children}
  </select>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>{children}</div>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">{children}</h3>
);

// ── Toggle abierto/cerrado ────────────────────────────────────
const ToggleAbierto = ({ estaAbierto, onChange }) => (
  <button onClick={() => onChange(!estaAbierto)}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
      estaAbierto
        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
    }`}>
    <span className={`w-2.5 h-2.5 rounded-full ${estaAbierto ? "bg-green-500" : "bg-red-500"}`} />
    {estaAbierto ? "Abierto ahora" : "Cerrado ahora"}
  </button>
);

// ── Horarios por día ──────────────────────────────────────────
const HorariosDetallados = ({ value = {}, onChange }) => {
  const toggleDia = (dia) => {
    const curr = value[dia] || { activo: false, apertura: "09:00", cierre: "21:00" };
    onChange({ ...value, [dia]: { ...curr, activo: !curr.activo } });
  };
  const setHora = (dia, campo, hora) => {
    const curr = value[dia] || { activo: true, apertura: "09:00", cierre: "21:00" };
    onChange({ ...value, [dia]: { ...curr, [campo]: hora } });
  };

  return (
    <div className="space-y-2">
      {DIAS.map(dia => {
        const info = value[dia] || { activo: false, apertura: "09:00", cierre: "21:00" };
        return (
          <div key={dia} className="flex items-center gap-3">
            <button onClick={() => toggleDia(dia)}
              className={`w-24 text-xs font-semibold px-2 py-1.5 rounded-md transition-colors ${
                info.activo ? "bg-[#1B5E20] text-white" : "bg-gray-100 text-gray-400"
              }`}>{dia.slice(0, 3)}</button>
            {info.activo ? (
              <div className="flex items-center gap-2 flex-1">
                <input type="time" value={info.apertura} onChange={e => setHora(dia, "apertura", e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1B5E20]" />
                <span className="text-gray-400 text-xs">–</span>
                <input type="time" value={info.cierre} onChange={e => setHora(dia, "cierre", e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1B5E20]" />
              </div>
            ) : (
              <span className="text-xs text-gray-400">Cerrado</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Selector de etiquetas ─────────────────────────────────────
const EtiquetasSelector = ({ value = [], onChange }) => (
  <div className="space-y-4">
    {ETIQUETAS_GRUPOS.map(({ grupo, opciones }) => (
      <div key={grupo}>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{grupo}</p>
        <div className="flex flex-wrap gap-2">
          {opciones.map(op => (
            <button key={op} type="button"
              onClick={() => onChange(value.includes(op) ? value.filter(v => v !== op) : [...value, op])}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                value.includes(op)
                  ? "bg-[#1B5E20] text-white border-[#1B5E20]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20] hover:text-[#1B5E20]"
              }`}>{op}</button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ── MÓDULO PERFIL ─────────────────────────────────────────────
const ModuloPerfil = ({ prestador, onSave, uploading, onUploadFoto, onUploadLogo }) => {
  const [form, setForm] = useState({
    nombre: prestador?.nombre || "",
    descripcion: prestador?.descripcion || "",
    descripcion_larga: prestador?.descripcion_larga || "",
    direccion: prestador?.direccion || "",
    horarios: prestador?.horarios || "",
    horarios_detallados: prestador?.horarios_detallados || {},
    telefono: prestador?.telefono || "",
    whatsapp: prestador?.whatsapp || "",
    instagram: prestador?.instagram || "",
    facebook: prestador?.facebook || "",
    tiktok: prestador?.tiktok || "",
    website: prestador?.website || "",
    lat: prestador?.lat || "",
    lng: prestador?.lng || "",
    precio_min: prestador?.precio_min || "",
    precio_max: prestador?.precio_max || "",
    esta_abierto: prestador?.esta_abierto ?? true,
    menu_url: prestador?.menu_url || "",
    categoria_gastronomica: prestador?.categoria_gastronomica || "",
    subcategoria_gastronomica: prestador?.subcategoria_gastronomica || "",
    etiquetas: prestador?.etiquetas || [],
    momentos: prestador?.momentos || [],
    reservas_mesa_activas: prestador?.reservas_mesa_activas ?? false,
    reservas_mesa_capacidad: prestador?.reservas_mesa_capacidad || "",
    reservas_mesa_notas: prestador?.reservas_mesa_notas || "",
    pedidos_whatsapp_activo: prestador?.pedidos_whatsapp_activo ?? false,
    pedidos_whatsapp_mensaje: prestador?.pedidos_whatsapp_mensaje || "",
  });
  const [saving, setSaving] = useState(false);
  const [seccion, setSeccion] = useState("info");

  const es_alimentos = esAlimentos(prestador?.tipo);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/prestadores/me/perfil`, form);
      toast.success("Perfil actualizado");
      onSave();
    } catch { toast.error("Error guardando"); }
    finally { setSaving(false); }
  };

  const secciones = [
    { id: "info", label: "Información" },
    { id: "horarios", label: "Horarios" },
    { id: "ubicacion", label: "Ubicación" },
    { id: "redes", label: "Redes" },
    ...(es_alimentos ? [{ id: "gastronomia", label: "Gastronomía" }] : []),
    { id: "operacion", label: "Operación" },
  ];

  return (
    <div className="space-y-5">
      {/* Header con foto, logo y toggle */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Presentación del negocio</SectionTitle>
          <ToggleAbierto estaAbierto={form.esta_abierto} onChange={v => setForm({ ...form, esta_abierto: v })} />
        </div>
        <div className="flex items-start gap-5 flex-wrap">
          {/* Foto principal */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              {prestador?.foto_url
                ? <img src={prestador.foto_url} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-3xl bg-green-50">🏪</div>}
            </div>
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-[#1B5E20] text-white rounded-lg text-xs font-medium hover:bg-[#145218]">
              {uploading === "foto" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              {uploading === "foto" ? "Subiendo..." : "Foto"}
              <input type="file" accept="image/*" className="hidden" onChange={e => onUploadFoto(e.target.files[0])} />
            </label>
            <span className="text-[10px] text-gray-400">Foto principal</span>
          </div>
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
              {prestador?.logo_url
                ? <img src={prestador.logo_url} className="w-full h-full object-contain p-2" alt="Logo" />
                : <span className="text-3xl">🖼️</span>}
            </div>
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-800">
              {uploading === "logo" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Image className="w-3 h-3" />}
              {uploading === "logo" ? "Subiendo..." : "Logo"}
              <input type="file" accept="image/*" className="hidden" onChange={e => onUploadLogo(e.target.files[0])} />
            </label>
            <span className="text-[10px] text-gray-400">Logo del negocio</span>
          </div>
        </div>
      </Card>

      {/* Sub-tabs de sección */}
      <div className="flex gap-1 flex-wrap bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
        {secciones.map(s => (
          <button key={s.id} onClick={() => setSeccion(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              seccion === s.id ? "bg-[#1B5E20] text-white" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}>{s.label}</button>
        ))}
      </div>

      {/* Sección: Información básica */}
      {seccion === "info" && (
        <Card>
          <SectionTitle>Información del negocio</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre del negocio">
              <Inp value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </Field>
            <Field label="Teléfono">
              <Inp value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="272 000 0000" />
            </Field>
            <Field label="WhatsApp">
              <Inp value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="52272 000 0000" />
            </Field>
            <Field label="Dirección">
              <Inp value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descripción corta">
                <Txta value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Describe tu negocio en 2-3 oraciones..." />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Historia / Descripción larga">
                <Txta rows={5} value={form.descripcion_larga} onChange={e => setForm({ ...form, descripcion_larga: e.target.value })}
                  placeholder="Cuenta la historia de tu negocio..." />
              </Field>
            </div>
            {/* Precio por persona */}
            <Field label="Precio mínimo por persona (MXN)">
              <Inp type="number" value={form.precio_min} onChange={e => setForm({ ...form, precio_min: e.target.value })} placeholder="100" />
            </Field>
            <Field label="Precio máximo por persona (MXN)">
              <Inp type="number" value={form.precio_max} onChange={e => setForm({ ...form, precio_max: e.target.value })} placeholder="500" />
            </Field>
          </div>
        </Card>
      )}

      {/* Sección: Horarios */}
      {seccion === "horarios" && (
        <Card>
          <SectionTitle>Horarios de atención</SectionTitle>
          <div className="mb-4">
            <Field label="Horario general (texto)">
              <Inp value={form.horarios} onChange={e => setForm({ ...form, horarios: e.target.value })} placeholder="Lun–Dom 8:00–22:00" />
            </Field>
          </div>
          <SectionTitle>Horario detallado por día</SectionTitle>
          <HorariosDetallados value={form.horarios_detallados} onChange={v => setForm({ ...form, horarios_detallados: v })} />

          {/* Momentos ideales */}
          <div className="mt-5">
            <SectionTitle>Momentos ideales</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {MOMENTOS.map(m => (
                <button key={m} type="button"
                  onClick={() => {
                    const curr = form.momentos || [];
                    setForm({ ...form, momentos: curr.includes(m) ? curr.filter(x => x !== m) : [...curr, m] });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    (form.momentos || []).includes(m)
                      ? "bg-[#1B5E20] text-white border-[#1B5E20]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]"
                  }`}>{m}</button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Sección: Ubicación */}
      {seccion === "ubicacion" && (
        <Card>
          <SectionTitle>Ubicación en mapa</SectionTitle>
          <p className="text-xs text-gray-500 mb-4">Ingresa las coordenadas de tu negocio para aparecer en el mapa de prestadores.</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Latitud">
              <Inp type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="19.18" />
            </Field>
            <Field label="Longitud">
              <Inp type="number" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} placeholder="-96.14" />
            </Field>
          </div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${form.lat},${form.lng}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#0277BD] hover:underline">
            <Navigation className="w-4 h-4" /> Verificar ubicación en Google Maps
          </a>
        </Card>
      )}

      {/* Sección: Redes sociales */}
      {seccion === "redes" && (
        <Card>
          <SectionTitle>Redes sociales y web</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "instagram", label: "Instagram", ph: "@tunegocio" },
              { key: "facebook", label: "Facebook", ph: "facebook.com/tunegocio" },
              { key: "tiktok", label: "TikTok", ph: "@tunegocio" },
              { key: "website", label: "Sitio web", ph: "www.tunegocio.com" },
            ].map(({ key, label, ph }) => (
              <Field key={key} label={label}>
                <Inp value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} />
              </Field>
            ))}
          </div>
        </Card>
      )}

      {/* Sección: Gastronomía (solo alimentos) */}
      {seccion === "gastronomia" && es_alimentos && (
        <div className="space-y-5">
          <Card>
            <SectionTitle>Categoría gastronómica</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field label="Categoría principal">
                <Sel value={form.categoria_gastronomica}
                  onChange={e => setForm({ ...form, categoria_gastronomica: e.target.value, subcategoria_gastronomica: "" })}>
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIAS_GASTRONOMICAS.map(c => <option key={c} value={c}>{c}</option>)}
                </Sel>
              </Field>
              <Field label="Subcategoría">
                <Sel value={form.subcategoria_gastronomica}
                  onChange={e => setForm({ ...form, subcategoria_gastronomica: e.target.value })}
                  disabled={!form.categoria_gastronomica}>
                  <option value="">Selecciona subcategoría</option>
                  {(SUBCATEGORIAS_POR_CATEGORIA[form.categoria_gastronomica] || []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Sel>
              </Field>
            </div>

            {/* Menú digital */}
            <SectionTitle>Menú digital (opcional)</SectionTitle>
            <Field label="URL de menú digital / PDF / QR">
              <div className="flex gap-2">
                <Inp value={form.menu_url} onChange={e => setForm({ ...form, menu_url: e.target.value })} placeholder="https://mi-menu.com o enlace a PDF" />
                {form.menu_url && (
                  <a href={form.menu_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 whitespace-nowrap">
                    <Link className="w-3 h-3" /> Ver
                  </a>
                )}
              </div>
            </Field>
          </Card>

          <Card>
            <SectionTitle>Etiquetas del negocio</SectionTitle>
            <p className="text-xs text-gray-500 mb-4">Selecciona todas las que apliquen — ayudan a los turistas a encontrarte más fácil.</p>
            <EtiquetasSelector value={form.etiquetas} onChange={v => setForm({ ...form, etiquetas: v })} />
          </Card>
        </div>
      )}

      {/* Sección: Operación */}
      {seccion === "operacion" && (
        <div className="space-y-5">
          {/* Reservas de mesa */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Reservas de mesa</SectionTitle>
              <button onClick={() => setForm({ ...form, reservas_mesa_activas: !form.reservas_mesa_activas })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  form.reservas_mesa_activas
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}>
                {form.reservas_mesa_activas ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {form.reservas_mesa_activas ? "Activadas" : "Desactivadas"}
              </button>
            </div>
            {form.reservas_mesa_activas && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Capacidad máxima (personas)">
                  <Inp type="number" value={form.reservas_mesa_capacidad}
                    onChange={e => setForm({ ...form, reservas_mesa_capacidad: e.target.value })} placeholder="50" />
                </Field>
                <Field label="Notas para el cliente">
                  <Inp value={form.reservas_mesa_notas}
                    onChange={e => setForm({ ...form, reservas_mesa_notas: e.target.value })} placeholder="Mínimo 2 personas, confirma 1h antes" />
                </Field>
              </div>
            )}
          </Card>

          {/* Pedidos por WhatsApp */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Pedidos por WhatsApp</SectionTitle>
              <button onClick={() => setForm({ ...form, pedidos_whatsapp_activo: !form.pedidos_whatsapp_activo })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  form.pedidos_whatsapp_activo
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}>
                {form.pedidos_whatsapp_activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {form.pedidos_whatsapp_activo ? "Activado" : "Desactivado"}
              </button>
            </div>
            {form.pedidos_whatsapp_activo && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">El cliente verá un botón para hacer su pedido directamente por WhatsApp al número registrado ({form.whatsapp || "configura tu WhatsApp en Información"}).</p>
                <Field label="Mensaje predefinido (opcional)">
                  <Txta value={form.pedidos_whatsapp_mensaje}
                    onChange={e => setForm({ ...form, pedidos_whatsapp_mensaje: e.target.value })}
                    placeholder="Hola, quisiera hacer un pedido..." />
                </Field>
              </div>
            )}
          </Card>
        </div>
      )}

      <button onClick={save} disabled={saving}
        className="w-full py-3 rounded-xl bg-[#1B5E20] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#145218] transition-colors disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar cambios
      </button>
    </div>
  );
};

// ── MÓDULO GALERÍA ────────────────────────────────────────────
const ModuloGaleria = ({ prestadorId }) => {
  const [imagenes, setImagenes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [categoria, setCategoria] = useState("general");
  const CATEGORIAS = ["general", "habitaciones", "comida", "tours", "vehiculos", "instalaciones"];

  useEffect(() => { fetchImagenes(); }, [prestadorId]);

  const fetchImagenes = async () => {
    const { data } = await axios.get(`${API}/prestadores/${prestadorId}/imagenes`);
    setImagenes(data.imagenes || []);
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data: up } = await axios.post(`${API}/upload`, fd);
      await axios.post(`${API}/prestadores/${prestadorId}/imagenes`, { url: up.url, categoria });
      toast.success("Imagen agregada"); fetchImagenes();
    } catch { toast.error("Error subiendo imagen"); }
    finally { setUploading(false); }
  };

  const setPortada = async (id) => {
    await axios.put(`${API}/prestadores/imagenes/${id}/portada`);
    toast.success("Portada actualizada"); fetchImagenes();
  };

  const deleteImg = async (id) => {
    await axios.delete(`${API}/prestadores/imagenes/${id}`);
    setImagenes(prev => prev.filter(i => i.id !== id));
  };

  const filtered = categoria === "general" ? imagenes : imagenes.filter(i => i.categoria === categoria);

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Subir imagen</SectionTitle>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Sel value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: "auto" }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {CATEGORIAS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </Sel>
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-semibold hover:bg-[#145218]">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {uploading ? "Subiendo..." : "Subir imagen"}
            <input type="file" accept="image/*" className="hidden" onChange={e => upload(e.target.files[0])} disabled={uploading} />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {["general", ...CATEGORIAS.slice(1)].map(c => (
            <button key={c} onClick={() => setCategoria(c)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${
                categoria === c ? "bg-[#1B5E20] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>{c} ({c === "general" ? imagenes.length : imagenes.filter(i => i.categoria === c).length})</button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(img => (
          <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            {img.es_portada && <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 bg-amber-400 text-amber-900 rounded-full">Portada</span>}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              {!img.es_portada && <button onClick={() => setPortada(img.id)} className="text-xs bg-amber-400 text-amber-900 px-3 py-1.5 rounded-lg font-semibold">Portada</button>}
              <button onClick={() => deleteImg(img.id)} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold">Eliminar</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-4 text-center py-16 text-gray-400">
            <Image className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No hay imágenes en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── MÓDULO MENÚ ───────────────────────────────────────────────
const ModuloMenu = ({ prestadorId, menuUrl }) => {
  const [categorias, setCategorias] = useState([]);
  const [newCat, setNewCat] = useState("");
  const [newItem, setNewItem] = useState({ nombre: "", descripcion: "", precio: "", disponible: true });
  const [showItemForm, setShowItemForm] = useState(null);

  useEffect(() => { fetchMenu(); }, [prestadorId]);

  const fetchMenu = async () => {
    const { data } = await axios.get(`${API}/prestadores/${prestadorId}/menu`);
    setCategorias(data.categorias || []);
  };

  const addCat = async () => {
    if (!newCat.trim()) return;
    await axios.post(`${API}/prestadores/${prestadorId}/menu/categorias`, { nombre: newCat, orden: categorias.length });
    setNewCat(""); fetchMenu();
  };

  const addItem = async (catId) => {
    if (!newItem.nombre || !newItem.precio) return toast.error("Nombre y precio requeridos");
    await axios.post(`${API}/menu/items`, { ...newItem, categoria_id: catId, precio: parseFloat(newItem.precio) });
    setNewItem({ nombre: "", descripcion: "", precio: "", disponible: true });
    setShowItemForm(null); fetchMenu(); toast.success("Platillo agregado");
  };

  return (
    <div className="space-y-5">
      {menuUrl && (
        <Card>
          <div className="flex items-center gap-3">
            <Link className="w-5 h-5 text-[#0277BD]" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Menú digital externo</p>
              <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0277BD] hover:underline">{menuUrl}</a>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Nueva categoría</SectionTitle>
        <div className="flex gap-3">
          <Inp value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Ej: Desayunos, Bebidas, Postres" />
          <button onClick={addCat} className="px-4 py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-semibold whitespace-nowrap hover:bg-[#145218]">
            + Agregar
          </button>
        </div>
      </Card>

      {categorias.map(cat => (
        <Card key={cat.id}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">{cat.nombre}</h4>
            <div className="flex gap-2">
              <button onClick={() => setShowItemForm(showItemForm === cat.id ? null : cat.id)}
                className="text-xs px-3 py-1.5 bg-[#1B5E20] text-white rounded-lg font-medium hover:bg-[#145218]">+ Platillo</button>
              <button onClick={async () => { await axios.delete(`${API}/menu/categorias/${cat.id}`); fetchMenu(); }}
                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Eliminar</button>
            </div>
          </div>

          {showItemForm === cat.id && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100 mb-3">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-2"><Inp value={newItem.nombre} onChange={e => setNewItem({ ...newItem, nombre: e.target.value })} placeholder="Nombre del platillo" /></div>
                <Inp type="number" value={newItem.precio} onChange={e => setNewItem({ ...newItem, precio: e.target.value })} placeholder="Precio MXN" />
                <Inp value={newItem.descripcion} onChange={e => setNewItem({ ...newItem, descripcion: e.target.value })} placeholder="Descripción corta" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => addItem(cat.id)} className="flex-1 py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-bold">Agregar</button>
                <button onClick={() => setShowItemForm(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancelar</button>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {cat.items?.map(item => (
              <div key={item.id} className={`flex items-center gap-3 py-2.5 ${!item.disponible ? "opacity-50" : ""}`}>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.nombre}</p>
                  {item.descripcion && <p className="text-xs text-gray-500">{item.descripcion}</p>}
                </div>
                <span className="font-bold text-gray-900 text-sm">${item.precio}</span>
                <button onClick={async () => { await axios.put(`${API}/menu/items/${item.id}`, { disponible: !item.disponible }); fetchMenu(); }}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${item.disponible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {item.disponible ? "Disponible" : "Agotado"}
                </button>
                <button onClick={async () => { await axios.delete(`${API}/menu/items/${item.id}`); fetchMenu(); }}
                  className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {(!cat.items || cat.items.length === 0) && <p className="text-center py-3 text-xs text-gray-400">Sin platillos</p>}
          </div>
        </Card>
      ))}

      {categorias.length === 0 && (
        <Card className="text-center py-12 text-gray-400">
          <Utensils className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Crea tu primera categoría para comenzar el menú</p>
        </Card>
      )}
    </div>
  );
};

// ── MÓDULO SERVICIOS ──────────────────────────────────────────
const ModuloServicios = ({ prestadorId }) => {
  const [servicios, setServicios] = useState([]);
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "", precio_promocional: "", duracion: "", capacidad: "" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchServicios(); }, [prestadorId]);

  const fetchServicios = async () => {
    const { data } = await axios.get(`${API}/prestadores/${prestadorId}/servicios`);
    setServicios(data.servicios || []);
  };

  const save = async () => {
    if (!form.nombre || !form.precio) return toast.error("Nombre y precio requeridos");
    setSaving(true);
    try {
      const payload = { ...form, precio: parseFloat(form.precio), precio_promocional: form.precio_promocional ? parseFloat(form.precio_promocional) : null, capacidad: form.capacidad ? parseInt(form.capacidad) : null };
      if (editId) { await axios.put(`${API}/prestadores/servicios/${editId}`, payload); }
      else { await axios.post(`${API}/prestadores/${prestadorId}/servicios`, payload); }
      setForm({ nombre: "", descripcion: "", precio: "", precio_promocional: "", duracion: "", capacidad: "" });
      setShowForm(false); setEditId(null); fetchServicios(); toast.success(editId ? "Actualizado" : "Creado");
    } catch { toast.error("Error guardando"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Servicios y precios</h3>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-semibold hover:bg-[#145218]">
          <Plus className="w-4 h-4" /> Nuevo servicio
        </button>
      </div>

      {showForm && (
        <Card className="border-2 border-[#1B5E20]/20">
          <SectionTitle>{editId ? "Editar servicio" : "Nuevo servicio"}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2"><Field label="Nombre"><Inp value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Tour al volcán" /></Field></div>
            <Field label="Precio (MXN)"><Inp type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} /></Field>
            <Field label="Precio promocional"><Inp type="number" value={form.precio_promocional} onChange={e => setForm({ ...form, precio_promocional: e.target.value })} /></Field>
            <Field label="Duración"><Inp value={form.duracion} onChange={e => setForm({ ...form, duracion: e.target.value })} placeholder="2 horas" /></Field>
            <Field label="Capacidad"><Inp type="number" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Descripción"><Txta value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></Field></div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editId ? "Actualizar" : "Crear"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm">Cancelar</button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {servicios.map(s => (
          <Card key={s.id} className="flex items-center gap-4 !py-3.5">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{s.nombre}</p>
              {s.descripcion && <p className="text-xs text-gray-500 truncate">{s.descripcion}</p>}
              <div className="flex gap-3 mt-1 text-xs text-gray-400">
                {s.duracion && <span>{s.duracion}</span>}
                {s.capacidad && <span>{s.capacidad} personas</span>}
              </div>
            </div>
            <div className="text-right">
              {s.precio_promocional ? (
                <><p className="text-xs text-gray-400 line-through">${s.precio}</p><p className="font-bold text-[#1B5E20]">${s.precio_promocional}</p></>
              ) : <p className="font-bold text-gray-900">${s.precio}</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setForm({ nombre: s.nombre, descripcion: s.descripcion || "", precio: s.precio.toString(), precio_promocional: s.precio_promocional?.toString() || "", duracion: s.duracion || "", capacidad: s.capacidad?.toString() || "" }); setEditId(s.id); setShowForm(true); }}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"><Edit3 className="w-3.5 h-3.5" /></button>
              <button onClick={async () => { await axios.delete(`${API}/prestadores/servicios/${s.id}`); fetchServicios(); }}
                className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </Card>
        ))}
        {servicios.length === 0 && (
          <Card className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No tienes servicios. ¡Crea el primero!</p>
          </Card>
        )}
      </div>
    </div>
  );
};

// ── MÓDULO RESERVAS ───────────────────────────────────────────
const ModuloReservas = ({ prestadorId }) => {
  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState("pendiente");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReservas(); }, [prestadorId, filtro]);

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/prestadores/${prestadorId}/reservas`, { params: { estado: filtro } });
      setReservas(data.reservas || []);
    } finally { setLoading(false); }
  };

  const actualizarEstado = async (id, estado) => {
    await axios.put(`${API}/reservas/${id}/estado`, { estado });
    toast.success(`Reserva ${estado}`); fetchReservas();
  };

  const ESTADO_COLORS = { pendiente: "bg-amber-100 text-amber-800", aceptada: "bg-blue-100 text-blue-800", completada: "bg-green-100 text-green-800", cancelada: "bg-red-100 text-red-800" };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {["pendiente","aceptada","completada","cancelada"].map(e => (
          <button key={e} onClick={() => setFiltro(e)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filtro === e ? "bg-[#1B5E20] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>{e}</button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        : reservas.length === 0 ? (
          <Card className="text-center py-12 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No hay reservas {filtro === "pendiente" ? "pendientes" : `con estado "${filtro}"`}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {reservas.map(r => (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{r.turista_nombre}</p>
                    <p className="text-xs text-gray-500">{r.turista_email}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{r.fecha_reserva}</span>
                      <span>{r.num_personas} personas</span>
                    </div>
                    {r.nota_turista && <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 px-2 py-1 rounded-lg">{r.nota_turista}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${ESTADO_COLORS[r.estado]}`}>{r.estado}</span>
                </div>
                {r.estado === "pendiente" && (
                  <div className="flex gap-2">
                    <button onClick={() => actualizarEstado(r.id, "aceptada")} className="flex-1 py-2 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Aceptar
                    </button>
                    <button onClick={() => actualizarEstado(r.id, "cancelada")} className="flex-1 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 flex items-center justify-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Rechazar
                    </button>
                  </div>
                )}
                {r.estado === "aceptada" && (
                  <button onClick={() => actualizarEstado(r.id, "completada")} className="w-full py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-200">Marcar completada</button>
                )}
              </Card>
            ))}
          </div>
        )}
    </div>
  );
};

// ── MÓDULO PROMOCIONES ────────────────────────────────────────
const ModuloPromociones = ({ prestadorId }) => {
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState({ titulo: "", descripcion: "", descuento_pct: "", fecha_inicio: "", fecha_fin: "" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPromos(); }, [prestadorId]);
  const fetchPromos = async () => { const { data } = await axios.get(`${API}/prestadores/${prestadorId}/promociones`); setPromos(data.promociones || []); };
  const save = async () => {
    setSaving(true);
    try { await axios.post(`${API}/prestadores/${prestadorId}/promociones`, { ...form, descuento_pct: parseInt(form.descuento_pct) }); toast.success("Promoción creada"); setShowForm(false); setForm({ titulo: "", descripcion: "", descuento_pct: "", fecha_inicio: "", fecha_fin: "" }); fetchPromos(); }
    catch { toast.error("Error guardando"); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Promociones y ofertas</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-semibold hover:bg-[#145218]"><Plus className="w-4 h-4" /> Nueva promo</button>
      </div>
      {showForm && (
        <Card className="border-2 border-[#1B5E20]/20">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2"><Field label="Título"><Inp value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="10% de descuento fin de semana" /></Field></div>
            <Field label="Descuento (%)"><Inp type="number" value={form.descuento_pct} onChange={e => setForm({ ...form, descuento_pct: e.target.value })} /></Field>
            <Field label="Descripción"><Inp value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></Field>
            <Field label="Fecha inicio"><Inp type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} /></Field>
            <Field label="Fecha fin"><Inp type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} /></Field>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Crear</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancelar</button>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {promos.map(p => (
          <div key={p.id} className="bg-amber-50 rounded-xl p-4 border border-amber-200 relative">
            <span className="absolute top-3 right-3 text-2xl font-black text-amber-500">{p.descuento_pct}%</span>
            <p className="font-bold text-gray-900 mb-1">{p.titulo}</p>
            {p.descripcion && <p className="text-xs text-gray-600 mb-2">{p.descripcion}</p>}
            <p className="text-xs text-gray-500">{p.fecha_inicio} → {p.fecha_fin}</p>
            <button onClick={async () => { await axios.delete(`${API}/promociones/${p.id}`); fetchPromos(); }} className="absolute bottom-3 right-3 w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-500"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── MÓDULO ANALÍTICAS ─────────────────────────────────────────
const ModuloAnaliticas = ({ prestadorId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/prestadores/${prestadorId}/analiticas`).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [prestadorId]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  const stats = [
    { label: "Visitas al perfil", value: data?.visitas || 0, icon: Eye, color: "text-blue-600 bg-blue-50" },
    { label: "Clicks en contacto", value: data?.contactos || 0, icon: Phone, color: "text-green-600 bg-green-50" },
    { label: "Reservas totales", value: data?.reservas?.total || 0, icon: Calendar, color: "text-purple-600 bg-purple-50" },
    { label: "Pendientes", value: data?.reservas?.pendientes || 0, icon: AlertCircle, color: "text-amber-600 bg-amber-50" },
    { label: "Completadas", value: data?.reservas?.completadas || 0, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { label: "Período", value: `${data?.periodo_dias || 30}d`, icon: TrendingUp, color: "text-gray-600 bg-gray-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon className="w-5 h-5" /></div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────
const PrestadorDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [prestador, setPrestador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("perfil");
  const [uploading, setUploading] = useState(null); // "foto" | "logo" | null

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    fetchPrestador();
  }, [isAuthenticated]);

  const fetchPrestador = async () => {
    try {
      const { data } = await axios.get(`${API}/prestadores/me`);
      setPrestador(data);
    } catch { toast.error("No tienes un perfil de prestador"); }
    finally { setLoading(false); }
  };

  const uploadFoto = async (file) => {
    if (!file) return;
    setUploading("foto");
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data: up } = await axios.post(`${API}/upload`, fd);
      await axios.put(`${API}/prestadores/${prestador.id}`, { foto_url: up.url });
      toast.success("Foto actualizada"); fetchPrestador();
    } catch { toast.error("Error subiendo foto"); }
    finally { setUploading(null); }
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploading("logo");
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data: up } = await axios.post(`${API}/upload`, fd);
      await axios.put(`${API}/prestadores/me/perfil`, { logo_url: up.url });
      toast.success("Logo actualizado"); fetchPrestador();
    } catch { toast.error("Error subiendo logo"); }
    finally { setUploading(null); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 animate-spin text-[#1B5E20]" />
    </div>
  );

  if (!prestador) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
      <div className="text-5xl mb-4">🏪</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Sin perfil de prestador</h2>
      <p className="text-gray-500 text-sm">Contacta al administrador para activar tu cuenta.</p>
    </div>
  );

  const tipoConfig = TIPOS_PRESTADOR[prestador.tipo?.toUpperCase()] || TIPOS_PRESTADOR.default;
  const tabs = tipoConfig.tabs;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
              {prestador.foto_url
                ? <img src={prestador.foto_url} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-xl bg-green-50">🏪</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-gray-900 truncate">{prestador.nombre}</h1>
                {prestador.verificado && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                    <BadgeCheck className="w-3 h-3" /> Verificado
                  </span>
                )}
                {prestador.esta_abierto !== undefined && (
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${prestador.esta_abierto ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${prestador.esta_abierto ? "bg-green-500" : "bg-red-500"}`} />
                    {prestador.esta_abierto ? "Abierto" : "Cerrado"}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{tipoConfig.label} · Panel de gestión</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto border-t border-gray-100" style={{ scrollbarWidth: "none" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 whitespace-nowrap text-sm border-b-2 transition-all flex-shrink-0 font-medium ${
                tab === t ? "border-[#1B5E20] text-[#1B5E20] font-semibold" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}>{TAB_LABELS[t] || t}</button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === "perfil"       && <ModuloPerfil prestador={prestador} onSave={fetchPrestador} uploading={uploading} onUploadFoto={uploadFoto} onUploadLogo={uploadLogo} />}
        {tab === "galeria"      && <ModuloGaleria prestadorId={prestador.id} />}
        {tab === "servicios"    && <ModuloServicios prestadorId={prestador.id} />}
        {tab === "reservas"     && <ModuloReservas prestadorId={prestador.id} />}
        {tab === "menu"         && <ModuloMenu prestadorId={prestador.id} menuUrl={prestador.menu_url} />}
        {tab === "habitaciones" && <div className="text-center py-16 text-gray-400"><p className="text-sm">Módulo de habitaciones — próximamente</p></div>}
        {tab === "flota"        && <div className="text-center py-16 text-gray-400"><Car className="w-12 h-12 mx-auto mb-2 opacity-20" /><p className="text-sm">Módulo de flota — próximamente</p></div>}
        {tab === "promociones"  && <ModuloPromociones prestadorId={prestador.id} />}
        {tab === "resenas"      && <div className="text-center py-16 text-gray-400"><Star className="w-12 h-12 mx-auto mb-2 opacity-20" /><p className="text-sm">Reseñas — próximamente</p></div>}
        {tab === "analiticas"   && <ModuloAnaliticas prestadorId={prestador.id} />}
      </main>
    </div>
  );
};

export default PrestadorDashboard;