"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/admin/Modal";

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

const categoryMap: Record<string, { label: string; emoji: string; color: string }> = {
  genel: { label: "Genel", emoji: "📋", color: "#3b82f6" },
  tedavi: { label: "Tedavi", emoji: "🦷", color: "#8b5cf6" },
  sss: { label: "SSS", emoji: "❓", color: "#f59e0b" },
  acil: { label: "Acil", emoji: "🚨", color: "#ef4444" },
  bakim: { label: "Bakım", emoji: "✨", color: "#22c55e" },
};

const emptyForm = { title: "", content: "", category: "genel" };

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("all");

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/knowledge");
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (entry: KnowledgeEntry) => {
    setForm({ title: entry.title, content: entry.content, category: entry.category });
    setEditingId(entry.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/knowledge/${editingId}` : "/api/admin/knowledge";
      await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setModalOpen(false);
      fetchEntries();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/knowledge/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Bu bilgi kaydını silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
    fetchEntries();
  };

  const filtered = filterCat === "all" ? entries : entries.filter((e) => e.category === filterCat);

  return (
    <div style={{ animation: "adminFadeIn 0.4s ease-out" }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Bilgi Tabanı</h2>
          <p className="admin-page-subtitle">Asistanın kullanacağı bilgi kayıtlarını yönetin</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Yeni Kayıt
        </button>
      </div>

      <div className="info-banner">
        💡 <strong>Bilgi Tabanı</strong>, DentAI asistanının hasta sorularını cevaplarken kullandığı kaynaklardır. Buraya eklediğiniz bilgiler otomatik olarak asistanın bilgi havuzuna dahil edilir.
      </div>

      <div className="filter-bar">
        <button onClick={() => setFilterCat("all")} className={`filter-pill${filterCat === "all" ? " active" : ""}`}>
          Tümü ({entries.length})
        </button>
        {Object.entries(categoryMap).map(([key, cat]) => {
          const count = entries.filter((e) => e.category === key).length;
          return (
            <button key={key} onClick={() => setFilterCat(key)} className={`filter-pill${filterCat === key ? " active" : ""}`} style={filterCat === key ? { background: `${cat.color}12`, color: cat.color, borderColor: `${cat.color}30` } : {}}>
              {cat.emoji} {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="admin-spinner"><svg viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
      ) : filtered.length === 0 ? (
        <div className="admin-card"><div className="admin-empty">{filterCat === "all" ? "Henüz bilgi kaydı eklenmemiş" : "Bu kategoride kayıt yok"}</div></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "relative", zIndex: 1 }}>
          {filtered.map((entry) => {
            const cat = categoryMap[entry.category] || categoryMap.genel;
            return (
              <div key={entry.id} className={`knowledge-card${!entry.isActive ? " inactive" : ""}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="cat-badge" style={{ background: `${cat.color}15`, color: cat.color }}>{cat.emoji} {cat.label}</span>
                    {!entry.isActive && <span className="cat-badge" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", fontSize: "10px" }}>Deaktif</span>}
                  </div>
                  <div style={{ display: "flex", gap: "2px" }}>
                    <button onClick={() => openEdit(entry)} className="action-btn edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button onClick={() => toggleActive(entry.id, entry.isActive)} className="action-btn toggle" style={{ color: entry.isActive ? "var(--admin-green)" : "var(--admin-text-muted)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {entry.isActive ? <><circle cx="12" cy="12" r="3" /><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /></> : <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22" />}
                      </svg>
                    </button>
                    <button onClick={() => deleteEntry(entry.id)} className="action-btn delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--admin-text)", marginBottom: "8px", letterSpacing: "-0.01em" }}>{entry.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--admin-text-dim)", whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
                  {entry.content.length > 280 ? entry.content.slice(0, 280) + "..." : entry.content}
                </p>
                <p style={{ fontSize: "11px", color: "var(--admin-text-muted)", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--admin-border)" }}>
                  Oluşturulma: {new Date(entry.createdAt).toLocaleDateString("tr-TR")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Bilgi Kaydı Düzenle" : "Yeni Bilgi Kaydı"} maxWidth="600px">
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-label">Başlık *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Ör: Diş Beyazlatma Hakkında" className="admin-input" />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Kategori</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="admin-select">
              <option value="genel">📋 Genel</option><option value="tedavi">🦷 Tedavi</option><option value="sss">❓ SSS</option><option value="acil">🚨 Acil</option><option value="bakim">✨ Bakım</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">İçerik *</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required rows={8} placeholder="Asistanın hastaya aktaracağı bilgiyi buraya yazın..." className="admin-textarea" />
            <p style={{ fontSize: "11px", color: "var(--admin-text-muted)", marginTop: "6px" }}>Bu içerik DentAI asistanına otomatik olarak aktarılacaktır.</p>
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
