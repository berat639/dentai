"use client";

import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="admin-panel" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <header className="admin-header">
          <div className="header-title">
            <h1>Yönetim Paneli</h1>
            <p>DentAI Diş Kliniği</p>
          </div>

          <div className="header-actions">
            <div className="header-user">
              <div className="header-avatar">A</div>
              <span className="header-user-name">Admin</span>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              Çıkış Yap
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
