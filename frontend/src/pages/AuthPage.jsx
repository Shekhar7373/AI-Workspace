import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BrainCircuit, LogIn, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../components/Button.jsx";
import { Input } from "../components/Input.jsx";
import { api, apiMessage } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";

export function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { accessToken, setSession } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (accessToken) return <Navigate to="/" replace />;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin ? { email: form.email, password: form.password } : form;
      const { data } = await api.post(endpoint, payload);
      setSession(data);
      navigate("/");
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm md:grid-cols-[1.05fr_0.95fr]"
      >
        <div className="bg-ink p-8 text-white md:p-10">
          <div className="mb-16 grid h-12 w-12 place-items-center rounded-md bg-white/10">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <h1 className="max-w-md text-4xl font-black leading-tight">AI Workspace</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            A focused workspace for notes, documents, memory, semantic search, tasks, agents, and coding help.
          </p>
        </div>

        <form onSubmit={submit} className="grid gap-4 p-8 md:p-10">
          <div>
            <h2 className="text-2xl font-black">{isLogin ? "Welcome back" : "Create account"}</h2>
            <p className="mt-1 text-sm text-black/55">
              {isLogin ? "Sign in to continue your workspace." : "Start with a clean student developer workspace."}
            </p>
          </div>

          {!isLogin && (
            <Input label="Name" value={form.name} onChange={(event) => update("name", event.target.value)} required />
          )}
          <Input label="Email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
          <Input label="Password" type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required minLength={6} />

          {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

          <Button type="submit" disabled={loading}>
            {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {loading ? "Please wait" : isLogin ? "Login" : "Register"}
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate(isLogin ? "/register" : "/login")}
            className="justify-center"
          >
            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
          </Button>
        </form>
      </motion.section>
    </main>
  );
}
