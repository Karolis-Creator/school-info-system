// src/pages/AnnouncementsPage.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollection, useFirestoreCRUD } from '../hooks/useFirestore';
import { isToday, isAfter, isBefore, startOfDay, parseISO } from 'date-fns';
import { Megaphone, Plus, Edit2, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';

const TYPES = ['Pamokų pakeitimas', 'Mokytojo nebuvimas', 'Kabineto keitimas', 'Renginys', 'Kita'];

function AnnouncementForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    content: initial.content || '',
    date: initial.date || format(new Date(), 'yyyy-MM-dd'),
    type: initial.type || TYPES[0],
    urgent: initial.urgent || false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="ann-form">
      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label>Antraštė</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Tipas</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Data</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </div>
      </div>
      <div className="form-group">
        <label>Turinys</label>
        <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={3} required />
      </div>
      <label className="urgent-toggle">
        <input type="checkbox" checked={form.urgent} onChange={e => set('urgent', e.target.checked)} />
        <span>⚠️ Skubus skelbimas</span>
      </label>
      <div className="form-actions">
        <button className="btn-primary" onClick={() => onSave(form)}><Check size={14} /> Išsaugoti</button>
        <button className="btn-ghost" onClick={onCancel}><X size={14} /> Atšaukti</button>
      </div>
    </div>
  );
}

function AnnouncementCard({ ann, isAdmin, onEdit, onDelete }) {
  return (
    <div className={`ann-card ${ann.urgent ? 'urgent' : ''}`}>
      {ann.urgent && <div className="urgent-banner"><AlertTriangle size={12} /> Skubus</div>}
      <div className="ann-header">
        <span className="ann-type-badge">{ann.type}</span>
        <span className="ann-date">{format(parseISO(ann.date), 'd MMMM', { locale: lt })}</span>
      </div>
      <h4 className="ann-title">{ann.title}</h4>
      <p className="ann-content">{ann.content}</p>
      {isAdmin && (
        <div className="card-actions">
          <button className="icon-btn" onClick={onEdit}><Edit2 size={14} /></button>
          <button className="icon-btn danger" onClick={onDelete}><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  );
}

export default function AnnouncementsPage() {
  const { isAdmin, schoolId } = useAuth();
  const { data: announcements, loading } = useCollection('announcements', schoolId, 'date');
  const { add, update, remove } = useFirestoreCRUD('announcements', schoolId);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const today = startOfDay(new Date());
  const todayA = announcements.filter(a => { try { return isToday(parseISO(a.date)); } catch { return false; } });
  const upcomingA = announcements.filter(a => { try { return isAfter(parseISO(a.date), today) && !isToday(parseISO(a.date)); } catch { return false; } });
  const pastA = announcements.filter(a => { try { return isBefore(parseISO(a.date), today) && !isToday(parseISO(a.date)); } catch { return false; } });

  async function handleAdd(form) { await add(form); setShowAdd(false); }
  async function handleUpdate(id, form) { await update(id, form); setEditingId(null); }

  function Section({ title, items, dot }) {
    if (items.length === 0) return null;
    return (
      <div className="ann-section">
        <div className="ann-section-header">
          {dot && <div className="pulse-dot" />}
          <h2>{title}</h2>
          <span className="count-badge">{items.length}</span>
        </div>
        <div className="ann-list">
          {items.map(a => (
            editingId === a.id ? (
              <div className="card" key={a.id}>
                <AnnouncementForm initial={a} onSave={f => handleUpdate(a.id, f)} onCancel={() => setEditingId(null)} />
              </div>
            ) : (
              <AnnouncementCard key={a.id} ann={a} isAdmin={isAdmin}
                onEdit={() => setEditingId(a.id)}
                onDelete={() => setConfirmDelete(a.id)} />
            )
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1>Skelbimai</h1>
          <p className="page-sub">Pamokų pakeitimai ir svarbi informacija</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} /> Naujas skelbimas
          </button>
        )}
      </div>

      {showAdd && isAdmin && (
        <div className="card mb-6">
          <h3 className="card-title"><Plus size={16} /> Naujas skelbimas</h3>
          <AnnouncementForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : announcements.length === 0 ? (
        <div className="empty-state"><Megaphone size={40} /><p>Skelbimų kol kas nėra</p></div>
      ) : (
        <>
          <Section title="Šiandien" items={todayA} dot />
          <Section title="Artėjantys" items={upcomingA} />
          <Section title="Praeiti" items={pastA} />
        </>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Ištrinti skelbimą?</h3>
            <div className="modal-actions">
              <button className="btn-danger" onClick={async () => { await remove(confirmDelete); setConfirmDelete(null); }}>Ištrinti</button>
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Atšaukti</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
