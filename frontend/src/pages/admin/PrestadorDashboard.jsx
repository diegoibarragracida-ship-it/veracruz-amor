import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API, useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck, Plus, Trash2, Save, Edit3,
  Calendar, CheckCircle, XCircle, AlertCircle,
  Loader2, MessageCircle, Send,
} from "lucide-react";
import { toast } from "sonner";

// ── Constantes gastronómicas ──────────────────────────────────
const TIPOS_ALIMENTOS = [
  "GASTRONOMIA","GASTRONOMÍA","CAFETERIA","CAFETERÍA",
  "BAR","BEBIDAS","RESTAURANTE","FOOD_TRUCK","PUESTO"
];

// Normaliza texto quitando acentos para comparación segura
const norm = (s) => s?.toUpperCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

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
  "Cafetería y postres": ["Cafetería","Café de especialidad","Espresso bar","Chocolate caliente","Tés / infusiones","Matcha bar","Repostería","Pastelería","Heladería","Crepería","Churros","Panadería","Postres gourmet"],
  "Bar y bebidas": ["Bar tradicional","Cantina","Cervecería artesanal","Bar de cerveza","Mezcalería","Tequilería","Pulquería","Vinoteca / bar de vinos","Bar de whisky","Coctelería clásica","Mixología moderna","Bar de autor","Bar karaoke"],
  "Desayunos y brunch": ["Desayunos mexicanos","Desayunos americanos","Brunch","Chilaquiles","Cafetería desayuno"],
  "Street food / puesto": ["Puesto de tacos","Puesto de hamburguesas","Puesto de elotes/esquites","Food truck","Puesto ambulante","Puesto de jugos","Puesto de aguas frescas","Puesto de tepache","Puesto de micheladas","Carrito de bebidas"],
  "Gourmet / alta cocina": ["Cocina de autor","Fine dining","Fusión","Degustación"],
};

// ── Tipos de bebidas detallados ───────────────────────────────
const TIPOS_BEBIDAS_DETALLE = {
  "☕ Cafés y calientes": ["Cafetería","Café de especialidad","Espresso bar","Chocolate caliente","Tés / infusiones","Matcha bar"],
  "🧋 Bebidas frías sin alcohol": ["Jugos naturales","Smoothies","Licuados","Frappés","Aguas frescas","Malteadas","Bebidas energéticas naturales","Bubble tea (boba)"],
  "🍺 Bebidas con alcohol": ["Cervecería","Cervecería artesanal","Bar de cerveza","Bar tradicional","Cantina"],
  "🍸 Mixología y cocteles": ["Coctelería clásica","Mixología moderna","Bar de autor","Shots / tragos","Margaritas","Mojitos","Cocteles tropicales"],
  "🥃 Especializadas": ["Mezcalería","Tequilería","Pulquería","Vinoteca / bar de vinos","Bar de whisky"],
  "🥤 Bebidas callejeras": ["Puesto de jugos","Puesto de aguas frescas","Puesto de tepache","Puesto de micheladas","Carrito de bebidas"],
};

const ETIQUETAS_GRUPOS = [
  { grupo: "Precio", opciones: ["Económico","Precio medio","Caro","Gourmet"] },
  { grupo: "Experiencia", opciones: ["Familiar","Romántico","Para grupos","Casual","Elegante","Rápido","Experiencia premium"] },
  { grupo: "Servicio", opciones: ["Para comer ahí","Para llevar","A domicilio","Pickup","Reservación","Sin reservación"] },
  { grupo: "Ambiente", opciones: ["Nocturno","Con música en vivo","DJ","Tranquilo","Fiesta","Bar","Terraza","Con vista"] },
  { grupo: "Especialidades", opciones: ["Por kilo","Buffet","A la carta","Comida corrida","Todo incluido"] },
  { grupo: "Preferencias", opciones: ["Vegano friendly","Vegetariano friendly","Sin gluten","Opciones saludables"] },
  { grupo: "Extras", opciones: ["Pet friendly","Área infantil","Estacionamiento","WiFi","Climatizado","Accesible (silla de ruedas)"] },
  { grupo: "Estilo", opciones: ["Instagramable","Tradicional","Moderno","Rústico","Temático"] },
  { grupo: "Bebidas disponibles", opciones: ["Con alcohol","Sin alcohol","Cervezas artesanales","Mixología","Café de especialidad"] },
];

const ETIQUETAS_BEBIDAS_GRUPOS = [
  { grupo: "Tipo de bebida", opciones: ["Con alcohol","Sin alcohol","Artesanal","Preparadas","Naturales"] },
  { grupo: "Estilo", opciones: ["Frías","Calientes","Refrescantes","Dulces","Amargas","Fuertes"] },
  { grupo: "Experiencia", opciones: ["Bar","Antro","Chill","Lounge","Terraza","Vista panorámica"] },
  { grupo: "Precio", opciones: ["Económico","Promociones","Happy hour","Premium"] },
  { grupo: "Ambiente", opciones: ["Música en vivo","DJ","Fiesta","Tranquilo","Romántico"] },
];

const METODOS_PAGO = ["Efectivo","Tarjeta crédito","Tarjeta débito","Transferencia","Mercado Pago","PayPal","Clip","CoDi"];

const MOMENTOS = ["Desayuno","Brunch","Comida","Cena","Antojos nocturnos"];
const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

const TIPOS_PRESTADOR = {
  HOSPEDAJE:    { label: "Hospedaje",    tabs: ["perfil","galeria","habitaciones","servicios","reservas","mensajes","promociones","resenas","analiticas"] },
  HOTEL:        { label: "Hotel",        tabs: ["perfil","galeria","habitaciones","servicios","reservas","mensajes","promociones","resenas","analiticas"] },
  HOSTAL:       { label: "Hostal",       tabs: ["perfil","galeria","habitaciones","servicios","reservas","mensajes","promociones","resenas","analiticas"] },
  CABANA:       { label: "Cabaña",       tabs: ["perfil","galeria","habitaciones","servicios","reservas","mensajes","promociones","resenas","analiticas"] },
  GLAMPING:     { label: "Glamping",     tabs: ["perfil","galeria","habitaciones","servicios","reservas","mensajes","promociones","resenas","analiticas"] },
  POSADA:       { label: "Posada",       tabs: ["perfil","galeria","habitaciones","servicios","reservas","mensajes","promociones","resenas","analiticas"] },
  GASTRONOMÍA:  { label: "Restaurante",  tabs: ["perfil","galeria","menu","reservas","mensajes","promociones","resenas","analiticas"] },
  GASTRONOMIA:  { label: "Restaurante",  tabs: ["perfil","galeria","menu","reservas","mensajes","promociones","resenas","analiticas"] },
  CAFETERÍA:    { label: "Cafetería",    tabs: ["perfil","galeria","menu","reservas","mensajes","promociones","resenas","analiticas"] },
  BAR:          { label: "Bar",          tabs: ["perfil","galeria","menu","reservas","mensajes","promociones","resenas","analiticas"] },
  BEBIDAS:      { label: "Bebidas",      tabs: ["perfil","galeria","menu","reservas","mensajes","promociones","resenas","analiticas"] },
  RESTAURANTE:  { label: "Restaurante",  tabs: ["perfil","galeria","menu","reservas","mensajes","promociones","resenas","analiticas"] },
  FOOD_TRUCK:   { label: "Food Truck",   tabs: ["perfil","galeria","menu","reservas","mensajes","promociones","resenas","analiticas"] },
  PUESTO:       { label: "Puesto",       tabs: ["perfil","galeria","menu","reservas","mensajes","promociones","resenas","analiticas"] },
  TURISMO:      { label: "Tour",         tabs: ["perfil","galeria","servicios","flota","reservas","mensajes","promociones","resenas","analiticas"] },
  TRANSPORTE:   { label: "Transporte",   tabs: ["perfil","galeria","servicios","flota","reservas","mensajes","promociones","resenas","analiticas"] },
  SERVICIOS:    { label: "Servicios",    tabs: ["perfil","galeria","servicios","reservas","mensajes","promociones","resenas","analiticas"] },
  default:      { label: "Negocio",      tabs: ["perfil","galeria","servicios","reservas","mensajes","promociones","resenas","analiticas"] },
};

const TAB_LABELS = {
  perfil: "Perfil", galeria: "Galería", servicios: "Servicios",
  reservas: "Reservas", menu: "Menú", habitaciones: "Habitaciones",
  flota: "Flota", promociones: "Promociones", resenas: "Reseñas",
  mensajes: "Mensajes", analiticas: "Analíticas",
};

const esAlimentos = (tipo) => TIPOS_ALIMENTOS.includes(norm(tipo));
const esBebidas = (tipo, categoria) =>
  ["BAR","BEBIDAS","CAFETERIA"].includes(norm(tipo)) ||
  ["Bar y bebidas","Cafetería y postres"].includes(categoria);

// ── Constantes de hospedaje ───────────────────────────────────
const TIPOS_HOSPEDAJE = [
  "HOSPEDAJE","HOTEL","HOSTAL","CABANA","CABAÑA","GLAMPING",
  "BNB","B&B","HACIENDA","VILLA","CAMPING","POSADA"
];
const esHospedaje = (tipo) => TIPOS_HOSPEDAJE.includes(norm(tipo));

// ── Constantes de turismo ─────────────────────────────────────
const TIPOS_TURISMO_LIST = [
  "TURISMO","TOUR","ECOTURISMO","AVENTURA","EXCURSION","ACTIVIDAD","GUIA"
];
const esTurismo = (tipo) => TIPOS_TURISMO_LIST.includes(norm(tipo));

const CATEGORIAS_TURISMO = [
  "Turismo cultural","Ecoturismo","Turismo de aventura","Turismo gastronómico",
  "Turismo de naturaleza","Turismo de bienestar","Turismo histórico",
  "Turismo rural","Turismo de playa","Tours fotográficos","City tours",
];

const SUBCATEGORIAS_TURISMO = {
  "Turismo cultural":      ["Recorrido de museos","Tour histórico","Tour arqueológico","Visita a haciendas","Arte y artesanías","Turismo religioso"],
  "Ecoturismo":            ["Senderismo","Observación de aves","Avistamiento de ballenas","Fotografía de naturaleza","Camping eco","Espeleología"],
  "Turismo de aventura":   ["Rapel","Escalada","Tirolesa","Kayak","Rafting","Montañismo","Parapente","Cicloturismo","Surf","Buceo"],
  "Turismo gastronómico":  ["Tour de mercados","Clases de cocina","Cata de mezcal/tequila","Visita a cafetales","Tour de mariscos","Turismo cafetalero"],
  "Turismo de naturaleza": ["Cascadas","Manglares","Selva tropical","Ríos y lagos","Volcanes","Flora endémica"],
  "Turismo de bienestar":  ["Temazcal","Yoga en naturaleza","Retiro espiritual","Masajes en sitio","Meditación"],
  "Turismo histórico":     ["Zona arqueológica","Centro histórico","Ruinas coloniales","Museos locales","Recorridos a pie"],
  "Turismo rural":         ["Visita a comunidades","Agroturismo","Cosecha de café","Pesca artesanal","Convivencia con familias"],
  "City tours":            ["Tour a pie","Bus turístico","Tour en bicicleta","Tour nocturno","Tour en carruaje"],
  "Tours fotográficos":    ["Paisajes urbanos","Naturaleza","Cascadas y cenotes","Wildlife","Aurora y atardeceres"],
};

const ETIQUETAS_TURISMO_GRUPOS = [
  { grupo: "Nivel de dificultad", opciones: ["Fácil","Moderado","Difícil","Extremo","Apto para niños","Apto para adultos mayores"] },
  { grupo: "Duración", opciones: ["Menos de 1 hora","Media jornada","Jornada completa","Varios días"] },
  { grupo: "Grupo", opciones: ["Individual","Parejas","Familia","Grupos","Privado","Semi-privado"] },
  { grupo: "Incluye", opciones: ["Transporte","Alimentación","Equipo","Guía certificado","Seguro","Hidratación","Fotografías"] },
  { grupo: "Temporada", opciones: ["Todo el año","Temporada seca","Temporada lluviosa","Solo fines de semana"] },
  { grupo: "Idioma", opciones: ["Español","Inglés","Francés","Portugués"] },
  { grupo: "Precio", opciones: ["Económico","Precio medio","Premium","Precio familiar"] },
];

const AMENIDADES_TOUR = [
  { grupo: "Equipo incluido",   opciones: ["Cascos","Arneses","Impermeables","Botas","Cuerdas","Chalecos salvavidas","Kayaks","Bicicletas","Binoculares"] },
  { grupo: "Servicios",         opciones: ["Guía certificado","Transporte","Seguro de viaje","Primeros auxilios","Hidratación","Snacks","Comida completa","Fotografías del tour"] },
  { grupo: "Accesibilidad",     opciones: ["Apto para silla de ruedas","Sin restricción de edad","Solo adultos","Acepta mascotas"] },
];

// ── Constantes de transporte ──────────────────────────────────
const TIPOS_TRANSPORTE_LIST = [
  "TRANSPORTE","TRASLADO","RENTA","VEHICULO","TAXI","SHUTTLE","BUS","LANCHA"
];
const esTransporte = (tipo) => TIPOS_TRANSPORTE_LIST.includes(norm(tipo));

const CATEGORIAS_TRANSPORTE = [
  "Traslados aeropuerto","Traslados turísticos","Renta de vehículos",
  "Transporte ejecutivo","Transporte de grupos","Servicio de taxi",
  "Shuttle / Combi","Lancha / Barco","Helicóptero","Bicicletas / E-bikes",
];

const SUBCATEGORIAS_TRANSPORTE = {
  "Traslados aeropuerto":  ["Aeropuerto → Hotel","Hotel → Aeropuerto","Traslado privado","Traslado compartido"],
  "Traslados turísticos":  ["Tour en auto privado","Traslado entre ciudades","Traslado a zonas arqueológicas","Traslado a cascadas"],
  "Renta de vehículos":    ["Autos","Camionetas","Motocicletas","Bicicletas","Cuatrimotos","Scooters"],
  "Transporte ejecutivo":  ["Sedán ejecutivo","SUV ejecutivo","Van ejecutiva","Limosina","Traslado corporativo"],
  "Transporte de grupos":  ["Van / Sprinter","Autobús turístico","Minibús","Camioneta de pasajeros"],
  "Lancha / Barco":        ["Lancha rápida","Barco turístico","Velero","Yate","Lancha de pesca"],
  "Bicicletas / E-bikes":  ["Bicicleta de montaña","Bicicleta de ruta","E-bike","Triciclo de carga"],
};

const ETIQUETAS_TRANSPORTE_GRUPOS = [
  { grupo: "Tipo de servicio", opciones: ["Privado","Compartido","Ejecutivo","Turístico","A demanda","Programado"] },
  { grupo: "Capacidad",        opciones: ["1-2 personas","3-4 personas","5-8 personas","9-15 personas","16+ personas"] },
  { grupo: "Incluye",          opciones: ["Chofer","Guía","WiFi a bordo","Aire acondicionado","Agua","Cargadores","Equipo de seguridad"] },
  { grupo: "Disponibilidad",   opciones: ["24 horas","Solo de día","Fines de semana","Bajo reservación","Inmediato"] },
  { grupo: "Precio",           opciones: ["Económico","Precio medio","Premium","Por km","Tarifa fija"] },
];

const AMENIDADES_VEHICULO = [
  { grupo: "Comodidades",   opciones: ["Aire acondicionado","Calefacción","WiFi","Asientos reclinables","Cargadores USB","Pantalla entretenimiento","Cooler / hielera"] },
  { grupo: "Seguridad",     opciones: ["Cinturones de seguridad","Airbags","GPS","Seguro de viajero","Botiquín","Extinguidor"] },
  { grupo: "Equipaje",      opciones: ["Portaequipaje","Rack de bicicletas","Porta-surf","Espacio para silla de ruedas"] },
  { grupo: "Documentación", opciones: ["Factura disponible","Recibo electrónico","Cotización previa","Contrato de renta"] },
];

// ── Constantes de servicios ───────────────────────────────────
const TIPOS_SERVICIOS_LIST = [
  "SERVICIOS","SERVICIO","SPA","SALON","SALUD","BIENESTAR","FOTOGRAFIA",
  "EVENTOS","BODAS","EDUCACION","OTRO"
];
const esServicios = (tipo) => TIPOS_SERVICIOS_LIST.includes(norm(tipo)) ||
  (!esTurismo(tipo) && !esTransporte(tipo) && !esAlimentos(tipo) && !esHospedaje(tipo));

const CATEGORIAS_SERVICIOS = [
  "Salud y bienestar","Belleza y estética","Fotografía y video",
  "Eventos y bodas","Educación y talleres","Guías locales",
  "Alquiler de espacios","Servicios digitales","Artesanías y productos locales","Otro",
];

const SUBCATEGORIAS_SERVICIOS = {
  "Salud y bienestar":      ["Spa","Masajes","Terapias alternativas","Yoga","Meditación","Nutrición","Psicología","Fisioterapia"],
  "Belleza y estética":     ["Salón de belleza","Barbería","Uñas","Maquillaje","Peinados","Depilación","Tratamientos faciales"],
  "Fotografía y video":     ["Fotografía de bodas","Fotografía de quinceañeras","Fotografía aérea (drone)","Video corporativo","Fotografía de producto","Sesiones de retrato"],
  "Eventos y bodas":        ["Organización de bodas","Decoración","Animación","DJ","Música en vivo","Renta de carpas","Catering","Wedding planner"],
  "Educación y talleres":   ["Clases de cocina","Talleres artesanales","Clases de idiomas","Música","Pintura","Fotografía","Yoga / meditación","Deportes acuáticos"],
  "Guías locales":          ["Guía de turismo","Intérprete","Guía de naturaleza","Guía histórico","Guía bilingüe"],
  "Alquiler de espacios":   ["Salón de eventos","Coworking","Estudio fotográfico","Cancha deportiva","Jardín / área verde","Terraza"],
  "Artesanías y productos": ["Artesanías locales","Productos orgánicos","Miel","Café","Textiles","Cerámica","Joyería"],
};

const ETIQUETAS_SERVICIOS_GRUPOS = [
  { grupo: "Modalidad",    opciones: ["Presencial","A domicilio","En línea","Mixto"] },
  { grupo: "Duración",     opciones: ["Express (30 min)","1 hora","Medio día","Día completo","Por paquete"] },
  { grupo: "Para quién",   opciones: ["Individual","Parejas","Grupos","Familiar","Empresas","Niños","Adultos mayores"] },
  { grupo: "Estilo",       opciones: ["Relajante","Terapéutico","Creativo","Educativo","Espiritual","Recreativo","Profesional"] },
  { grupo: "Certificación",opciones: ["Certificado","Avalado","Titulado","Con experiencia comprobada"] },
  { grupo: "Precio",       opciones: ["Económico","Precio medio","Premium","Por paquete","Consultar"] },
];

const TIPOS_HABITACION = [
  "Sencilla","Doble","Matrimonial","Suite","Junior Suite","Familiar",
  "Cabaña","Loft","Penthouse","Estudio","Dormitorio compartido"
];

const AMENIDADES_HABITACION = [
  "WiFi","Aire acondicionado","Calefacción","TV","Baño privado",
  "Jacuzzi","Minibar","Caja fuerte","Balcón","Terraza privada",
  "Vista al jardín","Vista a la montaña","Vista al río","Cocina equipada",
  "Cafetera","Secadora de cabello","Plancha"
];

const AMENIDADES_HOTEL = [
  { grupo: "Servicios", opciones: ["Recepción 24h","Estacionamiento","Estacionamiento techado","WiFi en todo el hotel","Conserjería","Botones","Lavandería","Planchado"] },
  { grupo: "Alimentación", opciones: ["Restaurante","Bar","Cafetería","Desayuno incluido","Servicio a la habitación","Cocineta compartida"] },
  { grupo: "Bienestar", opciones: ["Alberca","Jacuzzi","Spa","Gimnasio","Sauna","Temazcal","Área de yoga"] },
  { grupo: "Negocios", opciones: ["Sala de juntas","Centro de negocios","Proyector","Impresora"] },
  { grupo: "Entretenimiento", opciones: ["Área de juegos","Zona infantil","Salón de eventos","Jardín","Terraza común","BBQ / asador"] },
  { grupo: "Accesibilidad", opciones: ["Acceso silla de ruedas","Elevador","Habitaciones adaptadas"] },
  { grupo: "Extras", opciones: ["Acepta mascotas","Traslado aeropuerto","Tour desk","Renta de bicicletas","Área de fumadores"] },
];

const ETIQUETAS_HOSPEDAJE_GRUPOS = [
  { grupo: "Tipo de viajero", opciones: ["Familia","Pareja","Solo","Grupos","Negocios","Luna de miel","Mochilero"] },
  { grupo: "Estilo", opciones: ["Boutique","Rústico","Moderno","Colonial","Ecológico","Glamping","Lujo","Económico"] },
  { grupo: "Ambiente", opciones: ["Tranquilo","Romántico","Con vista","En la naturaleza","En el centro","Cerca de playas","En la montaña"] },
  { grupo: "Precio", opciones: ["Económico","Precio medio","Premium","Lujo"] },
  { grupo: "Política", opciones: ["Permite mascotas","Solo adultos","Fumadores permitidos","Sin restricciones de edad"] },
];

const POLITICAS_CANCELACION = [
  "Cancelación gratuita 24h antes",
  "Cancelación gratuita 48h antes",
  "Cancelación gratuita 7 días antes",
  "No reembolsable",
  "Reembolso parcial (50%)",
];

const POLITICAS_CHECK = {
  checkin: ["12:00","13:00","14:00","15:00","16:00","17:00","18:00"],
  checkout: ["10:00","11:00","12:00","13:00","14:00"],
};

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
  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">{children}</h3>
);

// ── Toggle CSS (sin iconos) ───────────────────────────────────
const Toggle = ({ value, onChange, labelOn = "Activado", labelOff = "Desactivado" }) => (
  <button type="button" onClick={() => onChange(!value)}
    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
      value ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"
    }`}>
    <span className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${value ? "bg-green-500" : "bg-gray-300"}`}>
      <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${value ? "left-4" : "left-0.5"}`} />
    </span>
    {value ? labelOn : labelOff}
  </button>
);

// ── Toggle abierto/cerrado ────────────────────────────────────
const ToggleAbierto = ({ estaAbierto, onChange }) => (
  <button type="button" onClick={() => onChange(!estaAbierto)}
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
            <button type="button" onClick={() => toggleDia(dia)}
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
const EtiquetasSelector = ({ value = [], onChange, grupos = ETIQUETAS_GRUPOS }) => (
  <div className="space-y-4">
    {grupos.map(({ grupo, opciones }) => (
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

// ── Selector de tipos de bebidas ──────────────────────────────
const BebidasSelector = ({ value = [], onChange }) => (
  <div className="space-y-4">
    {Object.entries(TIPOS_BEBIDAS_DETALLE).map(([grupo, tipos]) => (
      <div key={grupo}>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{grupo}</p>
        <div className="flex flex-wrap gap-2">
          {tipos.map(tipo => (
            <button key={tipo} type="button"
              onClick={() => onChange(value.includes(tipo) ? value.filter(v => v !== tipo) : [...value, tipo])}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                value.includes(tipo)
                  ? "bg-[#0277BD] text-white border-[#0277BD]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#0277BD] hover:text-[#0277BD]"
              }`}>{tipo}</button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ── Selector de métodos de pago ───────────────────────────────
const MetodosPagoSelector = ({ value = [], onChange }) => (
  <div className="flex flex-wrap gap-2">
    {METODOS_PAGO.map(m => (
      <button key={m} type="button"
        onClick={() => onChange(value.includes(m) ? value.filter(v => v !== m) : [...value, m])}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          value.includes(m)
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900"
        }`}>{m}</button>
    ))}
  </div>
);

// ── MÓDULO PERFIL ─────────────────────────────────────────────
const ModuloPerfil = ({ prestador, onSave, uploading, onUploadFoto, onUploadLogo }) => {
  const [form, setForm] = useState({
    nombre:                     prestador?.nombre || "",
    descripcion:                prestador?.descripcion || "",
    descripcion_larga:          prestador?.descripcion_larga || "",
    direccion:                  prestador?.direccion || "",
    horarios:                   prestador?.horarios || "",
    horarios_detallados:        prestador?.horarios_detallados || {},
    telefono:                   prestador?.telefono || "",
    whatsapp:                   prestador?.whatsapp || "",
    instagram:                  prestador?.instagram || "",
    facebook:                   prestador?.facebook || "",
    tiktok:                     prestador?.tiktok || "",
    website:                    prestador?.website || "",
    lat:                        prestador?.lat || "",
    lng:                        prestador?.lng || "",
    precio_min:                 prestador?.precio_min || "",
    precio_max:                 prestador?.precio_max || "",
    precio_familia:             prestador?.precio_familia || "",
    capacidad_personas:         prestador?.capacidad_personas || "",
    esta_abierto:               prestador?.esta_abierto ?? true,
    menu_url:                   prestador?.menu_url || "",
    categoria_gastronomica:     prestador?.categoria_gastronomica || "",
    subcategoria_gastronomica:  prestador?.subcategoria_gastronomica || "",
    etiquetas:                  prestador?.etiquetas || [],
    momentos:                   prestador?.momentos || [],
    tipo_bebidas:               prestador?.tipo_bebidas || [],
    etiquetas_bebidas:          prestador?.etiquetas_bebidas || [],
    metodos_pago:               prestador?.metodos_pago || [],
    reservas_mesa_activas:      prestador?.reservas_mesa_activas ?? false,
    reservas_mesa_capacidad:    prestador?.reservas_mesa_capacidad || "",
    reservas_mesa_notas:        prestador?.reservas_mesa_notas || "",
    pedidos_whatsapp_activo:    prestador?.pedidos_whatsapp_activo ?? false,
    pedidos_whatsapp_mensaje:   prestador?.pedidos_whatsapp_mensaje || "",
    // Hospedaje
    num_habitaciones:           prestador?.num_habitaciones || "",
    num_pisos:                  prestador?.num_pisos || "",
    anio_construccion:          prestador?.anio_construccion || "",
    anio_renovacion:            prestador?.anio_renovacion || "",
    checkin_desde:              prestador?.checkin_desde || "15:00",
    checkout_hasta:             prestador?.checkout_hasta || "12:00",
    checkin_notas:              prestador?.checkin_notas || "",
    precio_noche_desde:         prestador?.precio_noche_desde || "",
    precio_noche_hasta:         prestador?.precio_noche_hasta || "",
    amenidades_hotel:           prestador?.amenidades_hotel || [],
    etiquetas_hospedaje:        prestador?.etiquetas_hospedaje || [],
    politica_cancelacion:       prestador?.politica_cancelacion || "",
    politica_mascotas:          prestador?.politica_mascotas ?? false,
    politica_menores:           prestador?.politica_menores || "",
    reservas_activas:           prestador?.reservas_activas ?? false,
    reservas_anticipacion_dias: prestador?.reservas_anticipacion_dias || "1",
    reservas_notas:             prestador?.reservas_notas || "",
    desayuno_incluido:          prestador?.desayuno_incluido ?? false,
    desayuno_precio:            prestador?.desayuno_precio || "",
    // Turismo
    categoria_turismo:          prestador?.categoria_turismo || "",
    subcategoria_turismo:       prestador?.subcategoria_turismo || "",
    etiquetas_turismo:          prestador?.etiquetas_turismo || [],
    amenidades_tour:            prestador?.amenidades_tour || [],
    duracion_tour:              prestador?.duracion_tour || "",
    punto_salida:               prestador?.punto_salida || "",
    incluye_transporte:         prestador?.incluye_transporte ?? false,
    incluye_alimentacion:       prestador?.incluye_alimentacion ?? false,
    incluye_equipo:             prestador?.incluye_equipo ?? false,
    incluye_guia:               prestador?.incluye_guia ?? false,
    min_personas:               prestador?.min_personas || "",
    max_personas:               prestador?.max_personas || "",
    idiomas_guia:               prestador?.idiomas_guia || [],
    // Transporte
    categoria_transporte:       prestador?.categoria_transporte || "",
    subcategoria_transporte:    prestador?.subcategoria_transporte || "",
    etiquetas_transporte:       prestador?.etiquetas_transporte || [],
    amenidades_vehiculo:        prestador?.amenidades_vehiculo || [],
    capacidad_vehiculo:         prestador?.capacidad_vehiculo || "",
    marca_vehiculo:             prestador?.marca_vehiculo || "",
    modelo_vehiculo:            prestador?.modelo_vehiculo || "",
    anio_vehiculo:              prestador?.anio_vehiculo || "",
    servicio_24h:               prestador?.servicio_24h ?? false,
    cobertura_zonas:            prestador?.cobertura_zonas || "",
    tarifa_base:                prestador?.tarifa_base || "",
    tarifa_por_km:              prestador?.tarifa_por_km || "",
    // Servicios
    categoria_servicio:         prestador?.categoria_servicio || "",
    subcategoria_servicio:      prestador?.subcategoria_servicio || "",
    etiquetas_servicio:         prestador?.etiquetas_servicio || [],
    modalidad_servicio:         prestador?.modalidad_servicio || "",
    duracion_sesion:            prestador?.duracion_sesion || "",
    precio_sesion:              prestador?.precio_sesion || "",
    precio_paquete:             prestador?.precio_paquete || "",
    atiende_domicilio:          prestador?.atiende_domicilio ?? false,
    requiere_cita:              prestador?.requiere_cita ?? true,
    certificaciones:            prestador?.certificaciones || "",
  });
  const [saving, setSaving] = useState(false);
  const [seccion, setSeccion] = useState("info");
  const [geoLoading, setGeoLoading] = useState(false);

  const es_alimentos  = esAlimentos(prestador?.tipo);
  const es_bebidas    = esBebidas(prestador?.tipo, form.categoria_gastronomica);
  const es_hospedaje  = esHospedaje(prestador?.tipo);
  const es_turismo    = esTurismo(prestador?.tipo);
  const es_transporte = esTransporte(prestador?.tipo);
  const es_servicios  = esServicios(prestador?.tipo);

  const save = async () => {
    setSaving(true);
    try {
      const cleanForm = Object.fromEntries(
        Object.entries(form).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
      );

      const numericFloats = ["lat", "lng", "precio_min", "precio_max", "precio_familia", 
                             "precio_noche_desde", "precio_noche_hasta", "tarifa_base", 
                             "tarifa_por_km", "precio_sesion", "precio_paquete", "desayuno_precio"];
      const numericInts   = ["capacidad_personas", "num_habitaciones", "num_pisos", 
                             "min_personas", "max_personas", "capacidad_vehiculo",
                             "reservas_mesa_capacidad"];

      numericFloats.forEach(k => { if (cleanForm[k]) cleanForm[k] = parseFloat(cleanForm[k]); });
      numericInts.forEach(k =>   { if (cleanForm[k]) cleanForm[k] = parseInt(cleanForm[k]); });

      await axios.put(`${API}/prestadores/me/perfil`, cleanForm);
      toast.success("Perfil actualizado");
      onSave();
    } catch(e) { 
      toast.error("Error guardando"); 
    } finally { setSaving(false); }
  };

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) return toast.error("Geolocalización no disponible");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        toast.success("Ubicación obtenida");
        setGeoLoading(false);
      },
      () => { toast.error("No se pudo obtener la ubicación"); setGeoLoading(false); }
    );
  };

  const secciones = [
    { id: "info",       label: "Información" },
    { id: "horarios",   label: "Horarios" },
    { id: "ubicacion",  label: "Ubicación" },
    { id: "redes",      label: "Redes" },
    ...(es_alimentos  ? [{ id: "gastronomia",  label: "Gastronomía" }]  : []),
    ...(es_hospedaje  ? [{ id: "hospedaje",    label: "Hospedaje" }]    : []),
    ...(es_turismo    ? [{ id: "turismo",      label: "Turismo" }]      : []),
    ...(es_transporte ? [{ id: "transporte",   label: "Transporte" }]   : []),
    ...(es_servicios  ? [{ id: "servicios_cfg",label: "Mi Servicio" }]  : []),
    { id: "operacion",  label: "Operación" },
  ];

  return (
    <div className="space-y-5">
      {/* Presentación */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <SectionTitle>Presentación del negocio</SectionTitle>
          <ToggleAbierto estaAbierto={form.esta_abierto} onChange={v => setForm({ ...form, esta_abierto: v })} />
        </div>

        <div className="flex items-start gap-6 flex-wrap">
          {/* Foto principal */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              {prestador?.foto_url
                ? <img src={prestador.foto_url} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400 bg-gray-100">
                    {prestador?.nombre?.charAt(0)?.toUpperCase() || "N"}
                  </div>}
            </div>
            <label className="cursor-pointer px-3 py-1.5 bg-[#1B5E20] text-white rounded-lg text-xs font-medium hover:bg-[#145218] transition-colors">
              {uploading === "foto" ? "Subiendo..." : "Cambiar foto"}
              <input type="file" accept="image/*" className="hidden" onChange={e => onUploadFoto(e.target.files[0])} />
            </label>
            <span className="text-[10px] text-gray-400">Foto principal</span>
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
              {prestador?.logo_url
                ? <img src={prestador.logo_url} className="w-full h-full object-contain p-2" alt="Logo" />
                : <span className="text-xs text-gray-400 text-center px-2">Sin logo</span>}
            </div>
            <label className="cursor-pointer px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors">
              {uploading === "logo" ? "Subiendo..." : "Subir logo"}
              <input type="file" accept="image/*" className="hidden" onChange={e => onUploadLogo(e.target.files[0])} />
            </label>
            <span className="text-[10px] text-gray-400">Logo del negocio</span>
          </div>
        </div>
      </Card>

      {/* Sub-tabs */}
      <div className="flex gap-1 flex-wrap bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
        {secciones.map(s => (
          <button key={s.id} type="button" onClick={() => setSeccion(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              seccion === s.id ? "bg-[#1B5E20] text-white" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}>{s.label}</button>
        ))}
      </div>

      {/* ── Información básica ── */}
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
            <Field label="WhatsApp (con clave)">
              <Inp value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="5227200000000" />
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

            {/* Precios */}
            <Field label="Precio mínimo por persona (MXN)">
              <Inp type="number" value={form.precio_min} onChange={e => setForm({ ...form, precio_min: e.target.value })} placeholder="100" />
            </Field>
            <Field label="Precio máximo por persona (MXN)">
              <Inp type="number" value={form.precio_max} onChange={e => setForm({ ...form, precio_max: e.target.value })} placeholder="500" />
            </Field>
            <Field label="Precio por familia (MXN, opcional)">
              <Inp type="number" value={form.precio_familia} onChange={e => setForm({ ...form, precio_familia: e.target.value })} placeholder="350" />
            </Field>
            <Field label="Capacidad del lugar (personas)">
              <Inp type="number" value={form.capacidad_personas} onChange={e => setForm({ ...form, capacidad_personas: e.target.value })} placeholder="50" />
            </Field>

            {/* Métodos de pago */}
            <div className="sm:col-span-2">
              <Field label="Métodos de pago aceptados">
                <div className="mt-1">
                  <MetodosPagoSelector value={form.metodos_pago} onChange={v => setForm({ ...form, metodos_pago: v })} />
                </div>
              </Field>
            </div>
          </div>
        </Card>
      )}

      {/* ── Horarios ── */}
      {seccion === "horarios" && (
        <Card>
          <SectionTitle>Horarios de atención</SectionTitle>
          <div className="mb-4">
            <Field label="Horario general (texto libre)">
              <Inp value={form.horarios} onChange={e => setForm({ ...form, horarios: e.target.value })} placeholder="Lun–Dom 8:00–22:00" />
            </Field>
          </div>
          <SectionTitle>Horario detallado por día</SectionTitle>
          <HorariosDetallados value={form.horarios_detallados} onChange={v => setForm({ ...form, horarios_detallados: v })} />
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

      {/* ── Ubicación ── */}
      {seccion === "ubicacion" && (
        <Card>
          <SectionTitle>Ubicación en el mapa</SectionTitle>
          <p className="text-xs text-gray-500 mb-4">
            Tu ubicación aparece en el mapa de la app para que los visitantes te encuentren fácilmente.
            Activa la localización y haz clic en "Obtener mi ubicación" para que sea exacta.
          </p>
          <div className="mb-4">
            <button type="button" onClick={obtenerUbicacion} disabled={geoLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1B5E20] text-white rounded-lg text-sm font-semibold hover:bg-[#145218] transition-colors disabled:opacity-60">
              {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {geoLoading ? "Obteniendo ubicación..." : "📍 Obtener mi ubicación actual"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Latitud">
              <Inp type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="19.18" />
            </Field>
            <Field label="Longitud">
              <Inp type="number" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} placeholder="-96.14" />
            </Field>
          </div>
          {form.lat && form.lng && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${form.lat},${form.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#0277BD] hover:underline">
              Verificar en Google Maps →
            </a>
          )}
        </Card>
      )}

      {/* ── Redes sociales ── */}
      {seccion === "redes" && (
        <Card>
          <SectionTitle>Redes sociales y web</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "instagram", label: "Instagram", ph: "@tunegocio" },
              { key: "facebook",  label: "Facebook",  ph: "facebook.com/tunegocio" },
              { key: "tiktok",    label: "TikTok",    ph: "@tunegocio" },
              { key: "website",   label: "Sitio web", ph: "www.tunegocio.com" },
            ].map(({ key, label, ph }) => (
              <Field key={key} label={label}>
                <Inp value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} />
              </Field>
            ))}
          </div>
        </Card>
      )}

      {/* ── Gastronomía (solo alimentos) ── */}
      {seccion === "gastronomia" && es_alimentos && (
        <div className="space-y-5">

          {/* Categoría y subcategoría */}
          <Card>
            <SectionTitle>Tipo de establecimiento</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
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
          </Card>

          {/* Tipos de bebidas (si aplica) */}
          {es_bebidas && (
            <Card>
              <SectionTitle>Tipos de bebidas que ofreces</SectionTitle>
              <p className="text-xs text-gray-500 mb-4">
                Selecciona todos los tipos de bebidas que sirves — esto ayuda a los visitantes a encontrarte por filtros específicos.
              </p>
              <BebidasSelector value={form.tipo_bebidas} onChange={v => setForm({ ...form, tipo_bebidas: v })} />
            </Card>
          )}

          {/* Menú digital */}
          <Card>
            <SectionTitle>Menú digital</SectionTitle>
            <Field label="URL de menú (PDF, página web, QR, etc.)">
              <div className="flex gap-2">
                <Inp value={form.menu_url} onChange={e => setForm({ ...form, menu_url: e.target.value })} placeholder="https://mi-menu.com o enlace a PDF" />
                {form.menu_url && (
                  <a href={form.menu_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 whitespace-nowrap">
                    Ver →
                  </a>
                )}
              </div>
            </Field>
            <p className="text-xs text-gray-400 mt-2">También puedes agregar platillos directamente en la pestaña "Menú".</p>
          </Card>

          {/* Etiquetas generales */}
          <Card>
            <SectionTitle>Etiquetas del negocio</SectionTitle>
            <p className="text-xs text-gray-500 mb-4">
              Estas etiquetas funcionan como filtros avanzados. Selecciona todo lo que aplique a tu negocio.
            </p>
            <EtiquetasSelector value={form.etiquetas} onChange={v => setForm({ ...form, etiquetas: v })} />
          </Card>

          {/* Etiquetas específicas para bebidas */}
          {es_bebidas && (
            <Card>
              <SectionTitle>Etiquetas específicas de bebidas</SectionTitle>
              <EtiquetasSelector
                value={form.etiquetas_bebidas}
                onChange={v => setForm({ ...form, etiquetas_bebidas: v })}
                grupos={ETIQUETAS_BEBIDAS_GRUPOS}
              />
            </Card>
          )}

          {/* Momentos ideales */}
          <Card>
            <SectionTitle>Momento ideal ⏰</SectionTitle>
            <p className="text-xs text-gray-500 mb-3">¿En qué momento del día atienden mejor? Selecciona todos los que apliquen.</p>
            <div className="flex flex-wrap gap-2">
              {["Desayuno","Brunch","Comida","Cena","Antojos nocturnos"].map(m => (
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
          </Card>
        </div>
      )}

      {/* ── Hospedaje ── */}
      {seccion === "hospedaje" && es_hospedaje && (
        <div className="space-y-5">

          {/* Datos del establecimiento */}
          <Card>
            <SectionTitle>Datos del establecimiento</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="N° de habitaciones">
                <Inp type="number" value={form.num_habitaciones} onChange={e => setForm({ ...form, num_habitaciones: e.target.value })} placeholder="20" />
              </Field>
              <Field label="N° de pisos">
                <Inp type="number" value={form.num_pisos} onChange={e => setForm({ ...form, num_pisos: e.target.value })} placeholder="3" />
              </Field>
              <Field label="Año construcción">
                <Inp type="number" value={form.anio_construccion} onChange={e => setForm({ ...form, anio_construccion: e.target.value })} placeholder="1998" />
              </Field>
              <Field label="Última renovación">
                <Inp type="number" value={form.anio_renovacion} onChange={e => setForm({ ...form, anio_renovacion: e.target.value })} placeholder="2022" />
              </Field>
            </div>
          </Card>

          {/* Check-in / Check-out */}
          <Card>
            <SectionTitle>Check-in / Check-out</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Check-in desde">
                <Sel value={form.checkin_desde} onChange={e => setForm({ ...form, checkin_desde: e.target.value })}>
                  {POLITICAS_CHECK.checkin.map(h => <option key={h} value={h}>{h} hrs</option>)}
                </Sel>
              </Field>
              <Field label="Check-out hasta">
                <Sel value={form.checkout_hasta} onChange={e => setForm({ ...form, checkout_hasta: e.target.value })}>
                  {POLITICAS_CHECK.checkout.map(h => <option key={h} value={h}>{h} hrs</option>)}
                </Sel>
              </Field>
            </div>
            <Field label="Notas de check-in / instrucciones de llegada">
              <Txta value={form.checkin_notas} onChange={e => setForm({ ...form, checkin_notas: e.target.value })}
                placeholder="Recepción disponible 24h, para llegadas nocturnas llamar al..." rows={2} />
            </Field>
          </Card>

          {/* Precios por noche */}
          <Card>
            <SectionTitle>Rango de precios por noche</SectionTitle>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Precio desde (MXN/noche)">
                <Inp type="number" value={form.precio_noche_desde} onChange={e => setForm({ ...form, precio_noche_desde: e.target.value })} placeholder="500" />
              </Field>
              <Field label="Precio hasta (MXN/noche)">
                <Inp type="number" value={form.precio_noche_hasta} onChange={e => setForm({ ...form, precio_noche_hasta: e.target.value })} placeholder="2500" />
              </Field>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <button type="button"
                onClick={() => setForm({ ...form, desayuno_incluido: !form.desayuno_incluido })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.desayuno_incluido ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                🍳 {form.desayuno_incluido ? "Desayuno incluido ✓" : "Agregar desayuno"}
              </button>
              {form.desayuno_incluido && (
                <div className="flex-1">
                  <Inp type="number" value={form.desayuno_precio} onChange={e => setForm({ ...form, desayuno_precio: e.target.value })}
                    placeholder="Precio desayuno adicional (si aplica)" />
                </div>
              )}
            </div>
          </Card>

          {/* Amenidades del hotel */}
          <Card>
            <SectionTitle>Amenidades del establecimiento</SectionTitle>
            <p className="text-xs text-gray-500 mb-4">Selecciona todo lo que ofrece tu establecimiento — esto aparece en tu perfil público.</p>
            <div className="space-y-4">
              {AMENIDADES_HOTEL.map(({ grupo, opciones }) => (
                <div key={grupo}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{grupo}</p>
                  <div className="flex flex-wrap gap-2">
                    {opciones.map(op => (
                      <button key={op} type="button"
                        onClick={() => {
                          const curr = form.amenidades_hotel || [];
                          setForm({ ...form, amenidades_hotel: curr.includes(op) ? curr.filter(v => v !== op) : [...curr, op] });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          (form.amenidades_hotel || []).includes(op)
                            ? "bg-[#1B5E20] text-white border-[#1B5E20]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20] hover:text-[#1B5E20]"
                        }`}>{op}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Etiquetas */}
          <Card>
            <SectionTitle>Etiquetas del hospedaje</SectionTitle>
            <p className="text-xs text-gray-500 mb-4">Estas etiquetas ayudan a los viajeros a encontrarte por filtros específicos.</p>
            <EtiquetasSelector
              value={form.etiquetas_hospedaje}
              onChange={v => setForm({ ...form, etiquetas_hospedaje: v })}
              grupos={ETIQUETAS_HOSPEDAJE_GRUPOS}
            />
          </Card>

          {/* Políticas */}
          <Card>
            <SectionTitle>Políticas del establecimiento</SectionTitle>
            <div className="space-y-4">
              <Field label="Política de cancelación">
                <Sel value={form.politica_cancelacion} onChange={e => setForm({ ...form, politica_cancelacion: e.target.value })}>
                  <option value="">Selecciona política</option>
                  {POLITICAS_CANCELACION.map(p => <option key={p} value={p}>{p}</option>)}
                </Sel>
              </Field>
              <Field label="Política con menores">
                <Inp value={form.politica_menores} onChange={e => setForm({ ...form, politica_menores: e.target.value })}
                  placeholder="Ej: Menores bienvenidos, cuna disponible sin cargo" />
              </Field>
              <div className="flex items-center gap-3">
                <button type="button"
                  onClick={() => setForm({ ...form, politica_mascotas: !form.politica_mascotas })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.politica_mascotas ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                  🐾 {form.politica_mascotas ? "Se aceptan mascotas ✓" : "No se aceptan mascotas"}
                </button>
              </div>
            </div>
          </Card>

          {/* Reservas en línea */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Reservas en línea</SectionTitle>
              <Toggle
                value={form.reservas_activas}
                onChange={v => setForm({ ...form, reservas_activas: v })}
                labelOn="Activadas"
                labelOff="Desactivadas"
              />
            </div>
            {form.reservas_activas ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Anticipación mínima (días)">
                  <Inp type="number" value={form.reservas_anticipacion_dias}
                    onChange={e => setForm({ ...form, reservas_anticipacion_dias: e.target.value })} placeholder="1" />
                </Field>
                <Field label="Notas para el huésped">
                  <Inp value={form.reservas_notas}
                    onChange={e => setForm({ ...form, reservas_notas: e.target.value })}
                    placeholder="Confirmación en 24h, depósito del 50%..." />
                </Field>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Activa esta opción para recibir reservaciones directamente desde la app.</p>
            )}
          </Card>
        </div>
      )}

      {/* ── Turismo ── */}
      {seccion === "turismo" && es_turismo && (
        <div className="space-y-5">
          <Card>
            <SectionTitle>Categoría del tour / actividad</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Categoría principal">
                <Sel value={form.categoria_turismo}
                  onChange={e => setForm({ ...form, categoria_turismo: e.target.value, subcategoria_turismo: "" })}>
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIAS_TURISMO.map(c => <option key={c} value={c}>{c}</option>)}
                </Sel>
              </Field>
              <Field label="Subcategoría">
                <Sel value={form.subcategoria_turismo}
                  onChange={e => setForm({ ...form, subcategoria_turismo: e.target.value })}
                  disabled={!form.categoria_turismo}>
                  <option value="">Selecciona subcategoría</option>
                  {(SUBCATEGORIAS_TURISMO[form.categoria_turismo] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </Sel>
              </Field>
            </div>
          </Card>

          <Card>
            <SectionTitle>Detalles del tour</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Duración (ej: 3 horas, Día completo)">
                <Inp value={form.duracion_tour} onChange={e => setForm({ ...form, duracion_tour: e.target.value })} placeholder="4 horas" />
              </Field>
              <Field label="Punto de salida / encuentro">
                <Inp value={form.punto_salida} onChange={e => setForm({ ...form, punto_salida: e.target.value })} placeholder="Plaza central, Hotel X..." />
              </Field>
              <Field label="Mín. de personas">
                <Inp type="number" value={form.min_personas} onChange={e => setForm({ ...form, min_personas: e.target.value })} placeholder="1" />
              </Field>
              <Field label="Máx. de personas">
                <Inp type="number" value={form.max_personas} onChange={e => setForm({ ...form, max_personas: e.target.value })} placeholder="12" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Idiomas del guía">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {["Español","Inglés","Francés","Portugués","Alemán"].map(lang => (
                      <button key={lang} type="button"
                        onClick={() => {
                          const curr = form.idiomas_guia || [];
                          setForm({ ...form, idiomas_guia: curr.includes(lang) ? curr.filter(x => x !== lang) : [...curr, lang] });
                        }}
                        className={"px-3 py-1.5 rounded-full text-xs font-medium border transition-colors " + ((form.idiomas_guia || []).includes(lang) ? "bg-[#1B5E20] text-white border-[#1B5E20]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]")}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">¿Qué incluye?</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "incluye_transporte",   label: "Transporte" },
                  { key: "incluye_alimentacion", label: "Alimentación" },
                  { key: "incluye_equipo",       label: "Equipo" },
                  { key: "incluye_guia",         label: "Guía certificado" },
                ].map(({ key, label }) => (
                  <button key={key} type="button"
                    onClick={() => setForm({ ...form, [key]: !form[key] })}
                    className={"px-3 py-1.5 rounded-full text-xs font-medium border transition-colors " + (form[key] ? "bg-[#1B5E20] text-white border-[#1B5E20]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle>Equipamiento y servicios del tour</SectionTitle>
            <p className="text-xs text-gray-500 mb-4">Selecciona todo lo que incluye / ofrece tu tour.</p>
            <div className="space-y-4">
              {AMENIDADES_TOUR.map(({ grupo, opciones }) => (
                <div key={grupo}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{grupo}</p>
                  <div className="flex flex-wrap gap-2">
                    {opciones.map(op => (
                      <button key={op} type="button"
                        onClick={() => {
                          const curr = form.amenidades_tour || [];
                          setForm({ ...form, amenidades_tour: curr.includes(op) ? curr.filter(v => v !== op) : [...curr, op] });
                        }}
                        className={"px-3 py-1.5 rounded-full text-xs font-medium border transition-colors " + ((form.amenidades_tour || []).includes(op) ? "bg-[#1B5E20] text-white border-[#1B5E20]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]")}>
                        {op}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>Etiquetas del tour</SectionTitle>
            <p className="text-xs text-gray-500 mb-4">Ayudan a los turistas a encontrarte por filtros de dificultad, grupo y más.</p>
            <EtiquetasSelector value={form.etiquetas_turismo} onChange={v => setForm({ ...form, etiquetas_turismo: v })} grupos={ETIQUETAS_TURISMO_GRUPOS} />
          </Card>
        </div>
      )}

      {/* ── Transporte ── */}
      {seccion === "transporte" && es_transporte && (
        <div className="space-y-5">
          <Card>
            <SectionTitle>Tipo de servicio de transporte</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Categoría">
                <Sel value={form.categoria_transporte}
                  onChange={e => setForm({ ...form, categoria_transporte: e.target.value, subcategoria_transporte: "" })}>
                  <option value="">Selecciona categoría</option>
                  {CATEGORIAS_TRANSPORTE.map(c => <option key={c} value={c}>{c}</option>)}
                </Sel>
              </Field>
              <Field label="Subcategoría">
                <Sel value={form.subcategoria_transporte}
                  onChange={e => setForm({ ...form, subcategoria_transporte: e.target.value })}
                  disabled={!form.categoria_transporte}>
                  <option value="">Selecciona subcategoría</option>
                  {(SUBCATEGORIAS_TRANSPORTE[form.categoria_transporte] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </Sel>
              </Field>
            </div>
          </Card>

          <Card>
            <SectionTitle>Datos del vehículo / flota</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <Field label="Marca">
                <Inp value={form.marca_vehiculo} onChange={e => setForm({ ...form, marca_vehiculo: e.target.value })} placeholder="Toyota" />
              </Field>
              <Field label="Modelo">
                <Inp value={form.modelo_vehiculo} onChange={e => setForm({ ...form, modelo_vehiculo: e.target.value })} placeholder="Hiace" />
              </Field>
              <Field label="Año">
                <Inp type="number" value={form.anio_vehiculo} onChange={e => setForm({ ...form, anio_vehiculo: e.target.value })} placeholder="2022" />
              </Field>
              <Field label="Capacidad (personas)">
                <Inp type="number" value={form.capacidad_vehiculo} onChange={e => setForm({ ...form, capacidad_vehiculo: e.target.value })} placeholder="8" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Cobertura / Zonas que atiende">
                <Inp value={form.cobertura_zonas} onChange={e => setForm({ ...form, cobertura_zonas: e.target.value })} placeholder="Orizaba, Veracruz, CDMX..." />
              </Field>
              <div className="flex items-end pb-1">
                <Toggle value={form.servicio_24h} onChange={v => setForm({ ...form, servicio_24h: v })} labelOn="Servicio 24 hrs" labelOff="Horario limitado" />
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle>Tarifas</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Tarifa base (MXN)">
                <Inp type="number" value={form.tarifa_base} onChange={e => setForm({ ...form, tarifa_base: e.target.value })} placeholder="300" />
              </Field>
              <Field label="Tarifa por km (MXN, si aplica)">
                <Inp type="number" value={form.tarifa_por_km} onChange={e => setForm({ ...form, tarifa_por_km: e.target.value })} placeholder="5" />
              </Field>
            </div>
          </Card>

          <Card>
            <SectionTitle>Amenidades del vehículo</SectionTitle>
            <p className="text-xs text-gray-500 mb-4">Selecciona todo lo que incluye tu servicio de transporte.</p>
            <div className="space-y-4">
              {AMENIDADES_VEHICULO.map(({ grupo, opciones }) => (
                <div key={grupo}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{grupo}</p>
                  <div className="flex flex-wrap gap-2">
                    {opciones.map(op => (
                      <button key={op} type="button"
                        onClick={() => {
                          const curr = form.amenidades_vehiculo || [];
                          setForm({ ...form, amenidades_vehiculo: curr.includes(op) ? curr.filter(v => v !== op) : [...curr, op] });
                        }}
                        className={"px-3 py-1.5 rounded-full text-xs font-medium border transition-colors " + ((form.amenidades_vehiculo || []).includes(op) ? "bg-[#1B5E20] text-white border-[#1B5E20]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]")}>
                        {op}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>Etiquetas del servicio de transporte</SectionTitle>
            <p className="text-xs text-gray-500 mb-4">Ayudan a los turistas a filtrarte por tipo, capacidad y disponibilidad.</p>
            <EtiquetasSelector value={form.etiquetas_transporte} onChange={v => setForm({ ...form, etiquetas_transporte: v })} grupos={ETIQUETAS_TRANSPORTE_GRUPOS} />
          </Card>
        </div>
      )}

      {/* ── Servicios (genérico) ── */}
      {seccion === "servicios_cfg" && es_servicios && (
        <div className="space-y-5">
          <Card>
            <SectionTitle>Tipo de servicio</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Categoría">
                <Sel value={form.categoria_servicio}
                  onChange={e => setForm({ ...form, categoria_servicio: e.target.value, subcategoria_servicio: "" })}>
                  <option value="">Selecciona categoría</option>
                  {CATEGORIAS_SERVICIOS.map(c => <option key={c} value={c}>{c}</option>)}
                </Sel>
              </Field>
              <Field label="Subcategoría">
                <Sel value={form.subcategoria_servicio}
                  onChange={e => setForm({ ...form, subcategoria_servicio: e.target.value })}
                  disabled={!form.categoria_servicio}>
                  <option value="">Selecciona subcategoría</option>
                  {(SUBCATEGORIAS_SERVICIOS[form.categoria_servicio] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </Sel>
              </Field>
            </div>
          </Card>

          <Card>
            <SectionTitle>Detalles del servicio</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Duración de la sesión">
                <Inp value={form.duracion_sesion} onChange={e => setForm({ ...form, duracion_sesion: e.target.value })} placeholder="1 hora, 90 min..." />
              </Field>
              <Field label="Modalidad">
                <Sel value={form.modalidad_servicio} onChange={e => setForm({ ...form, modalidad_servicio: e.target.value })}>
                  <option value="">Selecciona modalidad</option>
                  {["Presencial","A domicilio","En línea","Mixto"].map(m => <option key={m} value={m}>{m}</option>)}
                </Sel>
              </Field>
              <Field label="Precio por sesión (MXN)">
                <Inp type="number" value={form.precio_sesion} onChange={e => setForm({ ...form, precio_sesion: e.target.value })} placeholder="500" />
              </Field>
              <Field label="Precio por paquete (MXN, opcional)">
                <Inp type="number" value={form.precio_paquete} onChange={e => setForm({ ...form, precio_paquete: e.target.value })} placeholder="2000 (paquete x5)" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Certificaciones / Estudios / Experiencia">
                  <Inp value={form.certificaciones} onChange={e => setForm({ ...form, certificaciones: e.target.value })} placeholder="Ej: Certificado en masajes terapéuticos, 10 años de experiencia..." />
                </Field>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <Toggle value={form.atiende_domicilio} onChange={v => setForm({ ...form, atiende_domicilio: v })} labelOn="Atiende a domicilio" labelOff="Solo en local" />
              <Toggle value={form.requiere_cita} onChange={v => setForm({ ...form, requiere_cita: v })} labelOn="Requiere cita previa" labelOff="Sin cita" />
            </div>
          </Card>

          <Card>
            <SectionTitle>Etiquetas del servicio</SectionTitle>
            <p className="text-xs text-gray-500 mb-4">Ayudan a los clientes a encontrarte por tipo de experiencia, modalidad y más.</p>
            <EtiquetasSelector value={form.etiquetas_servicio} onChange={v => setForm({ ...form, etiquetas_servicio: v })} grupos={ETIQUETAS_SERVICIOS_GRUPOS} />
          </Card>
        </div>
      )}

      {/* ── Operación ── */}
      {seccion === "operacion" && (
        <div className="space-y-5">
          {/* Reservas de mesa */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Reservas de mesa</SectionTitle>
              <Toggle
                value={form.reservas_mesa_activas}
                onChange={v => setForm({ ...form, reservas_mesa_activas: v })}
                labelOn="Activadas"
                labelOff="Desactivadas"
              />
            </div>
            {form.reservas_mesa_activas && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Capacidad máxima (personas)">
                  <Inp type="number" value={form.reservas_mesa_capacidad}
                    onChange={e => setForm({ ...form, reservas_mesa_capacidad: e.target.value })} placeholder="50" />
                </Field>
                <Field label="Notas para el cliente">
                  <Inp value={form.reservas_mesa_notas}
                    onChange={e => setForm({ ...form, reservas_mesa_notas: e.target.value })}
                    placeholder="Mínimo 2 personas, confirma 1h antes" />
                </Field>
              </div>
            )}
            {!form.reservas_mesa_activas && (
              <p className="text-xs text-gray-400">Activa esta opción para que los visitantes puedan reservar mesa desde la app.</p>
            )}
          </Card>

          {/* Pedidos por WhatsApp */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Pedidos por WhatsApp</SectionTitle>
              <Toggle
                value={form.pedidos_whatsapp_activo}
                onChange={v => setForm({ ...form, pedidos_whatsapp_activo: v })}
                labelOn="Activado"
                labelOff="Desactivado"
              />
            </div>
            {form.pedidos_whatsapp_activo ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  El cliente verá un botón para hacer su pedido directamente por WhatsApp al número{" "}
                  <span className="font-semibold text-gray-700">{form.whatsapp || "(configura tu WhatsApp en Información)"}</span>.
                </p>
                <Field label="Mensaje predefinido (opcional)">
                  <Txta value={form.pedidos_whatsapp_mensaje}
                    onChange={e => setForm({ ...form, pedidos_whatsapp_mensaje: e.target.value })}
                    placeholder="Hola, quisiera hacer un pedido..." />
                </Field>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Activa esta opción para recibir pedidos directamente vía WhatsApp.</p>
            )}
          </Card>
        </div>
      )}

      <button type="button" onClick={save} disabled={saving}
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
          <Sel value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: "auto" }}>
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
            <button key={c} type="button" onClick={() => setCategoria(c)}
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
              {!img.es_portada && (
                <button type="button" onClick={() => setPortada(img.id)} className="text-xs bg-amber-400 text-amber-900 px-3 py-1.5 rounded-lg font-semibold">Portada</button>
              )}
              <button type="button" onClick={() => deleteImg(img.id)} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold">Eliminar</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-4 text-center py-16 text-gray-400">
            <p className="text-sm">No hay imágenes en esta categoría</p>
            <p className="text-xs mt-1">Sube fotos para que los visitantes vean tu negocio</p>
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
          <p className="text-sm font-semibold text-gray-800 mb-1">Menú digital externo</p>
          <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0277BD] hover:underline">{menuUrl}</a>
        </Card>
      )}

      <Card>
        <SectionTitle>Nueva categoría de menú</SectionTitle>
        <div className="flex gap-3">
          <Inp value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Ej: Desayunos, Bebidas, Postres, Entradas" />
          <button type="button" onClick={addCat} className="px-4 py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-semibold whitespace-nowrap hover:bg-[#145218]">
            + Agregar
          </button>
        </div>
      </Card>

      {categorias.map(cat => (
        <Card key={cat.id}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">{cat.nombre}</h4>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowItemForm(showItemForm === cat.id ? null : cat.id)}
                className="text-xs px-3 py-1.5 bg-[#1B5E20] text-white rounded-lg font-medium hover:bg-[#145218]">+ Platillo</button>
              <button type="button" onClick={async () => { await axios.delete(`${API}/menu/categorias/${cat.id}`); fetchMenu(); }}
                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Eliminar</button>
            </div>
          </div>

          {showItemForm === cat.id && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100 mb-3">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-2">
                  <Inp value={newItem.nombre} onChange={e => setNewItem({ ...newItem, nombre: e.target.value })} placeholder="Nombre del platillo" />
                </div>
                <Inp type="number" value={newItem.precio} onChange={e => setNewItem({ ...newItem, precio: e.target.value })} placeholder="Precio MXN" />
                <Inp value={newItem.descripcion} onChange={e => setNewItem({ ...newItem, descripcion: e.target.value })} placeholder="Descripción corta" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => addItem(cat.id)} className="flex-1 py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-bold">Agregar</button>
                <button type="button" onClick={() => setShowItemForm(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancelar</button>
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
                <button type="button" onClick={async () => { await axios.put(`${API}/menu/items/${item.id}`, { disponible: !item.disponible }); fetchMenu(); }}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${item.disponible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {item.disponible ? "Disponible" : "Agotado"}
                </button>
                <button type="button" onClick={async () => { await axios.delete(`${API}/menu/items/${item.id}`); fetchMenu(); }}
                  className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {(!cat.items || cat.items.length === 0) && <p className="text-center py-3 text-xs text-gray-400">Sin platillos — agrega el primero</p>}
          </div>
        </Card>
      ))}

      {categorias.length === 0 && (
        <Card className="text-center py-12 text-gray-400">
          <p className="text-sm font-medium mb-1">Tu menú está vacío</p>
          <p className="text-xs">Crea categorías como "Entradas", "Platillos", "Bebidas", "Postres" y agrega tus productos.</p>
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
      const payload = {
        ...form,
        precio: parseFloat(form.precio),
        precio_promocional: form.precio_promocional ? parseFloat(form.precio_promocional) : null,
        capacidad: form.capacidad ? parseInt(form.capacidad) : null,
      };
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
        <button type="button" onClick={() => { setShowForm(!showForm); setEditId(null); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-semibold hover:bg-[#145218]">
          <Plus className="w-4 h-4" /> Nuevo servicio
        </button>
      </div>

      {showForm && (
        <Card className="border-2 border-[#1B5E20]/20">
          <SectionTitle>{editId ? "Editar servicio" : "Nuevo servicio"}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <Field label="Nombre"><Inp value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Tour al volcán" /></Field>
            </div>
            <Field label="Precio (MXN)"><Inp type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} /></Field>
            <Field label="Precio promocional"><Inp type="number" value={form.precio_promocional} onChange={e => setForm({ ...form, precio_promocional: e.target.value })} /></Field>
            <Field label="Duración"><Inp value={form.duracion} onChange={e => setForm({ ...form, duracion: e.target.value })} placeholder="2 horas" /></Field>
            <Field label="Capacidad"><Inp type="number" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} /></Field>
            <div className="sm:col-span-2">
              <Field label="Descripción"><Txta value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></Field>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={save} disabled={saving}
              className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editId ? "Actualizar" : "Crear"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm">Cancelar</button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {servicios.map(s => (
          <Card key={s.id} className="!py-3.5">
            <div className="flex items-center gap-4">
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
                <button type="button"
                  onClick={() => {
                    setForm({ nombre: s.nombre, descripcion: s.descripcion || "", precio: s.precio.toString(), precio_promocional: s.precio_promocional?.toString() || "", duracion: s.duracion || "", capacidad: s.capacidad?.toString() || "" });
                    setEditId(s.id); setShowForm(true);
                  }}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 text-xs font-bold">✏️</button>
                <button type="button"
                  onClick={async () => { await axios.delete(`${API}/prestadores/servicios/${s.id}`); fetchServicios(); }}
                  className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {servicios.length === 0 && (
          <Card className="text-center py-12 text-gray-400">
            <p className="text-sm font-medium mb-1">Sin servicios registrados</p>
            <p className="text-xs">Agrega tus servicios con precio para que los visitantes los vean.</p>
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

  const ESTADO_COLORS = {
    pendiente: "bg-amber-100 text-amber-800",
    aceptada:  "bg-blue-100 text-blue-800",
    completada:"bg-green-100 text-green-800",
    cancelada: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {["pendiente","aceptada","completada","cancelada"].map(e => (
          <button key={e} type="button" onClick={() => setFiltro(e)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filtro === e ? "bg-[#1B5E20] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}>{e}</button>
        ))}
      </div>

      {loading
        ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        : reservas.length === 0
          ? (
            <Card className="text-center py-12 text-gray-400">
              <p className="text-sm font-medium mb-1">Sin reservas {filtro === "pendiente" ? "pendientes" : `"${filtro}"`}</p>
              <p className="text-xs">Las nuevas reservas aparecerán aquí.</p>
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
                      <button type="button" onClick={() => actualizarEstado(r.id, "aceptada")}
                        className="flex-1 py-2 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Aceptar
                      </button>
                      <button type="button" onClick={() => actualizarEstado(r.id, "cancelada")}
                        className="flex-1 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 flex items-center justify-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Rechazar
                      </button>
                    </div>
                  )}
                  {r.estado === "aceptada" && (
                    <button type="button" onClick={() => actualizarEstado(r.id, "completada")}
                      className="w-full py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-200">
                      Marcar como completada
                    </button>
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

  const fetchPromos = async () => {
    const { data } = await axios.get(`${API}/prestadores/${prestadorId}/promociones`);
    setPromos(data.promociones || []);
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/prestadores/${prestadorId}/promociones`, { ...form, descuento_pct: parseInt(form.descuento_pct) });
      toast.success("Promoción creada");
      setShowForm(false);
      setForm({ titulo: "", descripcion: "", descuento_pct: "", fecha_inicio: "", fecha_fin: "" });
      fetchPromos();
    } catch { toast.error("Error guardando"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Promociones y ofertas</h3>
        <button type="button" onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-semibold hover:bg-[#145218]">
          <Plus className="w-4 h-4" /> Nueva promo
        </button>
      </div>

      {showForm && (
        <Card className="border-2 border-[#1B5E20]/20">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <Field label="Título"><Inp value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="10% de descuento fin de semana" /></Field>
            </div>
            <Field label="Descuento (%)"><Inp type="number" value={form.descuento_pct} onChange={e => setForm({ ...form, descuento_pct: e.target.value })} /></Field>
            <Field label="Descripción"><Inp value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></Field>
            <Field label="Fecha inicio"><Inp type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} /></Field>
            <Field label="Fecha fin"><Inp type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} /></Field>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={save} disabled={saving}
              className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Crear
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancelar</button>
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
            <button type="button" onClick={async () => { await axios.delete(`${API}/promociones/${p.id}`); fetchPromos(); }}
              className="absolute bottom-3 right-3 w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {promos.length === 0 && (
          <div className="col-span-2 text-center py-10 text-gray-400">
            <p className="text-sm font-medium mb-1">Sin promociones activas</p>
            <p className="text-xs">Crea ofertas para atraer más visitas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── MÓDULO HABITACIONES ───────────────────────────────────────
const ModuloHabitaciones = ({ prestadorId }) => {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [editId, setEditId] = useState(null);
  const emptyForm = { nombre: "Doble", descripcion: "", precio_noche: "", capacidad: 2, amenidades: [], fotos: [], disponible: true };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchHabs(); }, [prestadorId]);

  const fetchHabs = async () => {
    try {
      const { data } = await axios.get(`${API}/prestadores/${prestadorId}/habitaciones`);
      setHabitaciones(data.habitaciones || []);
    } finally { setLoading(false); }
  };

  const uploadFoto = async (file) => {
    setUploadingFoto(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data: up } = await axios.post(`${API}/public/upload`, fd);
      setForm(f => ({ ...f, fotos: [...f.fotos, up.url] }));
      toast.success("Foto agregada");
    } catch { toast.error("Error subiendo foto"); }
    finally { setUploadingFoto(false); }
  };

  const save = async () => {
    if (!form.nombre || !form.precio_noche) return toast.error("Nombre y precio requeridos");
    setSaving(true);
    try {
      const payload = { ...form, precio_noche: parseFloat(form.precio_noche), capacidad: parseInt(form.capacidad) };
      if (editId) await axios.put(`${API}/habitaciones/${editId}`, payload);
      else await axios.post(`${API}/prestadores/${prestadorId}/habitaciones`, payload);
      toast.success(editId ? "Habitación actualizada" : "Habitación agregada");
      setShowForm(false); setForm(emptyForm); setEditId(null); fetchHabs();
    } catch { toast.error("Error guardando"); }
    finally { setSaving(false); }
  };

  const toggleAmenidad = (am) => {
    const curr = form.amenidades || [];
    setForm({ ...form, amenidades: curr.includes(am) ? curr.filter(a => a !== am) : [...curr, am] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Tipos de habitación</h3>
          <p className="text-xs text-gray-500 mt-0.5">Configura cada tipo de habitación con sus amenidades y precio por noche</p>
        </div>
        <button type="button" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-semibold hover:bg-[#145218]">
          <Plus className="w-4 h-4" /> Nueva habitación
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card className="border-2 border-[#1B5E20]/20">
          <SectionTitle>{editId ? "Editar habitación" : "Nueva habitación"}</SectionTitle>
          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Tipo de habitación</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS_HABITACION.map(t => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, nombre: t })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.nombre === t ? "bg-[#1B5E20] text-white border-[#1B5E20]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]"}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <Inp value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="O escribe un nombre personalizado..." />
              </div>
            </div>

            {/* Precio y capacidad */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Precio por noche (MXN) *">
                <Inp type="number" value={form.precio_noche} onChange={e => setForm({ ...form, precio_noche: e.target.value })} placeholder="800" />
              </Field>
              <Field label="Capacidad (personas)">
                <Inp type="number" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} min="1" max="20" />
              </Field>
            </div>

            {/* Descripción */}
            <Field label="Descripción">
              <Txta value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Vista a la montaña, cama king size, baño con tina..." rows={2} />
            </Field>

            {/* Amenidades */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Amenidades de la habitación</label>
              <div className="flex flex-wrap gap-2">
                {AMENIDADES_HABITACION.map(am => (
                  <button key={am} type="button" onClick={() => toggleAmenidad(am)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      (form.amenidades || []).includes(am)
                        ? "bg-[#1B5E20] text-white border-[#1B5E20]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]"
                    }`}>{am}</button>
                ))}
              </div>
            </div>

            {/* Fotos */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Fotos de la habitación</label>
              <div className="flex items-center gap-3 flex-wrap">
                {form.fotos.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} className="w-16 h-16 rounded-lg object-cover" alt="" />
                    <button type="button" onClick={() => setForm({ ...form, fotos: form.fotos.filter((_, idx) => idx !== i) })}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                  </div>
                ))}
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:bg-gray-50">
                  {uploadingFoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "📷"}
                  {uploadingFoto ? "Subiendo..." : "Agregar foto"}
                  <input type="file" accept="image/*" className="hidden" onChange={e => uploadFoto(e.target.files[0])} disabled={uploadingFoto} />
                </label>
              </div>
            </div>

            {/* Disponible */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm({ ...form, disponible: !form.disponible })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.disponible ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                {form.disponible ? "✓ Disponible" : "✗ No disponible"}
              </button>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button type="button" onClick={save} disabled={saving}
              className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId ? "Actualizar" : "Agregar habitación"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm">Cancelar</button>
          </div>
        </Card>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : habitaciones.length === 0 && !showForm ? (
        <Card className="text-center py-12 text-gray-400">
          <p className="text-2xl mb-2">🛏️</p>
          <p className="text-sm font-medium mb-1">Sin habitaciones configuradas</p>
          <p className="text-xs">Agrega los tipos de habitación que ofreces con su precio y amenidades.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {habitaciones.map(h => (
            <Card key={h.id} className={!h.disponible ? "opacity-60" : ""}>
              {/* Fotos */}
              {h.fotos?.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto">
                  {h.fotos.map((url, i) => (
                    <img key={i} src={url} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" alt="" />
                  ))}
                </div>
              )}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{h.nombre}</h4>
                  <p className="text-xs text-gray-500">👥 {h.capacidad} personas</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#1B5E20]">${h.precio_noche}</p>
                  <p className="text-[10px] text-gray-400">por noche</p>
                </div>
              </div>
              {h.descripcion && <p className="text-xs text-gray-600 mb-2">{h.descripcion}</p>}
              {h.amenidades?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {h.amenidades.slice(0, 6).map(a => (
                    <span key={a} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{a}</span>
                  ))}
                  {h.amenidades.length > 6 && <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">+{h.amenidades.length - 6} más</span>}
                </div>
              )}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button type="button"
                  onClick={async () => { await axios.put(`${API}/habitaciones/${h.id}`, { disponible: !h.disponible }); fetchHabs(); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${h.disponible ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {h.disponible ? "Disponible" : "No disponible"}
                </button>
                <button type="button"
                  onClick={() => { setForm({ ...h, precio_noche: h.precio_noche.toString(), capacidad: h.capacidad.toString() }); setEditId(h.id); setShowForm(true); }}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200">✏️</button>
                <button type="button"
                  onClick={async () => { await axios.delete(`${API}/habitaciones/${h.id}`); fetchHabs(); }}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs hover:bg-red-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ── MÓDULO MENSAJES ───────────────────────────────────────────
const ModuloMensajes = ({ prestadorId }) => {
  const [conversaciones, setConversaciones] = useState([]);
  const [activa,         setActiva]         = useState(null); // { turista_id, turista_nombre }
  const [mensajes,       setMensajes]       = useState([]);
  const [texto,          setTexto]          = useState("");
  const [loading,        setLoading]        = useState(true);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);
  const [sending,        setSending]        = useState(false);
  const [noLeidos,       setNoLeidos]       = useState(0);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Cargar lista de conversaciones
  const fetchConversaciones = async () => {
    try {
      const { data } = await axios.get(`${API}/prestadores/${prestadorId}/conversaciones`);
      setConversaciones(data.conversaciones || []);
      setNoLeidos((data.conversaciones || []).reduce((s, c) => s + (c.no_leidos || 0), 0));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConversaciones(); }, [prestadorId]);

  // Polling de conversaciones cada 15s
  useEffect(() => {
    const t = setInterval(fetchConversaciones, 15000);
    return () => clearInterval(t);
  }, [prestadorId]);

  // Cargar mensajes de la conversación activa
  const abrirConversacion = async (conv) => {
    setActiva(conv);
    setLoadingMsgs(true);
    try {
      // El prestador ve los mensajes del turista con su prestadorId
      const { data } = await axios.get(`${API}/mensajes/${prestadorId}`, {
        params: { turista_id: conv.turista_id }
      });
      setMensajes(data.mensajes || []);
      // Marcar como leídos desde el lado del prestador
      await axios.put(`${API}/mensajes/${prestadorId}/leer`, {
        turista_id: conv.turista_id,
        lector: "prestador",
      }).catch(() => {});
      // Actualizar contador
      setConversaciones(prev => prev.map(c =>
        c.turista_id === conv.turista_id ? { ...c, no_leidos: 0 } : c
      ));
      setNoLeidos(prev => Math.max(0, prev - (conv.no_leidos || 0)));
    } catch (e) { console.error(e); }
    finally { setLoadingMsgs(false); }
  };

  // Polling mensajes cuando hay conversación activa
  useEffect(() => {
    if (!activa) return;
    const t = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API}/mensajes/${prestadorId}`, {
          params: { turista_id: activa.turista_id }
        });
        setMensajes(data.mensajes || []);
      } catch {}
    }, 8000);
    return () => clearInterval(t);
  }, [activa, prestadorId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    if (activa) inputRef.current?.focus();
  }, [activa]);

  const enviar = async () => {
    if (!texto.trim() || sending || !activa) return;
    const textoEnviar = texto.trim();
    setTexto("");
    setSending(true);
    try {
      const { data } = await axios.post(`${API}/mensajes/${prestadorId}`, {
        texto:          textoEnviar,
        turista_id:     activa.turista_id,
        remitente:      "prestador",
        turista_nombre: activa.turista_nombre,
      });
      setMensajes(prev => [...prev, data]);
    } catch {
      setTexto(textoEnviar);
    } finally { setSending(false); }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  const formatHora = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  const formatFechaRelativa = (iso) => {
    if (!iso) return "";
    const d  = new Date(iso);
    const hoy = new Date();
    const diff = Math.floor((hoy - d) / 86400000);
    if (diff === 0) return `Hoy ${formatHora(iso)}`;
    if (diff === 1) return `Ayer ${formatHora(iso)}`;
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          Mensajes de clientes
          {noLeidos > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{noLeidos}</span>
          )}
        </h3>
        <button type="button" onClick={fetchConversaciones}
          className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
          Actualizar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex"
        style={{ height: "560px" }}>

        {/* ── Lista de conversaciones (columna izq) ── */}
        <div className={`flex-shrink-0 border-r border-gray-100 flex flex-col ${activa ? "hidden sm:flex w-64" : "w-full sm:w-64"}`}>
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Conversaciones</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : conversaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">Sin mensajes aún</p>
                <p className="text-xs text-gray-400">Cuando un visitante te escriba, aparecerá aquí</p>
              </div>
            ) : (
              conversaciones.map(conv => (
                <button key={conv.turista_id} type="button"
                  onClick={() => abrirConversacion(conv)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                    activa?.turista_id === conv.turista_id ? "bg-green-50 border-l-2 border-l-[#1B5E20]" : ""
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1B5E20] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {conv.turista_nombre?.[0]?.toUpperCase() || "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{conv.turista_nombre || "Visitante"}</p>
                        {conv.no_leidos > 0 && (
                          <span className="bg-[#1B5E20] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {conv.no_leidos}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{conv.ultimo_mensaje || "..."}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">{formatFechaRelativa(conv.updated_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Panel de chat (columna der) ── */}
        <div className={`flex-1 flex flex-col ${!activa ? "hidden sm:flex" : "flex"}`}>
          {!activa ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-8">
              <MessageCircle className="w-12 h-12 text-gray-200" />
              <p className="text-sm font-semibold text-gray-400">Selecciona una conversación</p>
              <p className="text-xs text-gray-300">Haz clic en un cliente para ver y responder sus mensajes</p>
            </div>
          ) : (
            <>
              {/* Header del chat */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
                <button type="button" onClick={() => setActiva(null)}
                  className="sm:hidden w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 mr-1">
                  ←
                </button>
                <div className="w-9 h-9 rounded-full bg-[#1B5E20] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {activa.turista_nombre?.[0]?.toUpperCase() || "T"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{activa.turista_nombre || "Visitante"}</p>
                  <p className="text-xs text-gray-400">{activa.turista_email || ""}</p>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                {loadingMsgs ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : mensajes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                    <p className="text-sm text-gray-400">Sin mensajes en esta conversación</p>
                  </div>
                ) : (
                  mensajes.map(m => {
                    const esPrestador = m.remitente === "prestador";
                    return (
                      <div key={m.id} className={`flex ${esPrestador ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          esPrestador
                            ? "bg-[#1B5E20] text-white rounded-br-sm"
                            : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm"
                        }`}>
                          <p>{m.texto}</p>
                          <p className={`text-[10px] mt-1 ${esPrestador ? "text-white/60 text-right" : "text-gray-400"}`}>
                            {formatHora(m.created_at)}
                            {esPrestador && (m.leido ? " ✓✓" : " ✓")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input respuesta */}
              <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0">
                <textarea
                  ref={inputRef}
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`Responder a ${activa.turista_nombre || "el visitante"}...`}
                  rows={1}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-[#1B5E20] max-h-24"
                  style={{ minHeight: "40px" }}
                />
                <button type="button" onClick={enviar} disabled={!texto.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-[#1B5E20] flex items-center justify-center text-white flex-shrink-0 hover:bg-[#145218] disabled:opacity-40 transition-all">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
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
    { label: "Visitas al perfil",   value: data?.visitas || 0,                        color: "bg-blue-500" },
    { label: "Clicks en contacto",  value: data?.contactos || 0,                      color: "bg-green-500" },
    { label: "Reservas totales",    value: data?.reservas?.total || 0,                color: "bg-purple-500" },
    { label: "Pendientes",          value: data?.reservas?.pendientes || 0,           color: "bg-amber-500" },
    { label: "Completadas",         value: data?.reservas?.completadas || 0,          color: "bg-emerald-500" },
    { label: "Período",             value: `${data?.periodo_dias || 30} días`,        color: "bg-gray-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, color }) => (
          <Card key={label}>
            <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
            <div className={`h-1 rounded-full mt-3 ${color} opacity-60`} />
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
  const [uploading, setUploading] = useState(null);

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
      <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center text-2xl font-black text-gray-400 mb-4">?</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Sin perfil de prestador</h2>
      <p className="text-gray-500 text-sm">Contacta al administrador para activar tu cuenta.</p>
    </div>
  );

  const tipoConfig = TIPOS_PRESTADOR[prestador.tipo?.toUpperCase()] || TIPOS_PRESTADOR.default;
  const tabs = tipoConfig.tabs;
  const inicial = prestador.nombre?.charAt(0)?.toUpperCase() || "N";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Foto / iniciales */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
              {prestador.foto_url || prestador.logo_url
                ? <img src={prestador.foto_url || prestador.logo_url} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 text-lg bg-green-50 text-[#1B5E20]">
                    {inicial}
                  </div>}
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
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                    prestador.esta_abierto ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${prestador.esta_abierto ? "bg-green-500" : "bg-red-500"}`} />
                    {prestador.esta_abierto ? "Abierto" : "Cerrado"}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{tipoConfig.label} · Panel de gestión</p>
            </div>

            {/* Acciones header */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button type="button" onClick={() => navigate("/")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Inicio
              </button>
              <button type="button" onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-100 hover:bg-red-50 transition-colors">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto border-t border-gray-100" style={{ scrollbarWidth: "none" }}>
          {tabs.map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
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
        {tab === "habitaciones" && <ModuloHabitaciones prestadorId={prestador.id} />}
        {tab === "flota" && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm font-medium mb-1">Módulo de flota</p>
            <p className="text-xs">Próximamente disponible</p>
          </div>
        )}
        {tab === "promociones"  && <ModuloPromociones prestadorId={prestador.id} />}
        {tab === "mensajes"     && <ModuloMensajes prestadorId={prestador.id} />}
        {tab === "resenas" && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm font-medium mb-1">Reseñas de clientes</p>
            <p className="text-xs">Próximamente disponible</p>
          </div>
        )}
        {tab === "analiticas"   && <ModuloAnaliticas prestadorId={prestador.id} />}
      </main>
    </div>
  );
};

export default PrestadorDashboard;