// src/pages/ConsultationsPage.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollection, useFirestoreCRUD } from '../hooks/useFirestore';
import { Clock, Search, Plus, Edit2, Trash2, X, Check } from 'lucide-react';

const DAYS = ['Pirmadienis','Antradienis','Trečiadienis','Ketvirtadienis','Penktadienis'];

function ConsultationForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    teacher_name: initial.teacher_name || '',
    subject: initial.subject || '',
    day_of_week: initial.day_of_week || DAYS[0],
    time_start: initial.time_start || '',
    time_end: initial.time_end || '',
    room: initial.room || '',
    notes: initial.notes || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="con-form">
      <div className="form-row">
        <div className="form-group">
          <label>Mokytojas</label>
          <input value={form.teacher_name} onChange={e => set('teacher_name', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Dalykas</label>
          <input value={form.subject} onChange={e => set('subject', e.target.value)} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Savaitės diena</label>
          <select value={form.day_of_week} onChange={e => set('day_of_week', e.target.value)}>
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Nuo</label>
          <input type="time" value={form.time_start} onChange={e => set('time_start', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Iki</label>
          <input type="time" value={form.time_end} onChange={e => set('time_end', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Kabinetas</label>
          <input value={form.room} onChange={e => set('room', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>Pastabos</label>
        <input value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>
      <div className="form-actions">
        <button className="btn-primary" onClick={() => onSave(form)}><Check size={14} /> Išsaugoti</button>
        <button className="btn-ghost" onClick={onCancel}><X size={14} /> Atšaukti</button>
      </div>
    </div>
  );
}

export default function ConsultationsPage() {
  const { isAdmin, schoolId } = useAuth();
  const { data: consultations, loading } = useCollection('consultations', schoolId, 'teacher_name');
  const { add, update, remove } = useFirestoreCRUD('consultations', schoolId);
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const todayIndex = new Date().getDay();
  const todayLT = todayIndex >= 1 && todayIndex <= 5 ? DAYS[todayIndex - 1] : null;

  const filtered = consultations.filter(c =>
    (!search || c.teacher_name?.toLowerCase().includes(search.toLowerCase()) || c.subject?.toLowerCase().includes(search.toLowerCase()))
    && (!selectedDay || c.day_of_week === selectedDay)
  );

  const grouped = DAYS.reduce((acc, day) => {
    const list = filtered.filter(c => c.day_of_week === day);
    if (list.length > 0) acc[day] = list;
    return acc;
  }, {});

  async function handleAdd(form) { await add(form); setShowAdd(false); }
  async function handleUpdate(id, form) { await update(id, form); setEditingId(null); }

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1>Konsultacijos</h1>
          <p className="page-sub">Mokytojų konsultacijų tvarkaraštis</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} /> Pridėti konsultaciją
          </button>
        )}
      </div>

      {showAdd && isAdmin && (
        <div className="card mb-6">
          <h3 className="card-title"><Plus size={16} /> Nauja konsultacija</h3>
          <ConsultationForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input placeholder="Ieškok mokytojo ar dalyko..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="filter-chips">
        <button className={`chip ${selectedDay === null ? 'active' : ''}`} onClick={() => setSelectedDay(null)}>Visos</button>
        {DAYS.map(day => (
          <button key={day}
            className={`chip ${selectedDay === day ? 'active' : ''} ${day === todayLT && selectedDay !== day ? 'today-chip' : ''}`}
            onClick={() => setSelectedDay(day === selectedDay ? null : day)}>
            {day.slice(0, 2)}
            {day === todayLT && <span className="today-dot" />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="empty-state"><Clock size={40} /><p>{search ? 'Nieko nerasta' : 'Konsultacijų dar nėra'}</p></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, list]) => (
            <div key={day}>
              <div className={`subject-header ${day === todayLT ? 'today-header' : ''}`}>
                <Clock size={14} />
                <span>{day}</span>
                {day === todayLT && <span className="today-pill">Šiandien</span>}
              </div>
              <div className="consultation-list">
                {list.map(c => (
                  editingId === c.id ? (
                    <div className="card" key={c.id}>
                      <ConsultationForm initial={c} onSave={f => handleUpdate(c.id, f)} onCancel={() => setEditingId(null)} />
                    </div>
                  ) : (
                    <div key={c.id} className="consultation-card">
                      <div className="con-avatar">{c.teacher_name?.[0] || '?'}</div>
                      <div className="con-info">
                        <p className="con-name">{c.teacher_name}</p>
                        <p className="con-subject">{c.subject}</p>
                        {c.notes && <p className="con-notes">{c.notes}</p>}
                      </div>
                      <div className="con-time">
                        {c.time_start && <span>{c.time_start}{c.time_end ? `–${c.time_end}` : ''}</span>}
                        {c.room && <span className="con-room">{c.room} kab.</span>}
                      </div>
                      {isAdmin && (
                        <div className="card-actions">
                          <button className="icon-btn" onClick={() => setEditingId(c.id)}><Edit2 size={14} /></button>
                          <button className="icon-btn danger" onClick={() => setConfirmDelete(c.id)}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Ištrinti konsultaciją?</h3>
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
