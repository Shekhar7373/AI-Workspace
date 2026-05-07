import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Input, Select, Textarea } from "../components/Input.jsx";
import { Panel } from "../components/Panel.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { api, apiMessage } from "../services/api.js";
import { formatDate } from "../utils/format.js";

export function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", status: "todo", deadline: "" });
  const [error, setError] = useState("");

  async function load() {
    const { data } = await api.get("/tasks");
    setTasks(data.tasks);
  }

  useEffect(() => {
    load().catch((err) => setError(apiMessage(err)));
  }, []);

  async function create(event) {
    event.preventDefault();
    setError("");
    try {
      await api.post("/tasks", form);
      setForm({ title: "", description: "", priority: "medium", status: "todo", deadline: "" });
      await load();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function update(id, patch) {
    await api.put(`/tasks/${id}`, patch);
    await load();
  }

  async function remove(id) {
    await api.delete(`/tasks/${id}`);
    await load();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">Tasks</h1>
        <p className="mt-1 text-sm text-black/55">Track study, deadlines, and project work.</p>
      </div>

      {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

      <Panel title="Create Task">
        <form onSubmit={create} className="grid gap-4 lg:grid-cols-4 lg:items-end">
          <Input label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <Input label="Deadline" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
          <Select label="Priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
          <Select label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </Select>
          <Textarea label="Description" className="lg:col-span-3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <Button type="submit"><Plus className="h-4 w-4" />Add</Button>
        </form>
      </Panel>

      <Panel title="Task List">
        {tasks.length ? (
          <div className="grid gap-3">
            {tasks.map((task) => (
              <div key={task._id} className="grid gap-3 rounded-md border border-black/10 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{task.title}</p>
                    <StatusBadge tone={task.priority === "high" ? "danger" : task.priority === "low" ? "info" : "warning"}>{task.priority}</StatusBadge>
                    <StatusBadge tone={task.status === "done" ? "success" : "neutral"}>{task.status}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-black/55">{task.description || "No description"}</p>
                  <p className="mt-1 text-xs text-black/45">{formatDate(task.deadline)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => update(task._id, { status: "done" })}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => remove(task._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Plus} title="No tasks yet" text="Create a task to begin tracking your work." />
        )}
      </Panel>
    </div>
  );
}
