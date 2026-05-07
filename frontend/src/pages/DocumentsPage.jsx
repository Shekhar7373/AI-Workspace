import { useEffect, useState } from "react";
import { FileUp, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Input } from "../components/Input.jsx";
import { Panel } from "../components/Panel.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { api, apiMessage } from "../services/api.js";
import { formatDate } from "../utils/format.js";

export function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({ title: "", subject: "", tags: "", file: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const { data } = await api.get("/documents");
      setDocuments(data.documents);
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(event) {
    event.preventDefault();
    if (!form.file) return;
    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", form.file);
      body.append("title", form.title);
      body.append("subject", form.subject);
      body.append("tags", form.tags);
      await api.post("/documents/upload", body);
      setForm({ title: "", subject: "", tags: "", file: null });
      event.target.reset();
      await load();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    await api.delete(`/documents/${id}`);
    await load();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">Documents</h1>
        <p className="mt-1 text-sm text-black/55">Upload notes and make them searchable through Qdrant RAG.</p>
      </div>

      {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

      <Panel title="Upload Notes">
        <form onSubmit={upload} className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <Input label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Operating System notes" />
          <Input label="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Computer Science" />
          <Input label="Tags" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="os,cpu,scheduling" />
          <label className="grid gap-1.5 text-sm font-medium text-ink lg:col-span-3">
            File
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(event) => setForm({ ...form, file: event.target.files?.[0] })}
              className="rounded-md border border-black/10 bg-white p-2 text-sm"
              required
            />
          </label>
          <Button type="submit" disabled={loading}>
            <FileUp className="h-4 w-4" />
            {loading ? "Uploading" : "Upload"}
          </Button>
        </form>
      </Panel>

      <Panel
        title="Library"
        action={<Button variant="secondary" onClick={load}><RefreshCw className="h-4 w-4" />Refresh</Button>}
      >
        {documents.length ? (
          <div className="grid gap-3">
            {documents.map((doc) => (
              <div key={doc._id} className="grid gap-3 rounded-md border border-black/10 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="truncate font-bold">{doc.title}</p>
                  <p className="mt-1 text-sm text-black/55">
                    {doc.subject || "No subject"} · {doc.chunkCount} chunks · {formatDate(doc.createdAt)}
                  </p>
                  {doc.processingError && <p className="mt-1 text-xs text-clay">{doc.processingError}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={doc.processingStatus === "completed" ? "success" : doc.processingStatus === "failed" ? "danger" : "warning"}>
                    {doc.processingStatus}
                  </StatusBadge>
                  <Button variant="ghost" onClick={() => remove(doc._id)} title="Delete document">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={FileUp} title="No uploaded documents" text="Add a PDF, DOCX, or TXT file to test RAG and semantic search." />
        )}
      </Panel>
    </div>
  );
}
