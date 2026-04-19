import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API, useAuth } from "@/App";
import { MessageCircle, X, Send, Loader2, ChevronDown } from "lucide-react";

/**
 * ChatPrestador — botón flotante + panel de chat
 * Props:
 *   prestadorId  — string
 *   prestadorNombre — string
 *   color        — color del tipo
 */
const ChatPrestador = ({ prestadorId, prestadorNombre, color = "#1565C0" }) => {
  const { isAuthenticated, user } = useAuth();
  const [abierto,    setAbierto]    = useState(false);
  const [mensajes,   setMensajes]   = useState([]);
  const [texto,      setTexto]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [sending,    setSending]    = useState(false);
  const [noLeidos,   setNoLeidos]   = useState(0);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Cargar mensajes al abrir
  useEffect(() => {
    if (!abierto || !isAuthenticated) return;
    const fetchMensajes = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/mensajes/${prestadorId}`);
        setMensajes(data.mensajes || []);
        // Marcar como leídos
        await axios.put(`${API}/mensajes/${prestadorId}/leer`, {
          turista_id: user?.user_id,
        }).catch(() => {});
        setNoLeidos(0);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };
    fetchMensajes();
    inputRef.current?.focus();
  }, [abierto, isAuthenticated, prestadorId]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // Polling cada 8 segundos cuando está abierto
  useEffect(() => {
    if (!abierto || !isAuthenticated) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API}/mensajes/${prestadorId}`);
        setMensajes(data.mensajes || []);
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [abierto, isAuthenticated, prestadorId]);

  // Contar no leídos cuando está cerrado
  useEffect(() => {
    if (abierto || !isAuthenticated) return;
    const check = async () => {
      try {
        const { data } = await axios.get(`${API}/mensajes/${prestadorId}/no-leidos`);
        setNoLeidos(data.count || 0);
      } catch {}
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [abierto, isAuthenticated, prestadorId]);

  const enviar = async () => {
    if (!texto.trim() || sending) return;
    if (!isAuthenticated) {
      alert("Inicia sesión para enviar mensajes");
      return;
    }
    setSending(true);
    const textoEnviar = texto.trim();
    setTexto("");
    try {
      const { data } = await axios.post(`${API}/mensajes/${prestadorId}`, {
        texto: textoEnviar,
        turista_nombre: user?.nombre || "Turista",
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
    const d = new Date(iso);
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  const formatFecha = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const hoy = new Date();
    if (d.toDateString() === hoy.toDateString()) return "Hoy";
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  // Agrupar mensajes por fecha
  const mensajesPorFecha = mensajes.reduce((acc, m) => {
    const fecha = formatFecha(m.created_at);
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(m);
    return acc;
  }, {});

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-white font-semibold text-sm shadow-2xl hover:opacity-90 transition-all hover:scale-105"
        style={{ backgroundColor: color }}>
        <MessageCircle className="w-5 h-5" />
        Chatear
        {noLeidos > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {noLeidos}
          </span>
        )}
      </button>

      {/* Panel de chat */}
      {abierto && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: "480px", animation: "slideUp .2s ease-out" }}>
          <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0"
            style={{ backgroundColor: color }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                {prestadorNombre?.[0]?.toUpperCase() || "P"}
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">{prestadorNombre}</p>
                <p className="text-white/70 text-xs">Responde en breve</p>
              </div>
            </div>
            <button onClick={() => setAbierto(false)}
              className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <MessageCircle className="w-10 h-10 text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">Inicia sesión para chatear</p>
                <a href="/login" className="text-xs font-bold px-4 py-2 rounded-xl text-white hover:opacity-90"
                  style={{ backgroundColor: color }}>
                  Iniciar sesión
                </a>
              </div>
            ) : mensajes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <MessageCircle className="w-8 h-8 text-gray-300" />
                <p className="text-sm text-gray-500">¡Saluda al prestador!</p>
                <p className="text-xs text-gray-400">Pregunta lo que necesites</p>
              </div>
            ) : (
              Object.entries(mensajesPorFecha).map(([fecha, msgs]) => (
                <div key={fecha}>
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">{fecha}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  {msgs.map(m => {
                    const esMio = m.remitente === "turista";
                    return (
                      <div key={m.id} className={`flex mb-2 ${esMio ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          esMio
                            ? "text-white rounded-br-sm"
                            : "bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm"
                        }`}
                        style={esMio ? { backgroundColor: color } : {}}>
                          <p>{m.texto}</p>
                          <p className={`text-[10px] mt-1 ${esMio ? "text-white/60 text-right" : "text-gray-400"}`}>
                            {formatHora(m.created_at)}
                            {esMio && (m.leido ? " ✓✓" : " ✓")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {isAuthenticated && (
            <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0">
              <textarea
                ref={inputRef}
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe un mensaje..."
                rows={1}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-gray-400 max-h-24"
                style={{ minHeight: "40px" }}
              />
              <button onClick={enviar} disabled={!texto.trim() || sending}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 hover:opacity-90 disabled:opacity-40 transition-all"
                style={{ backgroundColor: color }}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatPrestador;