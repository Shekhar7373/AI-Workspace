import { useEffect, useState } from "react";
import { Brain, CalendarCheck, FileText, Network, RefreshCw } from "lucide-react";
import { Panel } from "../components/Panel.jsx";
import { Button } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { api, apiMessage } from "../services/api.js";
import { formatDate } from "../utils/format.js";

export function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/dashboard");
      setDashboard(data.dashboard);
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const docs = dashboard?.recentDocuments || [];
  const tasks = dashboard?.pendingTasks || [];
  const memories = dashboard?.memoryHighlights || [];
  const stats = dashboard?.taskStats || [];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Dashboard</h1>
          <p className="mt-1 text-sm text-black/55">Recent work, pending tasks, and memory highlights.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={FileText} label="Documents" value={docs.length} />
        <Metric icon={CalendarCheck} label="Pending Tasks" value={tasks.length} />
        <Metric icon={Network} label="Memories" value={memories.length} />
        <Metric icon={Brain} label="Task States" value={stats.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recent Documents">
          {docs.length ? (
            <div className="grid gap-3">
              {docs.map((doc) => (
                <div key={doc._id} className="flex items-center justify-between gap-3 rounded-md border border-black/10 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{doc.title}</p>
                    <p className="text-xs text-black/50">{doc.subject || "No subject"} · {doc.chunkCount} chunks</p>
                  </div>
                  <StatusBadge tone={doc.processingStatus === "completed" ? "success" : doc.processingStatus === "failed" ? "danger" : "warning"}>
                    {doc.processingStatus}
                  </StatusBadge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="No documents yet" text="Upload notes to unlock document Q&A and semantic search." />
          )}
        </Panel>

        <Panel title="Pending Tasks">
          {tasks.length ? (
            <div className="grid gap-3">
              {tasks.map((task) => (
                <div key={task._id} className="rounded-md border border-black/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{task.title}</p>
                    <StatusBadge tone={task.priority === "high" ? "danger" : task.priority === "low" ? "info" : "warning"}>
                      {task.priority}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-black/50">{formatDate(task.deadline)} · {task.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarCheck} title="Nothing pending" text="Create tasks to track study and project progress." />
          )}
        </Panel>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white/80 p-5 shadow-sm">
      <Icon className="h-5 w-5 text-moss" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="text-sm text-black/55">{label}</p>
    </div>
  );
}
