import { NavLink, Route, Routes } from "react-router-dom";
import { StreamPage } from "./pages/StreamPage.js";
import { UsersPage } from "./pages/UsersPage.js";
import { WebSocketJobsPage } from "./pages/WebSocketJobsPage.js";

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "text-white" : "text-slate-400 hover:text-white";

export function App() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="shrink-0 border-b border-slate-800 px-4 py-4 sm:px-6">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-semibold tracking-tight">Presight</span>
          <NavLink className={navClass} end to="/">
            Users
          </NavLink>
          <NavLink className={navClass} to="/stream">
            Stream
          </NavLink>
          <NavLink className={navClass} to="/websocket">
            WebSocket
          </NavLink>
        </nav>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<UsersPage />} />
          <Route path="/stream" element={<StreamPage />} />
          <Route path="/websocket" element={<WebSocketJobsPage />} />
        </Routes>
      </main>
    </div>
  );
}
