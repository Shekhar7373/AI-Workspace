import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Input } from "../components/Input.jsx";
import { Panel } from "../components/Panel.jsx";
import { api, apiMessage } from "../services/api.js";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/ai/search", { query });
      setResults(data.results || []);
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">Semantic Search</h1>
        <p className="mt-1 text-sm text-black/55">Search uploaded documents by meaning using local HuggingFace embeddings.</p>
      </div>

      <Panel title="Search">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <Input label="Query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Show networking notes about TCP" required />
          <Button type="submit" disabled={loading}>
            <Search className="h-4 w-4" />
            Search
          </Button>
        </form>
      </Panel>

      {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

      <Panel title="Results">
        {results.length ? (
          <div className="grid gap-3">
            {results.map((result, index) => (
              <article key={`${result.id}-${index}`} className="rounded-md border border-black/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">Match {index + 1}</p>
                  <p className="text-xs font-semibold text-black/50">Score {Number(result.score || 0).toFixed(3)}</p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/70">{result.payload?.text}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={Search} title="No results yet" text="Run a search after uploading and processing documents." />
        )}
      </Panel>
    </div>
  );
}
