import { useState } from "react";
import { Bot, Play } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { Panel } from "../components/Panel.jsx";
import { Select, Textarea } from "../components/Input.jsx";
import { api, apiMessage } from "../services/api.js";

export function AgentsPage() {
  const [form, setForm] = useState({ agent: "study", objective: "", context: "" });
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/agents/run", form);
      setResult(data.output);
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">AI Agents</h1>
        <p className="mt-1 text-sm text-black/55">Run focused agents for study, notes, coding, reminders, and research.</p>
      </div>

      {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Agent Control">
          <form onSubmit={run} className="grid gap-4">
            <Select label="Agent" value={form.agent} onChange={(event) => setForm({ ...form, agent: event.target.value })}>
              <option value="study">Study Agent</option>
              <option value="reminder">Reminder Agent</option>
              <option value="notes">Notes Summarizer</option>
              <option value="coding">Coding Tutor</option>
              <option value="research">Research Agent</option>
            </Select>
            <Textarea label="Objective" value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} required />
            <Textarea label="Context" value={form.context} onChange={(event) => setForm({ ...form, context: event.target.value })} />
            <Button type="submit" disabled={loading}>
              <Play className="h-4 w-4" />
              {loading ? "Running" : "Run Agent"}
            </Button>
          </form>
        </Panel>

        <Panel title="Agent Output">
          <pre className="min-h-80 whitespace-pre-wrap rounded-md bg-black/[0.03] p-4 font-sans text-sm leading-6 text-black/75">
            {result || "Agent result will appear here."}
          </pre>
        </Panel>
      </div>
    </div>
  );
}
