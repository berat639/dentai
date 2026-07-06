"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StatsData {
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  totalTreatments: number;
  totalKnowledge: number;
}

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  treatmentType: string;
  date: string;
  time: string;
  status: string;
}

interface DashboardData {
  stats: StatsData;
  recentAppointments: Appointment[];
}

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Bekliyor", cls: "pending" },
  confirmed: { label: "Onaylandı", cls: "confirmed" },
  completed: { label: "Tamamlandı", cls: "completed" },
  cancelled: { label: "İptal", cls: "cancelled" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="admin-spinner">
        <svg viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ animation: "adminFadeIn 0.4s ease-out" }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Klinik Durum Raporu</h2>
          <p className="admin-page-subtitle">Kliniğinizin genel durumuna göz atın</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="stat-value">{data.stats.totalAppointments}</div>
          <div className="stat-label">Toplam Randevu</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="stat-value">{data.stats.todayAppointments}</div>
          <div className="stat-label">Bugünkü Randevu</div>
        </div>

        <div className="stat-card amber">
          <div className="stat-icon amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="stat-value">{data.stats.pendingAppointments}</div>
          <div className="stat-label">Bekleyen Randevu</div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C8 2 5 5 5 9c0 3 1.5 5 3 6.5S12 22 12 22s2.5-3.5 4-5.5S19 12 19 9c0-4-3-7-7-7z" />
              <circle cx="12" cy="9" r="2" />
            </svg>
          </div>
          <div className="stat-value">{data.stats.totalTreatments}</div>
          <div className="stat-label">Aktif Tedavi</div>
          <div className="stat-extra">{data.stats.totalKnowledge} bilgi kaydı</div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="table-section-header">
        <h3 className="table-section-title">Son Randevular</h3>
        <Link href="/admin/appointments" className="table-section-link">
          Tümünü Gör →
        </Link>
      </div>

      <div className="admin-table-wrap">
        {data.recentAppointments.length === 0 ? (
          <div className="admin-empty">Henüz randevu yok</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hasta</th>
                <th>Tedavi</th>
                <th>Tarih</th>
                <th>Saat</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAppointments.map((apt) => {
                const s = statusMap[apt.status] || statusMap.pending;
                return (
                  <tr key={apt.id}>
                    <td>
                      <div style={{ color: "var(--admin-text)", fontWeight: 600, fontSize: "13px" }}>
                        {apt.patientName}
                      </div>
                      <div style={{ color: "var(--admin-text-muted)", fontSize: "11px", marginTop: "2px" }}>
                        {apt.patientPhone}
                      </div>
                    </td>
                    <td>{apt.treatmentType}</td>
                    <td>{new Date(apt.date).toLocaleDateString("tr-TR")}</td>
                    <td>{apt.time}</td>
                    <td>
                      <span className={`badge ${s.cls}`}>{s.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
