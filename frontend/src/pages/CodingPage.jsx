import { useEffect, useState } from "react";
import { Bug, Clipboard, Code2, FileCode2, History, Lightbulb, RotateCcw, Send, Trash2 } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { Panel } from "../components/Panel.jsx";
import { Select, Textarea } from "../components/Input.jsx";
import { api, apiMessage } from "../services/api.js";

const currentStorageKey = "ai-workspace:coding-current";
const historyStorageKey = "ai-workspace:coding-history";

const taskPrompts = {
  explain: "Explain this code step by step. Highlight the main logic, important functions, and any confusing parts.",
  debug: "Debug this code. Identify likely errors, explain why they happen, and provide a corrected version.",
  optimize: "Review this code for performance, readability, and best practices. Suggest concrete improvements.",
  generate: "Generate code for this request. Include clean implementation details and explain how to use it.",
  dsa: "Solve this DSA/problem-solving request. Explain the approach, complexity, and provide code."
};

const taskLabels = {
  explain: "Explain code",
  debug: "Debug error",
  optimize: "Optimize/review",
  generate: "Generate code",
  dsa: "DSA solution"
};

const defaultForm = {
  language: "JavaScript",
  task: "debug",
  code: "",
  question: ""
};

function readStoredCurrent() {
  try {
    const saved = JSON.parse(localStorage.getItem(currentStorageKey) || "{}");
    return {
      form: { ...defaultForm, ...(saved.form || {}) },
      answer: saved.answer || ""
    };
  } catch {
    return { form: defaultForm, answer: "" };
  }
}

function readStoredHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(historyStorageKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function CodingPage() {
  const stored = readStoredCurrent();
  const [form, setForm] = useState(stored.form);
  const [answer, setAnswer] = useState(stored.answer);
  const [history, setHistory] = useState(readStoredHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(currentStorageKey, JSON.stringify({ form, answer }));
  }, [form, answer]);

  useEffect(() => {
    localStorage.setItem(historyStorageKey, JSON.stringify(history));
  }, [history]);

  async function submit(event) {
    event.preventDefault();
    if (loading || (!form.code.trim() && !form.question.trim())) return;

    setLoading(true);
    setError("");
    setAnswer("");

    const message = [
      `Language: ${form.language}`,
      `Task: ${taskPrompts[form.task]}`,
      form.question.trim() ? `Request:\n${form.question.trim()}` : "",
      form.code.trim() ? `Code:\n\`\`\`${form.language.toLowerCase()}\n${form.code.trim()}\n\`\`\`` : ""
    ].filter(Boolean).join("\n\n");

    try {
      const { data } = await api.post("/ai/chat", { message, mode: "coding" });
      setAnswer(data.answer);
      setHistory((current) => [
        {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          form,
          answer: data.answer
        },
        ...current
      ].slice(0, 6));
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function loadHistory(item) {
    setForm(item.form);
    setAnswer(item.answer);
    setError("");
  }

  function clearCurrent() {
    setForm(defaultForm);
    setAnswer("");
    setError("");
    localStorage.removeItem(currentStorageKey);
  }

  async function copyAnswer() {
    if (!answer) return;
    await navigator.clipboard?.writeText(answer);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Coding Assistant</h1>
          <p className="mt-1 text-sm text-black/55">Focused code help for debugging, explanation, generation, DSA, and optimization.</p>
        </div>
      </div>

      {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title="Code Request"
          action={
            <Button variant="secondary" onClick={clearCurrent}>
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          }
        >
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Language" value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}>
                <option>JavaScript</option>
                <option>Python</option>
                <option>Java</option>
                <option>C++</option>
                <option>C</option>
                <option>SQL</option>
              </Select>
              <Select label="Task Type" value={form.task} onChange={(event) => setForm({ ...form, task: event.target.value })}>
                <option value="debug">Debug error</option>
                <option value="explain">Explain code</option>
                <option value="optimize">Optimize/review</option>
                <option value="generate">Generate code</option>
                <option value="dsa">DSA solution</option>
              </Select>
            </div>

            <Textarea
              label="Question or Error"
              value={form.question}
              onChange={(event) => setForm({ ...form, question: event.target.value })}
              placeholder="Describe the bug, expected output, problem statement, or what you want to build."
              className="min-h-24"
            />

            <Textarea
              label="Code"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              placeholder="Paste your code here..."
              className="min-h-72 font-mono text-[13px] leading-6"
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={loading || (!form.code.trim() && !form.question.trim())}>
                <Send className="h-4 w-4" />
                {loading ? "Analyzing" : "Analyze Code"}
              </Button>
            </div>
          </form>
        </Panel>

        <Panel
          title="Coding Output"
          action={answer && (
            <Button variant="secondary" onClick={copyAnswer}>
              <Clipboard className="h-4 w-4" />
              Copy
            </Button>
          )}
        >
          {answer ? (
            <MarkdownAnswer text={answer} />
          ) : (
            <div className="grid min-h-[520px] place-items-center text-center text-black/50">
              <div className="max-w-md">
                <Code2 className="mx-auto mb-4 h-9 w-9" />
                <p className="font-bold text-ink">Coding mode is separate from AI Chat.</p>
                <p className="mt-2 text-sm leading-6">
                  Use this page for code-specific tasks. General AI Chat stays focused on workspace questions, documents, memory, and tool actions.
                </p>
                <div className="mt-5 grid gap-2 text-left text-sm">
                  <Hint icon={Bug} text="Debug errors with corrected code." />
                  <Hint icon={FileCode2} text="Explain or review pasted code." />
                  <Hint icon={Lightbulb} text="Generate snippets and DSA solutions." />
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Recent Analyses"
        action={history.length > 0 && (
          <Button variant="secondary" onClick={() => setHistory([])}>
            <Trash2 className="h-4 w-4" />
            Clear History
          </Button>
        )}
      >
        {history.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => loadHistory(item)}
                className="grid gap-2 rounded-md border border-black/10 bg-white p-4 text-left transition hover:border-moss hover:shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-black/45">
                  <History className="h-4 w-4" />
                  {new Date(item.createdAt).toLocaleString()}
                </div>
                <p className="font-bold text-ink">{item.form.language} · {taskLabels[item.form.task]}</p>
                <p className="line-clamp-2 text-sm leading-6 text-black/60">
                  {item.form.question || item.form.code || "Coding request"}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-black/55">Your last few coding answers will appear here and remain after refresh.</p>
        )}
      </Panel>
    </div>
  );
}

function Hint({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-black/[0.03] px-3 py-2">
      <Icon className="h-4 w-4 text-moss" />
      <span>{text}</span>
    </div>
  );
}

function MarkdownAnswer({ text }) {
  const parts = [];
  const pattern = /```(\w+)?\n?([\s\S]*?)```/g;
  let cursor = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push({ type: "text", value: text.slice(cursor, match.index) });
    }
    parts.push({ type: "code", language: match[1] || "code", value: match[2].trim() });
    cursor = pattern.lastIndex;
  }

  if (cursor < text.length) {
    parts.push({ type: "text", value: text.slice(cursor) });
  }

  return (
    <div className="max-h-[620px] overflow-auto rounded-md bg-black/[0.03] p-4 text-sm leading-7 text-black/80">
      <div className="grid gap-4">
        {parts.map((part, index) => (
          part.type === "code"
            ? <CodeBlock key={index} language={part.language} code={part.value} />
            : <TextBlock key={index} text={part.value} />
        ))}
      </div>
    </div>
  );
}

function TextBlock({ text }) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  return (
    <div className="grid gap-2">
      {lines.map((line, index) => {
        if (line.startsWith("### ")) {
          return <h3 key={index} className="mt-2 text-base font-black text-ink">{line.slice(4)}</h3>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={index} className="mt-2 text-lg font-black text-ink">{line.slice(3)}</h2>;
        }
        if (line.startsWith("# ")) {
          return <h2 key={index} className="text-xl font-black text-ink">{line.slice(2)}</h2>;
        }
        if (/^[-*]\s+/.test(line)) {
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-moss" />
              <p className="min-w-0">{formatInline(line.replace(/^[-*]\s+/, ""))}</p>
            </div>
          );
        }
        if (/^\d+\.\s+/.test(line)) {
          const [number] = line.match(/^\d+/) || ["1"];
          return (
            <div key={index} className="grid grid-cols-[2rem_1fr] gap-2">
              <span className="font-bold text-moss">{number}.</span>
              <p className="min-w-0">{formatInline(line.replace(/^\d+\.\s+/, ""))}</p>
            </div>
          );
        }
        return <p key={index} className="whitespace-pre-wrap break-words">{formatInline(line)}</p>;
      })}
    </div>
  );
}

function formatInline(text) {
  const chunks = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return chunks.map((chunk, index) => {
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      return <strong key={index} className="font-black text-ink">{chunk.slice(2, -2)}</strong>;
    }
    if (chunk.startsWith("`") && chunk.endsWith("`")) {
      return <code key={index} className="rounded bg-white px-1.5 py-0.5 font-mono text-[0.9em] text-ink">{chunk.slice(1, -1)}</code>;
    }
    return <span key={index}>{chunk}</span>;
  });
}

function CodeBlock({ language, code }) {
  return (
    <div className="overflow-hidden rounded-md border border-black/10 bg-[#101418]">
      <div className="border-b border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white/55">
        {language}
      </div>
      <pre className="overflow-auto p-4 text-sm leading-6 text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}
