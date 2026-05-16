import { Check, X } from "lucide-react";
import { Button } from "./Button.jsx";
import { Panel } from "./Panel.jsx";

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

const fieldLabels = {
  to: "To",
  subject: "Subject",
  body: "Message",
  threadId: "Thread",
  inReplyTo: "Reply To",
  references: "References",
  query: "Search Query",
  documentId: "Document",
  limit: "Limit",
  title: "Title",
  description: "Description",
  deadline: "Deadline",
  priority: "Priority",
  status: "Status",
  content: "Memory",
  type: "Type"
};

function titleFor(tool) {
  return toolLabels[tool] || String(tool || "Tool action").replaceAll("_", " ");
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  return JSON.stringify(value, null, 2);
}

function FieldList({ data }) {
  if (Array.isArray(data)) {
    if (!data.length) return <p className="text-sm text-black/50">No items returned.</p>;
    return (
      <div className="grid gap-2">
        {data.map((item, index) => (
          <div key={index} className="rounded-md bg-black/[0.03] p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-black/50">Item {index + 1}</p>
            {typeof item === "object" && item !== null ? (
              <FieldList data={item} />
            ) : (
              <p className="whitespace-pre-wrap break-words text-sm text-black/75">{formatValue(item)}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(data || {}).filter(([, value]) => value !== undefined && value !== "");
  if (!entries.length) return <p className="text-sm text-black/50">No extra details returned.</p>;

  return (
    <div className="grid gap-2">
      {entries.map(([key, value]) => {
        if (Array.isArray(value)) {
          return (
            <div key={key} className="rounded-md bg-black/[0.03] p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-black/50">{fieldLabels[key] || key}</p>
              <div className="mt-2 grid gap-2">
                {value.map((item, index) => (
                  <div key={index} className="rounded-md border border-black/10 bg-white p-3">
                    {typeof item === "object" && item !== null ? (
                      <FieldList data={item} />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm text-black/75">{formatValue(item)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={key} className="grid gap-1 rounded-md bg-black/[0.03] p-3 sm:grid-cols-[9rem_1fr]">
            <p className="text-xs font-bold uppercase tracking-wide text-black/50">{fieldLabels[key] || key}</p>
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-black/75">{formatValue(value)}</p>
          </div>
        );
      })}
    </div>
  );
}

export function ToolReview({ pendingApproval, toolResults, approvingIndex, onApprove, onCancel }) {
  const executed = toolResults.filter((item) => !item.skipped);

  return (
    <>
      {pendingApproval.length > 0 && (
        <Panel title="Pending Approvals">
          <div className="grid gap-3">
            {pendingApproval.map((item, index) => (
              <div key={`${item.tool}-${index}`} className="grid gap-3 rounded-md border border-black/10 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-ink">{titleFor(item.tool)}</p>
                    <p className="text-xs text-black/55">Review this action before it changes your workspace.</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="secondary" onClick={() => onCancel(index)} disabled={approvingIndex === index}>
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button onClick={() => onApprove(item, index)} disabled={approvingIndex === index}>
                      <Check className="h-4 w-4" />
                      {approvingIndex === index ? "Approving" : "Approve"}
                    </Button>
                  </div>
                </div>
                <FieldList data={item.arguments || {}} />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {executed.length > 0 && (
        <Panel title="Tool Activity">
          <div className="grid gap-3">
            {executed.map((item, index) => (
              <div key={`${item.tool}-result-${index}`} className="grid gap-3 rounded-md border border-black/10 bg-white p-4">
                <div>
                  <p className="text-sm font-bold text-ink">{titleFor(item.tool)}</p>
                  <p className="text-xs text-black/55">Completed successfully.</p>
                </div>
                <FieldList data={item.result || {}} />
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
