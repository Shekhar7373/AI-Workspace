import { useEffect, useState } from "react";
import { Brain, Plus } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Panel } from "../components/Panel.jsx";
import { Select, Textarea } from "../components/Input.jsx";
import { api, apiMessage } from "../services/api.js";
import { formatDate } from "../utils/format.js";

export function MemoryPage() {
  const [memories, setMemories] = useState([]);
  const [form, setForm] = useState({ type: "custom", content: "" });
  const [error, setError] = useState("");

  async function load() {
    const { data } = await api.get("/memory");
    setMemories(data.memories);
  }

  useEffect(() => {
    load().catch((err) => setError(apiMessage(err)));
  }, []);

  async function create(event) {
    event.preventDefault();
    setError("");
    try {
      await api.post("/memory/store", form);
      setForm({ type: "custom", content: "" });
      await load();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">Memory</h1>
        <p className="mt-1 text-sm text-black/55">Store long-term user context and vector memories.</p>
      </div>

      {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

      <Panel title="Store Memory">
        <form onSubmit={create} className="grid gap-4 md:grid-cols-[240px_1fr_auto] md:items-end">
          <Select label="Type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            <option value="custom">Custom</option>
            <option value="preference">Preference</option>
            <option value="study_habit">Study Habit</option>
            <option value="weak_subject">Weak Subject</option>
            <option value="coding_interest">Coding Interest</option>
            <option value="project">Project</option>
            <option value="goal">Goal</option>
          </Select>
          <Textarea label="Content" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required />
          <Button type="submit"><Plus className="h-4 w-4" />Store</Button>
        </form>
      </Panel>

      <Panel title="Memory Timeline">
        {memories.length ? (
          <div className="grid gap-3">
            {memories.map((memory) => (
              <article key={memory._id} className="rounded-md border border-black/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold uppercase tracking-wide text-moss">{memory.type}</p>
                  <p className="text-xs text-black/45">{formatDate(memory.createdAt)}</p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/70">{memory.content}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={Brain} title="No memories stored" text="Add a preference, goal, or learning pattern for context-aware AI responses." />
        )}
      </Panel>
    </div>
  );
}
