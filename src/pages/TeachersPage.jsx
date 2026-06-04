// src/pages/TeachersPage.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollection, useFirestoreCRUD } from '../hooks/useFirestore';
import { Users, Search, MapPin, BookOpen, Plus, Edit2, Trash2, X, Check } from 'lucide-react';

const BUILDINGS = ['Baltas korpusas', 'Raudonas korpusas'];

function TeacherForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    subject: initial.subject || '',
    room: initial.room || '',
    building: initial.building || BUILDINGS[0],
    phone: initial.phone || '',
    email: initial.email || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="teacher-form">
      <div className="form-row">
        <div className="form-group">
          <label>Vardas Pavardė</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Dalykas</label>
          <input value={form.subject} onChange={e => set('subject', e.target.value)} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Kabineto numeris</label>
          <input value={form.room} onChange={e => set('room', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Korpusas</label>
          <select value={form.building} onChange={e => set('building', e.target.value)}>
            {BUILDINGS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>El. paštas</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Telefonas</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn-primary" onClick={() => onSave(form)}><Check size={14} /> Išsaugoti</button>
        <button className="btn-ghost" onClick={onCancel}><X size={14} /> Atšaukti</button>
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const { isAdmin, schoolId } = useAuth();
  const { data: teachers, loading } = useCollection('teachers', schoolId, 'name');
  const { add, update, remove } = useFirestoreCRUD('teachers', schoolId);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const subjects = [...new Set(teachers.map(t => t.subject))].sort();

  const filtered = teachers.filter(t => {
    const q = search.toLowerCase();
    return (!search || t.name?.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q) || t.room?.toLowerCase().includes(q))
      && (!selectedSubject || t.subject === selectedSubject);
  });

  const grouped = filtered.reduce((acc, t) => {
    if (!acc[t.subject]) acc[t.subject] = [];
    acc[t.subject].push(t);
    return acc;
  }, {});

  async function handleAdd(form) {
    await add(form);
    setShowAdd(false);
  }

  async function handleUpdate(id, form) {
    await update(id, form);
    setEditingId(null);
  }

  async function handleDelete(id) {
    await remove(id);
    setConfirmDelete(null);
  }

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1>Mokytojai</h1>
          <p className="page-sub">Mokytojų kabineto numeriai ir dalykai</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} /> Pridėti mokytoją
          </button>
        )}
      </div>

      {showAdd && isAdmin && (
        <div className="card mb-6">
          <h3 className="card-title"><Plus size={16} /> Naujas mokytojas</h3>
          <TeacherForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          placeholder="Ieškok mokytojo ar dalyko..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-chips">
        <button className={`chip ${!selectedSubject ? 'active' : ''}`} onClick={() => setSelectedSubject(null)}>Visi</button>
        {subjects.map(s => (
          <button key={s} className={`chip ${selectedSubject === s ? 'active' : ''}`}
            onClick={() => setSelectedSubject(s === selectedSubject ? null : s)}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><Users size={40} /><p>Nieko nerasta</p></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([subject, list]) => (
            <div key={subject}>
              <div className="subject-header">
                <BookOpen size={14} />
                <span>{subject}</span>
                <span className="count-badge">{list.length}</span>
              </div>
              <div className="teacher-list">
                {list.map(t => (
                  <div key={t.id}>
                    {editingId === t.id ? (
                      <div className="card">
                        <TeacherForm initial={t}
                          onSave={(form) => handleUpdate(t.id, form)}
                          onCancel={() => setEditingId(null)} />
                      </div>
                    ) : (
                      <div className="teacher-card">
                        <div className="teacher-avatar">{(t.name?.split(' ')[0]?.[0] || '?')}</div>
                        <div className="teacher-info">
                          <p className="teacher-name">{t.name}</p>
                          <p className="teacher-subject">{t.subject}</p>
                          {t.email && <p className="teacher-email">{t.email}</p>}
                        </div>
                        {t.room && (
                          <div className="room-badge">
                            <MapPin size={11} />
                            <span>{t.room}</span>
                          </div>
                        )}
                        {t.building && <div className="building-tag">{t.building.includes('Baltas') ? '⬜' : '🟥'}</div>}
                        {isAdmin && (
                          <div className="card-actions">
                            <button className="icon-btn" onClick={() => setEditingId(t.id)}><Edit2 size={14} /></button>
                            <button className="icon-btn danger" onClick={() => setConfirmDelete(t.id)}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Ištrinti mokytoją?</h3>
            <p>Šio veiksmo negalėsite atšaukti.</p>
            <div className="modal-actions">
              <button className="btn-danger" onClick={() => handleDelete(confirmDelete)}>Ištrinti</button>
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Atšaukti</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
