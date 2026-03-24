import { Outlet } from "react-router-dom";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background font-sans">
      <AdminSidebar />
      <main className="flex-1 ml-56 min-h-screen bg-background">
        <Outlet />
      </main>
    </div>
  );
}
