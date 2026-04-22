import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import { X, Send, MessageCircle, Loader2, Bot, User, Minimize2, MapPin, Package, Sparkles } from "lucide-react";

const getSessionId = () => {
  let id = localStorage.getItem("vcai_session_id");
  if (!id) {
    id = "vc_" + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("vcai_session_id", id);
  }
  return id;
};

const SUGERENCIAS = [
  "🗺️ Ruta 3 días por Orizaba",
  "🌊 Playas cerca de Veracruz puerto",
  "🧳 Paquete familiar Xalapa",
  "☕ Ruta del café en Coatepec",
  "🏛️ Pueblos Mágicos de Veracruz",
  "🎒 Aventura en Los Tuxtlas",
];

// Genera paquete turístico usando la API de Claude con datos reales de la BD
const generarPaquete = async (prompt, contextData) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `Eres VeraCruz AI, asistente turístico oficial del estado de Veracruz, México.
Genera paquetes turísticos REALES basados en los datos de la plataforma.

DATOS DISPONIBLES:
${contextData}

INSTRUCCIONES:
- Usa SOLO prestadores, eventos y lugares de los datos anteriores
- Sé específico: menciona nombres reales, precios, horarios
- Formato atractivo con emojis
- Estructura clara: Día 1, Día 2, etc.
- Incluye hospedaje, gastronomía y actividades
- Agrega tips prácticos al final
- Responde siempre en español`,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || "No pude generar el paquete. Intenta de nuevo.";
};

const ChatBot = () => {
  const [open, setOpen]             = useState(false);
  const [minimized, setMinimized]   = useState(false);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [sessionId]                 = useState(getSessionId);
  const [unread, setUnread]         = useState(0);
  const [welcomed, setWelcomed]     = useState(false);
  const [modo, setModo]             = useState("chat"); // "chat" | "paquete"
  const [bdData, setBdData]         = useState(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Cargar datos de la BD para los paquetes
  useEffect(() => {
    const loadBdData = async () => {
      try {
        const [prestRes, eventRes, municipiosRes] = await Promise.all([
          axios.get(`${API}/prestadores`, { params: { verificado: true, limit: 50 } }).catch(() => ({ data: { prestadores: [] } })),
          axios.get(`${API}/eventos`, { params: { publicado: true, limit: 20 } }).catch(() => ({ data: { eventos: [] } })),
          axios.get(`${API}/municipios`, { params: { estado: "publicado", limit: 30 } }).catch(() => ({ data: { municipios: [] } })),
        ]);

        const prestadores = (prestRes.data.prestadores || []).map(p =>
          `- ${p.nombre} (${p.tipo}${p.subtipo ? `/${p.subtipo}` : ""}) en ${p.municipio_nombre || "Veracruz"}${p.precio_min ? ` desde $${p.precio_min}` : ""}${p.horarios ? ` | Horario: ${p.horarios}` : ""}`
        ).join("\n");

        const eventos = (eventRes.data.eventos || []).map(e =>
          `- ${e.nombre} (${e.tipo}) el ${e.fecha_inicio}${e.lugar ? ` en ${e.lugar}` : ""}${e.es_gratis ? " | Gratis" : e.precio_min ? ` | $${e.precio_min}` : ""}`
        ).join("\n");

        const municipios = (municipiosRes.data.municipios || []).map(m =>
          `- ${m.nombre} (${m.region || "Veracruz"})${m.descripcion ? `: ${m.descripcion.slice(0, 100)}...` : ""}`
        ).join("\n");

        setBdData(`PRESTADORES VERIFICADOS:\n${prestadores}\n\nEVENTOS PRÓXIMOS:\n${eventos}\n\nMUNICIPIOS PUBLICADOS:\n${municipios}`);
      } catch {}
    };
    loadBdData();
  }, []);

  useEffect(() => {
    if (open && !welcomed) {
      setWelcomed(true);
      setMessages([{
        role: "assistant",
        content: "¡Hola! 👋 Soy **VeraCruz AI**, tu asistente turístico oficial.\n\nPuedo ayudarte a:\n• 🗺️ **Planear rutas** por los 232 municipios\n• 🧳 **Generar paquetes** con hoteles y restaurantes reales\n• 📅 **Encontrar eventos** y festividades\n• 🏨 **Recomendar hospedajes** verificados\n\n¿Por dónde empezamos?",
        ts: Date.now(),
      }]);
    }
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 300); }
  }, [open, welcomed]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { role: "user", content: msg, ts: Date.now() }]);
    setInput("");
    setLoading(true);

    try {
      let responseText = "";

      // Detectar si pide paquete/itinerario/ruta
      const esPaquete = /paquete|itinerario|ruta|días?|d[ií]as?|plan|viaje|trip|hospedaje.*restaurante|familia|pareja|amigos/i.test(msg);

      if (esPaquete && bdData) {
        // Generar con IA usando datos reales
        responseText = await generarPaquete(msg, bdData);
      } else {
        // Chat normal con el backend
        const { data } = await axios.post(`${API}/chat`, {
          message: msg,
          session_id: sessionId,
          lang: "es",
        });
        responseText = data.response;
      }

      setMessages(prev => [...prev, { role: "assistant", content: responseText, ts: Date.now(), esPaquete }]);
      if (!open) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Lo siento, hubo un error. Intenta de nuevo en un momento.",
        ts: Date.now(), error: true,
      }]);
    } finally { setLoading(false); }
  };

  const generarPaqueteDirecto = async (tipo) => {
    const prompts = {
      familia:  "Genera un paquete turístico de 3 días para familia con niños en Veracruz. Incluye hospedaje, restaurantes y actividades familiares.",
      pareja:   "Genera un paquete romántico de 2 noches para pareja en Veracruz. Incluye hotel boutique, restaurantes románticos y actividades.",
      aventura: "Genera un paquete de aventura de 3 días en Veracruz. Incluye ecoturismo, senderismo, actividades extremas y hospedaje.",
      cultural: "Genera un paquete cultural de 3 días visitando Pueblos Mágicos y zonas arqueológicas de Veracruz.",
    };
    setModo("chat");
    await sendMessage(prompts[tipo]);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderText = (text) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={j}>{part.slice(2, -2)}</strong>
              : part
          )}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Burbuja flotante */}
      <button
        onClick={() => { setOpen(true); setMinimized(false); }}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl bg-[#1B5E20] hover:bg-[#145218] flex items-center justify-center transition-all duration-300 ${open && !minimized ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"}`}
        style={{ boxShadow: "0 8px 32px rgba(27,94,32,0.45)" }}>
        <MessageCircle className="w-7 h-7 text-white" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unread}</span>
        )}
      </button>

      {/* Ventana */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-white border border-gray-200 transition-all duration-300 origin-bottom-right ${open ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"} ${minimized ? "h-14" : "h-[600px]"}`}
        style={{ width: "380px", maxWidth: "calc(100vw - 2rem)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1B5E20] flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-none">VeraCruz AI</p>
            <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Con datos reales de la plataforma
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimized(m => !m)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <Minimize2 className="w-4 h-4" />
            </button>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Tabs modo */}
            <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
              <button onClick={() => setModo("chat")}
                className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${modo === "chat" ? "text-[#1B5E20] border-b-2 border-[#1B5E20]" : "text-gray-400 hover:text-gray-600"}`}>
                <MessageCircle className="w-3.5 h-3.5" /> Chat
              </button>
              <button onClick={() => setModo("paquete")}
                className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${modo === "paquete" ? "text-[#1B5E20] border-b-2 border-[#1B5E20]" : "text-gray-400 hover:text-gray-600"}`}>
                <Package className="w-3.5 h-3.5" /> Paquetes con IA ✨
              </button>
            </div>

            {modo === "paquete" ? (
              /* ── Panel de paquetes ── */
              <div className="flex-1 overflow-y-auto p-4 bg-[#F8F9FA]">
                <p className="text-xs text-gray-500 text-center mb-4 font-medium">
                  ✨ Generados con IA usando datos reales de la plataforma
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { tipo: "familia",  emoji: "👨‍👩‍👧", label: "Paquete Familiar",    sub: "3 días con niños" },
                    { tipo: "pareja",   emoji: "💑",      label: "Escapada Romántica", sub: "2 noches" },
                    { tipo: "aventura", emoji: "🧗",      label: "Aventura & Eco",     sub: "3 días activos" },
                    { tipo: "cultural", emoji: "🏛️",      label: "Ruta Cultural",      sub: "Pueblos Mágicos" },
                  ].map(({ tipo, emoji, label, sub }) => (
                    <button key={tipo} onClick={() => generarPaqueteDirecto(tipo)}
                      disabled={loading}
                      className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#1B5E20] hover:bg-green-50 transition-all text-center disabled:opacity-50 group">
                      <span className="text-3xl group-hover:scale-110 transition-transform">{emoji}</span>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-xs text-gray-400 text-center mb-2">O describe tu viaje ideal:</p>
                  <textarea
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ej: Viaje de 4 días para 2 adultos con presupuesto medio, me gusta la naturaleza y la gastronomía..."
                    rows={3}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-[#1B5E20]"
                  />
                  <button onClick={() => { setModo("chat"); sendMessage(); }}
                    disabled={!input.trim() || loading}
                    className="mt-2 w-full py-2.5 rounded-xl bg-[#1B5E20] text-white text-xs font-bold hover:bg-[#145218] disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Generar paquete personalizado
                  </button>
                </div>
              </div>
            ) : (
              /* ── Panel de chat ── */
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#F8F9FA]">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${msg.role === "user" ? "bg-[#0277BD]" : "bg-[#1B5E20]"}`}>
                        {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`max-w-[78%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user" ? "bg-[#0277BD] text-white rounded-br-sm"
                          : msg.error ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-sm"
                          : msg.esPaquete ? "bg-white text-gray-800 shadow-sm border border-green-200 rounded-bl-sm"
                          : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                      }`}>
                        {msg.esPaquete && <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold mb-1.5"><Sparkles className="w-3 h-3" />Paquete generado con IA</div>}
                        {renderText(msg.content)}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1B5E20] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-[#1B5E20] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-[#1B5E20] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-[#1B5E20] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {messages.length <= 1 && (
                  <div className="px-4 pb-2 bg-[#F8F9FA] flex flex-wrap gap-1.5">
                    {SUGERENCIAS.map(s => (
                      <button key={s} onClick={() => sendMessage(s)}
                        className="text-xs px-3 py-1.5 bg-white border border-[#1B5E20]/30 text-[#1B5E20] rounded-full hover:bg-[#1B5E20] hover:text-white transition-colors font-medium">
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div className="px-3 py-3 bg-white border-t border-gray-100 flex items-end gap-2">
                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Pregunta sobre Veracruz o pide un paquete..."
                    rows={1} disabled={loading}
                    className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B5E20] disabled:opacity-50 max-h-28"
                    style={{ minHeight: "42px" }}
                    onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 112) + "px"; }} />
                  <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-xl bg-[#1B5E20] hover:bg-[#145218] disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
                    {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                  </button>
                </div>

                <p className="text-center text-[10px] text-gray-400 pb-2 bg-white">
                  VeraCruz AI · Gobierno del Estado de Veracruz
                </p>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ChatBot;

// Genera o recupera session_id persistente
const getSessionId = () => {
  let id = localStorage.getItem("vcai_session_id");
  if (!id) {
    id = "vc_" + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("vcai_session_id", id);
  }
  return id;
};

const SUGERENCIAS = [
  "¿Qué hacer en Orizaba?",
  "Ruta 3 días por Xalapa",
  "Pueblos Mágicos de Veracruz",
  "Playas cerca de Veracruz puerto",
];

const ChatBot = () => {
  const [open, setOpen]           = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [sessionId]               = useState(getSessionId);
  const [unread, setUnread]       = useState(0);
  const [welcomed, setWelcomed]   = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Mensaje de bienvenida al abrir por primera vez
  useEffect(() => {
    if (open && !welcomed) {
      setWelcomed(true);
      setMessages([{
        role: "assistant",
        content: "¡Hola! 👋 Soy **VeraCruz AI**, tu asistente turístico oficial.\n\nPuedo ayudarte a planear rutas, encontrar hoteles, restaurantes, eventos y mucho más sobre los 232 municipios de Veracruz. ¿Por dónde empezamos?",
        ts: Date.now(),
      }]);
    }
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, welcomed]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg = { role: "user", content: msg, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/chat`, {
        message: msg,
        session_id: sessionId,
        lang: "es",
      });

      const botMsg = { role: "assistant", content: data.response, ts: Date.now() };
      setMessages((prev) => [...prev, botMsg]);

      if (!open) setUnread((n) => n + 1);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, hubo un error. Intenta de nuevo en un momento.", ts: Date.now(), error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Renderiza texto con **negrita** básica
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );
  };

  return (
    <>
      {/* ── Burbuja flotante ── */}
      <button
        onClick={() => { setOpen(true); setMinimized(false); }}
        aria-label="Abrir asistente VeraCruz AI"
        className={`
          fixed bottom-6 right-6 z-50
          w-16 h-16 rounded-full shadow-2xl
          bg-[#1B5E20] hover:bg-[#145218]
          flex items-center justify-center
          transition-all duration-300
          ${open && !minimized ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"}
        `}
        style={{ boxShadow: "0 8px 32px rgba(27,94,32,0.45)" }}
      >
        <MessageCircle className="w-7 h-7 text-white" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>

      {/* ── Ventana del chat ── */}
      <div
        className={`
          fixed bottom-6 right-6 z-50
          flex flex-col
          rounded-2xl overflow-hidden shadow-2xl
          bg-white border border-gray-200
          transition-all duration-300 origin-bottom-right
          ${open ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}
          ${minimized ? "h-14" : "h-[560px]"}
        `}
        style={{ width: "360px", maxWidth: "calc(100vw - 2rem)", boxShadow: "0 12px 48px rgba(0,0,0,0.18)" }}
      >

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1B5E20] flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-none">VeraCruz AI</p>
            <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Asistente turístico oficial
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized((m) => !m)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Minimizar"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#F8F9FA]">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`
                    w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold
                    ${msg.role === "user" ? "bg-[#0277BD]" : "bg-[#1B5E20]"}
                  `}>
                    {msg.role === "user"
                      ? <User className="w-4 h-4" />
                      : <Bot className="w-4 h-4" />
                    }
                  </div>

                  {/* Burbuja */}
                  <div className={`
                    max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${msg.role === "user"
                      ? "bg-[#0277BD] text-white rounded-br-sm"
                      : msg.error
                        ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-sm"
                        : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                    }
                  `}>
                    {renderText(msg.content)}
                  </div>
                </div>
              ))}

              {/* Indicador de escritura */}
              {loading && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#1B5E20] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#1B5E20] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-[#1B5E20] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-[#1B5E20] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Sugerencias rápidas (solo al inicio) */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 bg-[#F8F9FA] flex flex-wrap gap-1.5">
                {SUGERENCIAS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-3 py-1.5 bg-white border border-[#1B5E20]/30 text-[#1B5E20] rounded-full hover:bg-[#1B5E20] hover:text-white transition-colors font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 bg-white border-t border-gray-100 flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Pregunta sobre Veracruz..."
                rows={1}
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] disabled:opacity-50 max-h-28 leading-relaxed"
                style={{ minHeight: "42px" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 112) + "px";
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-[#1B5E20] hover:bg-[#145218] disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Enviar mensaje"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white" />
                }
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-[10px] text-gray-400 pb-2 bg-white">
              VeraCruz AI · Gobierno del Estado de Veracruz
            </p>
          </>
        )}
      </div>
    </>
  );
};

export default ChatBot;