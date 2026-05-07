import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bot,
  Brain,
  CalendarCheck,
  Code2,
  FileText,
  Home,
  LogOut,
  Network,
  Search,
  Settings,
  Sparkles
} from "lucide-react";
import { Button } from "../components/Button.jsx";
import { useAuthStore } from "../store/authStore.js";
import { api } from "../services/api.js";

const nav = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/chat", label: "AI Chat", icon: Sparkles },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/search", label: "Search", icon: Search },
  { to: "/tasks", label: "Tasks", icon: CalendarCheck },
  { to: "/study", label: "Study Planner", icon: Brain },
  { to: "/coding", label: "Coding", icon: Code2 },
  { to: "/memory", label: "Memory", icon: Network },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    await api.post("/auth/logout").catch(() => {});
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-black/10 bg-white/80 px-4 py-5 backdrop-blur lg:block">
        <div className="mb-7 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-ink text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold">AI Workspace</p>
            <p className="text-xs text-black/50">Study and build faster</p>
          </div>
        </div>

        <nav className="grid gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                  isActive ? "bg-ink text-white" : "text-black/65 hover:bg-black/5 hover:text-ink"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-black/10 bg-paper p-4">
          <p className="truncate text-sm font-bold">{user?.name || "Workspace user"}</p>
          <p className="truncate text-xs text-black/50">{user?.email}</p>
          <Button variant="ghost" className="mt-3 w-full justify-start px-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-black/10 bg-paper/85 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold">AI Workspace</span>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold ${
                    isActive ? "bg-ink text-white" : "bg-white text-black/65"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
