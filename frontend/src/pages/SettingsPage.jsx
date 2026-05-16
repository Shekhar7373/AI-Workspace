import { useEffect, useState } from "react";
import { Copy, Link2, MessageCircle, Server, Unlink, User, Webhook } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { Panel } from "../components/Panel.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { api, apiMessage } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [health, setHealth] = useState(null);
  const [google, setGoogle] = useState(null);
  const [telegram, setTelegram] = useState(null);
  const [telegramCode, setTelegramCode] = useState(null);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);

  useEffect(() => {
    api.get("/health")
      .then(({ data }) => setHealth(data))
      .catch((err) => setError(apiMessage(err)));
    loadGoogleStatus();
    loadTelegramStatus();
  }, []);

  async function loadGoogleStatus() {
    try {
      const { data } = await api.get("/integrations/google/status");
      setGoogle(data.google);
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function connectGoogle() {
    setGoogleLoading(true);
    setError("");
    try {
      const { data } = await api.get("/integrations/google/auth-url");
      window.location.href = data.url;
    } catch (err) {
      setError(apiMessage(err));
      setGoogleLoading(false);
    }
  }

  async function disconnectGoogle() {
    setGoogleLoading(true);
    setError("");
    try {
      await api.delete("/integrations/google");
      await loadGoogleStatus();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function loadTelegramStatus() {
    try {
      const { data } = await api.get("/telegram/status");
      setTelegram(data);
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function generateTelegramCode() {
    setTelegramLoading(true);
    setError("");
    try {
      const { data } = await api.post("/telegram/link-code");
      setTelegramCode(data.link);
      await loadTelegramStatus();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setTelegramLoading(false);
    }
  }

  async function setupTelegramWebhook() {
    setTelegramLoading(true);
    setError("");
    try {
      await api.post("/telegram/setup-webhook");
      await loadTelegramStatus();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setTelegramLoading(false);
    }
  }

  async function unlinkTelegram() {
    setTelegramLoading(true);
    setError("");
    try {
      await api.delete("/telegram/unlink");
      setTelegramCode(null);
      await loadTelegramStatus();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setTelegramLoading(false);
    }
  }

  async function copyTelegramCode() {
    if (!telegramCode?.code) return;
    await navigator.clipboard?.writeText(`/link ${telegramCode.code}`);
  }

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

        <Panel title="Google Integration">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-ink text-white">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <StatusBadge tone={google?.connected ? "success" : "neutral"}>
                  {google?.connected ? "Connected" : "Not Connected"}
                </StatusBadge>
                <p className="mt-2 text-sm text-black/55">
                  {google?.connected ? google.googleEmail || "Google account connected" : "Connect Google before Gmail and Calendar tools are enabled."}
                </p>
              </div>
            </div>

            {google?.connected ? (
              <Button variant="secondary" onClick={disconnectGoogle} disabled={googleLoading}>
                <Unlink className="h-4 w-4" />
                {googleLoading ? "Disconnecting" : "Disconnect Google"}
              </Button>
            ) : (
              <Button onClick={connectGoogle} disabled={googleLoading}>
                <Link2 className="h-4 w-4" />
                {googleLoading ? "Opening Google" : "Connect Google"}
              </Button>
            )}
          </div>
        </Panel>

        <Panel title="Telegram Bot">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-ink text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <StatusBadge tone={telegram?.linked ? "success" : "neutral"}>
                  {telegram?.linked ? "Linked" : "Not Linked"}
                </StatusBadge>
                <p className="mt-2 text-sm text-black/55">
                  {telegram?.linked
                    ? `Connected to ${telegram.link?.username ? `@${telegram.link.username}` : "your Telegram account"}`
                    : "Generate a code, then send it to your Telegram bot."}
                </p>
                <p className="mt-1 break-words text-xs text-black/40">
                  Webhook: {telegram?.configured?.webhookUrlValue || "Not configured"}
                </p>
              </div>
            </div>

            <div className="grid gap-2 rounded-md bg-black/[0.03] p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span>Bot token</span>
                <StatusBadge tone={telegram?.configured?.botToken ? "success" : "danger"}>
                  {telegram?.configured?.botToken ? "Set" : "Missing"}
                </StatusBadge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Webhook secret</span>
                <StatusBadge tone={telegram?.configured?.webhookSecret ? "success" : "danger"}>
                  {telegram?.configured?.webhookSecret ? "Set" : "Missing"}
                </StatusBadge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Webhook URL</span>
                <StatusBadge tone={telegram?.configured?.webhookUrl ? "success" : "danger"}>
                  {telegram?.configured?.webhookUrl ? "Set" : "Missing"}
                </StatusBadge>
              </div>
            </div>

            {telegramCode?.code && (
              <div className="rounded-md border border-moss/30 bg-moss/10 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-moss">Send this in Telegram</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <code className="rounded bg-white px-3 py-2 font-mono text-sm">/link {telegramCode.code}</code>
                  <Button variant="secondary" onClick={copyTelegramCode}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={generateTelegramCode} disabled={telegramLoading}>
                <Link2 className="h-4 w-4" />
                Generate Link Code
              </Button>
              <Button variant="secondary" onClick={setupTelegramWebhook} disabled={telegramLoading}>
                <Webhook className="h-4 w-4" />
                Set Webhook
              </Button>
              {telegram?.linked && (
                <Button variant="secondary" onClick={unlinkTelegram} disabled={telegramLoading}>
                  <Unlink className="h-4 w-4" />
                  Unlink Telegram
                </Button>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
