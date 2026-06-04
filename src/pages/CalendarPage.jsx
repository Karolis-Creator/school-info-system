// src/pages/CalendarPage.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollection, useFirestoreCRUD } from '../hooks/useFirestore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, parseISO, startOfDay } from 'date-fns';
import { lt } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X, Check, Clock, MapPin } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'exam', label: 'Egzaminas', color: '#8B2035' },
  { value: 'event', label: 'Renginys', color: '#2E5FA3' },
  { value: 'holiday', label: 'Atostogos', color: '#2A7A4B' },
  { value: 'meeting', label: 'Susirinkimas', color: '#7A5C2E' },
  { value: 'other', label: 'Kita', color: '#555' },
];

function getTypeColor(type) {
  return EVENT_TYPES.find(t => t.value === type)?.color || '#555';
}
function getTypeLabel(type) {
  return EVENT_TYPES.find(t => t.value === type)?.label || type;
}

function EventForm({ initial = {}, onSave, onCancel }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    title: initial.title || '',
    date: initial.date || today,
    end_date: initial.end_date || '',
    time: initial.time || '',
    location: initial.location || '',
    description: initial.description || '',
    type: initial.type || 'event',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="event-form">
      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label>Pavadinimas</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Tipas</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Data nuo</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Data iki (neprivaloma)</label>
          <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Laikas</label>
          <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Vieta</label>
          <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Kabineto nr. arba vieta" />
        </div>
      </div>
      <div className="form-group">
        <label>Aprašymas</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
      </div>
      <div className="form-actions">
        <button className="btn-primary" onClick={() => onSave(form)}><Check size={14} /> Išsaugoti</button>
        <button className="btn-ghost" onClick={onCancel}><X size={14} /> Atšaukti</button>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { isAdmin, schoolId } = useAuth();
  const { data: events, loading } = useCollection('events', schoolId, 'date');
  const { add, update, remove } = useFirestoreCRUD('events', schoolId);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentMonth) });
  const paddingDays = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;

  const eventsOnDate = (date) => events.filter(e => {
    try {
      const start = parseISO(e.date);
      const end = e.end_date ? parseISO(e.end_date) : start;
      const d = startOfDay(date);
      return isSameDay(d, start) || isSameDay(d, end) || (d > start && d < end);
    } catch { return false; }
  });

  const selectedEvents = eventsOnDate(selectedDate);

  async function handleAdd(form) {
    await add(form);
    setShowAdd(false);
  }

  async function handleUpdate(id, form) {
    await update(id, form);
    setEditingId(null);
  }

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1>Kalendorius</h1>
          <p className="page-sub">Renginiai ir svarbios datos</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} /> Pridėti renginį
          </button>
        )}
      </div>

      {showAdd && isAdmin && (
        <div className="card mb-6">
          <h3 className="card-title"><Plus size={16} /> Naujas renginys</h3>
          <EventForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      <div className="card mb-6">
        <div className="cal-nav">
          <button className="icon-btn" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={18} /></button>
          <h2 className="cal-month">{format(currentMonth, 'LLLL yyyy', { locale: lt })}</h2>
          <button className="icon-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={18} /></button>
        </div>
        <div className="cal-weekdays">
          {['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="cal-grid">
          {Array(paddingDays).fill(null).map((_, i) => <div key={`p${i}`} />)}
          {days.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const todayFlag = isToday(day);
            const dayEvents = eventsOnDate(day);
            return (
              <button key={day.toISOString()} className={`cal-day ${isSelected ? 'selected' : ''} ${todayFlag ? 'today' : ''}`}
                onClick={() => setSelectedDate(day)}>
                <span>{format(day, 'd')}</span>
                {dayEvents.length > 0 && (
                  <div className="cal-dots">
                    {dayEvents.slice(0, 3).map((ev, i) => (
                      <div key={i} className="cal-dot" style={{ background: getTypeColor(ev.type) }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <h3 className="section-date">{format(selectedDate, "EEEE, d MMMM", { locale: lt })}</h3>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : selectedEvents.length === 0 ? (
        <div className="empty-state"><Calendar size={36} /><p>Šią dieną renginių nėra</p></div>
      ) : (
        <div className="event-list">
          {selectedEvents.map(ev => (
            <div key={ev.id}>
              {editingId === ev.id ? (
                <div className="card">
                  <EventForm initial={ev} onSave={f => handleUpdate(ev.id, f)} onCancel={() => setEditingId(null)} />
                </div>
              ) : (
                <div className="event-card" style={{ borderLeftColor: getTypeColor(ev.type) }}>
                  <div className="event-type-badge" style={{ background: getTypeColor(ev.type) }}>
                    {getTypeLabel(ev.type)}
                  </div>
                  <h4 className="event-title">{ev.title}</h4>
                  <div className="event-meta">
                    {ev.time && <span><Clock size={12} /> {ev.time}</span>}
                    {ev.location && <span><MapPin size={12} /> {ev.location}</span>}
                  </div>
                  {ev.description && <p className="event-desc">{ev.description}</p>}
                  {isAdmin && (
                    <div className="card-actions">
                      <button className="icon-btn" onClick={() => setEditingId(ev.id)}><Edit2 size={14} /></button>
                      <button className="icon-btn danger" onClick={() => setConfirmDelete(ev.id)}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Ištrinti renginį?</h3>
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
