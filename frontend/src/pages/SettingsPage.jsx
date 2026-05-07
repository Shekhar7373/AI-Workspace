import { useEffect, useState } from "react";
import { Server, User } from "lucide-react";
import { Panel } from "../components/Panel.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { api, apiMessage } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/health")
      .then(({ data }) => setHealth(data))
      .catch((err) => setError(apiMessage(err)));
  }, []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="mt-1 text-sm text-black/55">Account and backend connection details.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Profile">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-ink text-white">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">{user?.name}</p>
              <p className="text-sm text-black/55">{user?.email}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-moss">{user?.role || "student"}</p>
            </div>
          </div>
        </Panel>

        <Panel title="Backend">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-moss text-white">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <StatusBadge tone={health?.success ? "success" : "danger"}>
                {health?.success ? "Connected" : "Unavailable"}
              </StatusBadge>
              <p className="mt-2 text-sm text-black/55">{health?.message || error || "Checking backend..."}</p>
              <p className="mt-1 text-xs text-black/40">{import.meta.env.VITE_API_URL || "http://localhost:5000/api"}</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
