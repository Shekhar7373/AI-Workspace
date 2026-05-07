import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { Input, Textarea } from "../components/Input.jsx";
import { Panel } from "../components/Panel.jsx";
import { api, apiMessage } from "../services/api.js";

export function StudyPage() {
  const [form, setForm] = useState({ goal: "", deadline: "", tasks: "" });
  const [plan, setPlan] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">Study Planner</h1>
        <p className="mt-1 text-sm text-black/55">Generate revision plans and progress checkpoints with Groq.</p>
      </div>

      {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Planner Input">
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

        <Panel title="Generated Plan">
          <pre className="min-h-80 whitespace-pre-wrap rounded-md bg-black/[0.03] p-4 font-sans text-sm leading-6 text-black/75">
            {plan || "Your generated study plan will appear here."}
          </pre>
        </Panel>
      </div>
    </div>
  );
}
