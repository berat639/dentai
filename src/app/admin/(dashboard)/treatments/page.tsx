"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/admin/Modal";

interface Treatment {
  id: string;
  name: string;
  description: string | null;
  minPrice: number;
  maxPrice: number;
  duration: string | null;
  category: string;
  isActive: boolean;
}

const categoryMap: Record<string, { label: string; color: string }> = {
  genel: { label: "Genel", color: "#3b82f6" },
  cerrahi: { label: "Cerrahi", color: "#ef4444" },
  estetik: { label: "Estetik", color: "#ec4899" },
  ortodonti: { label: "Ortodonti", color: "#8b5cf6" },
  protez: { label: "Protez", color: "#f59e0b" },
};

const emptyForm = { name: "", description: "", minPrice: "", maxPrice: "", duration: "", category: "genel" };

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTreatments = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/treatments");
      const data = await res.json();
      setTreatments(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTreatments(); }, [fetchTreatments]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (t: Treatment) => {
    setForm({ name: t.name, description: t.description || "", minPrice: t.minPrice.toString(), maxPrice: t.maxPrice.toString(), duration: t.duration || "", category: t.category });
    setEditingId(t.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/treatments/${editingId}` : "/api/admin/treatments";
      await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setModalOpen(false);
      fetchTreatments();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/treatments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
    fetchTreatments();
  };

  const deleteTreatment = async (id: string) => {
    if (!confirm("Bu tedaviyi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/treatments/${id}`, { method: "DELETE" });
    fetchTreatments();
  };

  const formatPrice = (p: number) => new Intl.NumberFormat("tr-TR").format(p);

  return (
    <div style={{ animation: "adminFadeIn 0.4s ease-out" }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Tedaviler ve Fiyatlar</h2>
          <p className="admin-page-subtitle">Tedavi türlerini ve fiyat aralıklarını yönetin</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Yeni Tedavi
        </button>
      </div>

      {loading ? (
        <div className="admin-spinner"><svg viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
      ) : treatments.length === 0 ? (
        <div className="admin-card"><div className="admin-empty">Henüz tedavi eklenmemiş</div></div>
      ) : (
        <div className="treatments-grid">
          {treatments.map((t) => {
            const cat = categoryMap[t.category] || categoryMap.genel;
            return (
              <div key={t.id} className={`treatment-card cat-${t.category}${!t.isActive ? " inactive" : ""}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <span className="cat-badge" style={{ background: `${cat.color}15`, color: cat.color }}>{cat.label}</span>
                  <div style={{ display: "flex", gap: "2px" }}>
                    <button onClick={() => openEdit(t)} className="action-btn edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button onClick={() => toggleActive(t.id, t.isActive)} className="action-btn toggle" style={{ color: t.isActive ? "var(--admin-green)" : "var(--admin-text-muted)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {t.isActive ? <><circle cx="12" cy="12" r="3" /><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /></> : <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22" />}
                      </svg>
                    </button>
                    <button onClick={() => deleteTreatment(t.id)} className="action-btn delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--admin-text)", marginBottom: "4px", letterSpacing: "-0.01em" }}>{t.name}</h3>
                {t.description && <p style={{ fontSize: "12px", color: "var(--admin-text-muted)", lineHeight: 1.5, marginBottom: "12px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.description}</p>}

                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--admin-border)" }}>
                  <span className="treatment-price">{formatPrice(t.minPrice)} - {formatPrice(t.maxPrice)} ₺</span>
                  {t.duration && <span style={{ fontSize: "11px", color: "var(--admin-text-muted)", background: "rgba(255,255,255,0.03)", padding: "4px 8px", borderRadius: "6px" }}>⏱ {t.duration}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Tedavi Düzenle" : "Yeni Tedavi"}>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-label">Tedavi Adı *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ör: Dolgu (Kompozit)" className="admin-input" />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Açıklama</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="admin-textarea" />
          </div>
          <div className="form-row">
            <div className="admin-form-group">
              <label className="admin-label">Min Fiyat (₺) *</label>
              <input type="number" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} required className="admin-input" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Max Fiyat (₺) *</label>
              <input type="number" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} required className="admin-input" />
            </div>
          </div>
          <div className="form-row">
            <div className="admin-form-group">
              <label className="admin-label">Süre</label>
              <input type="text" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Ör: 30-60 dakika" className="admin-input" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Kategori</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="admin-select">
                <option value="genel">Genel</option><option value="cerrahi">Cerrahi</option><option value="estetik">Estetik</option><option value="ortodonti">Ortodonti</option><option value="protez">Protez</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">İptal</button>
            <button type="submit" disabled={saving} className="btn-primary" style={saving ? { opacity: 0.6 } : {}}>{saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
