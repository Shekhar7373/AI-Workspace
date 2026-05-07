import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout.jsx";
import { ProtectedRoute } from "./layouts/ProtectedRoute.jsx";
import { AgentsPage } from "./pages/AgentsPage.jsx";
import { AuthPage } from "./pages/AuthPage.jsx";
import { ChatPage } from "./pages/ChatPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { DocumentsPage } from "./pages/DocumentsPage.jsx";
import { MemoryPage } from "./pages/MemoryPage.jsx";
import { SearchPage } from "./pages/SearchPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { StudyPage } from "./pages/StudyPage.jsx";
import { TasksPage } from "./pages/TasksPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="chat" element={<ChatPage mode="workspace" />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="study" element={<StudyPage />} />
          <Route path="coding" element={<ChatPage mode="coding" />} />
          <Route path="memory" element={<MemoryPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
