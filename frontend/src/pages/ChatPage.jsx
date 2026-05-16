import { useEffect, useRef, useState } from "react";
import { Plus, Send, Sparkles, Wifi, WifiOff } from "lucide-react";
import { io } from "socket.io-client";
import { Button } from "../components/Button.jsx";
import { Panel } from "../components/Panel.jsx";
import { Textarea } from "../components/Input.jsx";
import { ToolReview } from "../components/ToolReview.jsx";
import { api, apiMessage } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";

const toolLabels = {
  search_documents: "Search Documents",
  list_tasks: "List Tasks",
  create_task: "Create Task",
  create_study_plan_tasks: "Create Study Plan Tasks",
  save_memory: "Save Memory",
  list_recent_emails: "List Recent Emails",
  create_gmail_draft: "Create Gmail Draft",
  send_gmail_email: "Send Gmail Email"
};

function toolTitle(tool) {
  return toolLabels[tool] || String(tool || "tool action").replaceAll("_", " ");
}

export function ChatPage({ mode = "workspace" }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toolResults, setToolResults] = useState([]);
  const [pendingApproval, setPendingApproval] = useState([]);
  const [approvingIndex, setApprovingIndex] = useState(null);
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
    setToolResults([]);
    setPendingApproval([]);
    setMessages((current) => [
      ...current,
      { role: "user", content: message },
      { role: "assistant", content: "", streaming: true }
    ]);

    if (mode === "coding" && connected && socketRef.current) {
      socketRef.current.emit("ai:chat", { message, chatId, mode });
      return;
    }

    try {
      const endpoint = mode === "workspace" ? "/ai/chat-with-tools" : "/ai/chat";
      const { data } = await api.post(endpoint, { message, chatId, mode });
      setChatId(data.chatId);
      setToolResults(data.toolResults || []);
      setPendingApproval(data.pendingApproval || []);
      setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        last.content = data.answer;
        last.streaming = false;
        return next;
      });
    } catch (err) {
      setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && last.streaming) {
          last.content = apiMessage(err);
          last.error = true;
          last.streaming = false;
          return next;
        }
        return [...next, { role: "assistant", content: apiMessage(err), error: true }];
      });
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    setMessages([]);
    setInput("");
    setChatId("");
    setToolResults([]);
    setPendingApproval([]);
    setApprovingIndex(null);
    setLoading(false);
  }

  async function approveToolCall(item, index) {
    setApprovingIndex(index);
    try {
      const { data } = await api.post("/agents/tools/execute", {
        toolCall: {
          tool: item.tool,
          arguments: item.arguments
        }
      });
      setToolResults((current) => [...current, data.result]);
      setPendingApproval((current) => current.filter((_, itemIndex) => itemIndex !== index));
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `Approved and executed ${toolTitle(item.tool)}.`
        }
      ]);
    } catch (err) {
      setMessages((current) => [...current, { role: "assistant", content: apiMessage(err), error: true }]);
    } finally {
      setApprovingIndex(null);
    }
  }

  function rejectToolCall(index) {
    setPendingApproval((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-black">{mode === "coding" ? "Coding Assistant" : "AI Chat"}</h1>
          <p className="mt-1 text-sm text-black/55">
            {mode === "coding" ? "Debug, explain, and generate code with Groq." : "Realtime workspace chat with memory and document context."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" onClick={startNewChat}>
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black/60">
            {connected ? <Wifi className="h-4 w-4 text-moss" /> : <WifiOff className="h-4 w-4 text-clay" />}
            {mode === "workspace" ? "Tool Actions" : connected ? "Streaming" : "HTTP fallback"}
          </span>
        </div>
      </div>

      <Panel className="min-h-0" title={mode === "coding" ? "Tutor Thread" : "Conversation"}>
        <div className="flex max-h-[46vh] min-h-80 flex-col gap-3 overflow-y-auto overscroll-contain pr-1">
          {messages.length ? messages.map((message, index) => (
            <div
              key={index}
              className={`w-fit max-w-full rounded-lg px-4 py-3 text-sm leading-6 sm:max-w-[82%] ${
                message.role === "user"
                  ? "ml-auto bg-ink text-white"
                  : message.error
                    ? "bg-clay/10 text-clay"
                    : "bg-black/5 text-ink"
              }`}
            >
              <pre className="whitespace-pre-wrap break-words font-sans">{message.content || (message.streaming ? "Thinking..." : "")}</pre>
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

      {mode === "workspace" && (
        <ToolReview
          pendingApproval={pendingApproval}
          toolResults={toolResults}
          approvingIndex={approvingIndex}
          onApprove={approveToolCall}
          onCancel={rejectToolCall}
        />
      )}

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
          className="min-h-24 max-h-56"
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
