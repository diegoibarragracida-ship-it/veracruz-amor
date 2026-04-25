import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import { X, Send, MessageCircle, Loader2, Bot, User, Minimize2, MapPin } from "lucide-react";

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