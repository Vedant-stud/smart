import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import client from "../api/client";
import Loader from "../components/Loader.jsx";

const SUGGESTIONS = [
  "Should I irrigate before this week's rain?",
  "What does low soil organic carbon mean?",
  "My wheat leaves are yellowing — why?",
  "Best crop rotation after rice?",
];

export default function Chatbot() {
  const [farms, setFarms] = useState([]);
  const [farmId, setFarmId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    client.get("/api/farms").then((res) => setFarms(res.data));
  }, []);

  const loadHistory = (fid) => {
    setLoadingHistory(true);
    client
      .get("/api/chatbot/history", { params: fid ? { farm_id: fid } : {} })
      .then((res) => setMessages(res.data))
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    loadHistory(farmId || undefined);
  }, [farmId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const res = await client.post("/api/chatbot/ask", {
        message,
        farm_id: farmId ? parseInt(farmId) : null,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.reply,
          sources: res.data.sources.map((s) => s.title),
          created_at: res.data.created_at,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-forest-950">AI Advisor</h1>
          <p className="text-forest-600 mt-1">Ask about irrigation, soil, disease, or crop planning.</p>
        </div>
        <select className="input-field !w-auto" value={farmId} onChange={(e) => setFarmId(e.target.value)}>
          <option value="">General (no farm context)</option>
          {farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loadingHistory ? (
            <Loader />
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-10">
              <div className="h-12 w-12 rounded-2xl bg-forest-800 flex items-center justify-center">
                <Sparkles size={22} className="text-wheat-200" />
              </div>
              <p className="text-forest-600 max-w-sm">
                Ask anything about irrigation timing, soil nutrients, disease symptoms, or crop selection —
                grounded in the agricultural knowledge base.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full bg-forest-50 text-forest-700 hover:bg-forest-100 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] ${m.role === "user" ? "order-2" : ""}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                        m.role === "user"
                          ? "bg-forest-800 text-wheat-50 rounded-br-sm"
                          : "bg-forest-50 text-forest-900 rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                    {m.sources?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {m.sources.map((s, j) => (
                          <span key={j} className="text-xs px-2 py-1 rounded-full bg-wheat-100 text-wheat-800 flex items-center gap-1">
                            <BookOpen size={10} />
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {sending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-forest-50 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-forest-400"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: d * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-forest-100 p-3 flex items-center gap-2"
        >
          <input
            className="input-field flex-1"
            placeholder="Ask about irrigation, soil, disease…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <motion.button whileTap={{ scale: 0.94 }} type="submit" disabled={sending || !input.trim()} className="btn-primary !rounded-xl !px-4">
            <Send size={18} />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
