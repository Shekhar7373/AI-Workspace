import { useState } from "react";
import { Network, Wand2 } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { Input, Select } from "../components/Input.jsx";
import { Panel } from "../components/Panel.jsx";
import { ToolReview } from "../components/ToolReview.jsx";
import { api, apiMessage } from "../services/api.js";

export function WorkflowsPage() {
  const [form, setForm] = useState({ focus: "study", goal: "" });
  const [summary, setSummary] = useState("");
  const [toolResults, setToolResults] = useState([]);
  const [pendingApproval, setPendingApproval] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [approvingIndex, setApprovingIndex] = useState(null);

  async function suggest(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSummary("");
    setToolResults([]);
    setPendingApproval([]);

    try {
      const { data } = await api.post("/workflows/suggest", form);
      setSummary(data.summary);
      setToolResults(data.toolResults || []);
      setPendingApproval(data.pendingApproval || []);
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function approveToolCall(item, index) {
    setApprovingIndex(index);
    setError("");
    try {
      const { data } = await api.post("/agents/tools/execute", {
        toolCall: {
          tool: item.tool,
          arguments: item.arguments
        }
      });
      setToolResults((current) => [...current, data.result]);
      setPendingApproval((current) => current.filter((_, itemIndex) => itemIndex !== index));
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setApprovingIndex(null);
    }
  }

  function rejectToolCall(index) {
    setPendingApproval((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">AI Workflows</h1>
        <p className="mt-1 text-sm text-black/55">Generate local task and memory workflows from your workspace state.</p>
      </div>

      {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Workflow Input">
          <form onSubmit={suggest} className="grid gap-4">
            <Select label="Focus" value={form.focus} onChange={(event) => setForm({ ...form, focus: event.target.value })}>
              <option value="study">Study Planning</option>
              <option value="deadlines">Deadline Recovery</option>
              <option value="memory">Memory Cleanup</option>
              <option value="documents">Document Review</option>
              <option value="coding">Coding Progress</option>
            </Select>
            <Input
              label="Goal"
              value={form.goal}
              onChange={(event) => setForm({ ...form, goal: event.target.value })}
              placeholder="Prepare DBMS revision tasks for this week"
            />
            <Button type="submit" disabled={loading}>
              <Wand2 className="h-4 w-4" />
              {loading ? "Generating" : "Suggest Workflow"}
            </Button>
          </form>
        </Panel>

        <Panel title="Workflow Summary">
          <pre className="min-h-64 whitespace-pre-wrap rounded-md bg-black/[0.03] p-4 font-sans text-sm leading-6 text-black/75">
            {summary || "Workflow suggestions will appear here."}
          </pre>
          {!summary && (
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-black/45">
              <Network className="h-4 w-4" />
              Uses documents, tasks, and memories already in this workspace.
            </div>
          )}
        </Panel>
      </div>

      <ToolReview
        pendingApproval={pendingApproval}
        toolResults={toolResults}
        approvingIndex={approvingIndex}
        onApprove={approveToolCall}
        onCancel={rejectToolCall}
      />
    </div>
  );
}
