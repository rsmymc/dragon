import { Link, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

export default function AppLayout() {
  const userInitials = useAuthStore((s) => s.userInitials());
  const logout = useAuthStore((s) => s.logout);
  return (
    <div>
      <header
        style={{
          padding: 12,
          borderBottom: "1px solid #eee",
          display: "flex",
          gap: 16,
        }}
      >
        <Link to="/teams">Teams</Link>
        <Link to="/persons">Persons</Link>
        <Link to="/settings">Settings</Link>
        <div style={{ marginLeft: "auto" }}>
          <span style={{ marginRight: 12 }}>{userInitials}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
