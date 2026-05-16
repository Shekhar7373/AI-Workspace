import { useEffect, useState } from "react";
import { Clipboard, RotateCcw, Wand2 } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { Input, Textarea } from "../components/Input.jsx";
import { Panel } from "../components/Panel.jsx";
import { api, apiMessage } from "../services/api.js";

const storageKey = "ai-workspace:study-planner";
const defaultForm = { goal: "", deadline: "", tasks: "" };

function readStoredPlanner() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return {
      form: { ...defaultForm, ...(saved.form || {}) },
      plan: saved.plan || ""
    };
  } catch {
    return { form: defaultForm, plan: "" };
  }
}

export function StudyPage() {
  const stored = readStoredPlanner();
  const [form, setForm] = useState(stored.form);
  const [plan, setPlan] = useState(stored.plan);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ form, plan }));
  }, [form, plan]);

  async function generate(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const tasks = form.tasks.split("\n").map((task) => task.trim()).filter(Boolean);
      const { data } = await api.post("/ai/study-plan", { goal: form.goal, deadline: form.deadline, tasks });
      setPlan(data.plan);
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function clearPlanner() {
    setForm(defaultForm);
    setPlan("");
    setError("");
    localStorage.removeItem(storageKey);
  }

  async function copyPlan() {
    if (!plan) return;
    await navigator.clipboard?.writeText(plan);
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">Study Planner</h1>
        <p className="mt-1 text-sm text-black/55">Generate revision plans and progress checkpoints with Groq.</p>
      </div>

      {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title="Planner Input"
          action={
            <Button variant="secondary" onClick={clearPlanner}>
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          }
        >
          <form onSubmit={generate} className="grid gap-4">
            <Input label="Goal" value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })} placeholder="Prepare DBMS unit test" required />
            <Input label="Deadline" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
            <Textarea label="Known Tasks" value={form.tasks} onChange={(event) => setForm({ ...form, tasks: event.target.value })} placeholder="One task per line" />
            <Button type="submit" disabled={loading}>
              <Wand2 className="h-4 w-4" />
              {loading ? "Generating" : "Generate Plan"}
            </Button>
          </form>
        </Panel>

        <Panel
          title="Generated Plan"
          action={plan && (
            <Button variant="secondary" onClick={copyPlan}>
              <Clipboard className="h-4 w-4" />
              Copy
            </Button>
          )}
        >
          {plan ? (
            <StudyPlanView text={plan} />
          ) : (
            <div className="grid min-h-80 place-items-center rounded-md bg-black/[0.03] p-6 text-center text-sm text-black/50">
              <div>
                <Wand2 className="mx-auto mb-3 h-8 w-8" />
                <p className="font-semibold text-ink">Your generated study plan will appear here.</p>
                <p className="mt-1">Plans stay saved in this browser after refresh.</p>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function StudyPlanView({ text }) {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="max-h-[720px] overflow-auto rounded-md bg-black/[0.03] p-4 text-sm leading-7 text-black/80">
      <div className="grid gap-4">
        {blocks.map((block, index) => (
          <PlanBlock key={index} block={block} />
        ))}
      </div>
    </div>
  );
}

function PlanBlock({ block }) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

  if (lines.length === 1) return <PlanLine line={lines[0]} />;

  return (
    <div className="grid gap-2 rounded-md bg-white/70 p-3">
      {lines.map((line, index) => (
        <PlanLine key={index} line={line} />
      ))}
    </div>
  );
}

function PlanLine({ line }) {
  if (line.startsWith("### ")) {
    return <h3 className="text-base font-black text-ink">{line.slice(4)}</h3>;
  }
  if (line.startsWith("## ")) {
    return <h2 className="text-lg font-black text-ink">{line.slice(3)}</h2>;
  }
  if (line.startsWith("# ")) {
    return <h2 className="text-xl font-black text-ink">{line.slice(2)}</h2>;
  }
  if (/^[-*]\s+/.test(line)) {
    return (
      <div className="flex gap-2">
        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-moss" />
        <p className="min-w-0">{formatInline(line.replace(/^[-*]\s+/, ""))}</p>
      </div>
    );
  }
  if (/^\d+\.\s+/.test(line)) {
    const [number] = line.match(/^\d+/) || ["1"];
    return (
      <div className="grid grid-cols-[2rem_1fr] gap-2">
        <span className="font-bold text-moss">{number}.</span>
        <p className="min-w-0">{formatInline(line.replace(/^\d+\.\s+/, ""))}</p>
      </div>
    );
  }
  return <p className="whitespace-pre-wrap break-words">{formatInline(line)}</p>;
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
