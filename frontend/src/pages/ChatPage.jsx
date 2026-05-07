import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Wifi, WifiOff } from "lucide-react";
import { io } from "socket.io-client";
import { Button } from "../components/Button.jsx";
import { Panel } from "../components/Panel.jsx";
import { Textarea } from "../components/Input.jsx";
import { api, apiMessage } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";

export function ChatPage({ mode = "workspace" }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: accessToken }
    });
    socketRef.current = socket;
    socket.on("connected", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("ai:token", ({ token }) => {
      setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && last.streaming) {
          last.content += token;
        }
        return next;
      });
    });
    socket.on("ai:done", ({ chatId: nextChatId, answer }) => {
      setChatId(nextChatId);
      setLoading(false);
      setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          last.content = answer;
          last.streaming = false;
        }
        return next;
      });
    });
    socket.on("ai:error", ({ message }) => {
      setLoading(false);
      setMessages((current) => [...current, { role: "assistant", content: message, error: true }]);
    });
    return () => socket.disconnect();
  }, [accessToken]);

  async function send() {
    const message = input.trim();
    if (!message || loading) return;
    setInput("");
    setLoading(true);
    setMessages((current) => [
      ...current,
      { role: "user", content: message },
      { role: "assistant", content: "", streaming: true }
    ]);

    if (connected && socketRef.current) {
      socketRef.current.emit("ai:chat", { message, chatId, mode });
      return;
    }

    try {
      const { data } = await api.post("/ai/chat", { message, chatId, mode });
      setChatId(data.chatId);
      setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        last.content = data.answer;
        last.streaming = false;
        return next;
      });
    } catch (err) {
      setMessages((current) => [...current, { role: "assistant", content: apiMessage(err), error: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid h-[calc(100vh-3rem)] min-h-[680px] gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{mode === "coding" ? "Coding Assistant" : "AI Chat"}</h1>
          <p className="mt-1 text-sm text-black/55">
            {mode === "coding" ? "Debug, explain, and generate code with Groq." : "Realtime workspace chat with memory and document context."}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black/60">
          {connected ? <Wifi className="h-4 w-4 text-moss" /> : <WifiOff className="h-4 w-4 text-clay" />}
          {connected ? "Streaming" : "HTTP fallback"}
        </span>
      </div>

      <Panel className="min-h-0" title={mode === "coding" ? "Tutor Thread" : "Conversation"}>
        <div className="flex h-[430px] flex-col gap-3 overflow-y-auto pr-1">
          {messages.length ? messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "ml-auto bg-ink text-white"
                  : message.error
                    ? "bg-clay/10 text-clay"
                    : "bg-black/5 text-ink"
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{message.content || (message.streaming ? "Thinking..." : "")}</pre>
            </div>
          )) : (
            <div className="grid h-full place-items-center text-center text-black/50">
              <div>
                <Sparkles className="mx-auto mb-3 h-8 w-8" />
                <p className="font-semibold">Ask anything from your workspace.</p>
              </div>
            </div>
          )}
        </div>
      </Panel>

      <div className="grid gap-3 rounded-lg border border-black/10 bg-white/80 p-4 shadow-sm">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder={mode === "coding" ? "Paste code or describe the bug..." : "Ask a question..."}
          className="min-h-24"
        />
        <div className="flex justify-end">
          <Button onClick={send} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
