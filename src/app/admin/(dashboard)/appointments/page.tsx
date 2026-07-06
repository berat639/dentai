"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/admin/Modal";

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  treatmentType: string;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  source: string;
  createdAt: string;
}

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Bekliyor", cls: "pending" },
  confirmed: { label: "Onaylandı", cls: "confirmed" },
  completed: { label: "Tamamlandı", cls: "completed" },
  cancelled: { label: "İptal", cls: "cancelled" },
};

const sourceMap: Record<string, string> = {
  phone: "📞 Telefon",
  web: "🌐 Web",
  admin: "👤 Admin",
};

const emptyForm = {
  patientName: "",
  patientPhone: "",
  patientEmail: "",
  treatmentType: "",
  date: "",
  time: "",
  notes: "",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/admin/appointments?${params}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };

  const openEdit = (apt: Appointment) => {
    setForm({
      patientName: apt.patientName,
      patientPhone: apt.patientPhone,
      patientEmail: apt.patientEmail || "",
      treatmentType: apt.treatmentType,
      date: apt.date.split("T")[0],
      time: apt.time,
      notes: apt.notes || "",
    });
    setEditingId(apt.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/appointments/${editingId}` : "/api/admin/appointments";
      await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setModalOpen(false);
      fetchAppointments();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/appointments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAppointments();
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm("Bu randevuyu silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/appointments/${id}`, { method: "DELETE" });
    fetchAppointments();
  };

  const filters = [
    { value: "all", label: "Tümü" },
    { value: "pending", label: "Bekliyor" },
    { value: "confirmed", label: "Onaylandı" },
    { value: "completed", label: "Tamamlandı" },
    { value: "cancelled", label: "İptal" },
  ];

  return (
    <div style={{ animation: "adminFadeIn 0.4s ease-out" }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Randevular</h2>
          <p className="admin-page-subtitle">Tüm randevularınızı yönetin</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Yeni Randevu
        </button>
      </div>

      <div className="filter-bar">
        {filters.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={`filter-pill${filter === f.value ? " active" : ""}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-spinner">
            <svg viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          </div>
        ) : appointments.length === 0 ? (
          <div className="admin-empty">Randevu bulunamadı</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hasta</th><th>Tedavi</th><th>Tarih</th><th>Saat</th><th>Durum</th><th>Kaynak</th><th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => {
                const s = statusMap[apt.status] || statusMap.pending;
                return (
                  <tr key={apt.id}>
                    <td>
                      <div style={{ color: "var(--admin-text)", fontWeight: 600 }}>{apt.patientName}</div>
                      <div style={{ color: "var(--admin-text-muted)", fontSize: "11px", marginTop: "2px" }}>{apt.patientPhone}</div>
                    </td>
                    <td>{apt.treatmentType}</td>
                    <td>{new Date(apt.date).toLocaleDateString("tr-TR")}</td>
                    <td>{apt.time}</td>
                    <td>
                      <select
                        value={apt.status}
                        onChange={(e) => updateStatus(apt.id, e.target.value)}
                        className={`badge ${s.cls}`}
                        style={{ border: "none", cursor: "pointer", outline: "none", appearance: "auto", paddingRight: "4px" }}
                      >
                        <option value="pending">Bekliyor</option>
                        <option value="confirmed">Onaylandı</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="cancelled">İptal</option>
                      </select>
                    </td>
                    <td style={{ fontSize: "12px" }}>{sourceMap[apt.source] || apt.source}</td>
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button onClick={() => openEdit(apt)} className="action-btn edit">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button onClick={() => deleteAppointment(apt.id)} className="action-btn delete">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Randevu Düzenle" : "Yeni Randevu"}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="admin-form-group">
              <label className="admin-label">Hasta Adı *</label>
              <input type="text" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} required className="admin-input" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Telefon *</label>
              <input type="tel" value={form.patientPhone} onChange={(e) => setForm({ ...form, patientPhone: e.target.value })} required className="admin-input" />
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Email</label>
            <input type="email" value={form.patientEmail} onChange={(e) => setForm({ ...form, patientEmail: e.target.value })} className="admin-input" />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Tedavi Türü *</label>
            <input type="text" value={form.treatmentType} onChange={(e) => setForm({ ...form, treatmentType: e.target.value })} required placeholder="Dolgu, Kanal Tedavisi, vs." className="admin-input" />
          </div>
          <div className="form-row">
            <div className="admin-form-group">
              <label className="admin-label">Tarih *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="admin-input" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Saat *</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required className="admin-input" />
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Notlar</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="admin-textarea" />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">İptal</button>
            <button type="submit" disabled={saving} className="btn-primary" style={saving ? { opacity: 0.6 } : {}}>
              {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
