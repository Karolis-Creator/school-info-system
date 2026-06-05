import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Settings, School, Key, RefreshCw, Users, Calendar, Megaphone, Clock } from 'lucide-react';
import { useCollection } from '../hooks/useFirestore';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function AdminPage() {
  const { userData, schoolId } = useAuth();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [toast, setToast] = useState('');

  const { data: teachers } = useCollection('teachers', schoolId);
  const { data: events } = useCollection('events', schoolId);
  const { data: announcements } = useCollection('announcements', schoolId);
  const { data: consultations } = useCollection('consultations', schoolId);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    getDoc(doc(db, 'schools', schoolId)).then(snap => {
      if (snap.exists()) {
        setSchool({ id: snap.id, ...snap.data() });
        setNewCode(snap.data().accessCode);
      }
      setLoading(false);
    });
  }, [schoolId]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleUpdateCode() {
    if (!newCode.trim()) return;
    await updateDoc(doc(db, 'schools', schoolId), { accessCode: newCode.trim().toUpperCase() });
    setSchool(s => ({ ...s, accessCode: newCode.trim().toUpperCase() }));
    showToast('Kodas atnaujintas!');
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-root">
      {toast && <div className="sa-toast">{toast}</div>}
      <div className="page-header">
        <div>
          <h1>Administravimas</h1>
          <p className="page-sub">Mokyklos valdymo pultas</p>
        </div>
      </div>
      <div className="admin-stats">
        <div className="stat-card">
          <Users size={24} />
          <div>
            <p className="stat-num">{teachers.length}</p>
            <p className="stat-label">Mokytojai</p>
          </div>
        </div>
        <div className="stat-card">
          <Calendar size={24} />
          <div>
            <p className="stat-num">{events.length}</p>
            <p className="stat-label">Renginiai</p>
          </div>
        </div>
        <div className="stat-card">
          <Megaphone size={24} />
          <div>
            <p className="stat-num">{announcements.length}</p>
            <p className="stat-label">Skelbimai</p>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={24} />
          <div>
            <p className="stat-num">{consultations.length}</p>
            <p className="stat-label">Konsultacijos</p>
          </div>
        </div>
      </div>
      {school && (
        <div className="card mb-6">
          <h3 className="card-title"><School size={16} /> Mokyklos informacija</h3>
          <div className="admin-info-row">
            <span className="admin-info-label">Pavadinimas</span>
            <span className="admin-info-value">{school.name}</span>
          </div>
          <div className="admin-info-row">
            <span className="admin-info-label">Statusas</span>
            <span className={`status-toggle ${school.active ? 'on' : 'off'}`}>
              {school.active ? '✓ Aktyvi' : '✗ Neaktyvi'}
            </span>
          </div>
        </div>
      )}
      {school && (
        <div className="card mb-6">
          <h3 className="card-title"><Key size={16} /> Mokinių prisijungimo kodas</h3>
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Šį kodą duokite mokiniams kad jie galėtų registruotis
          </p>
          <div className="current-code">
            <code>{school.accessCode}</code>
          </div>
          <div className="code-change-row">
            <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} maxLength={12} />
            <button className="refresh-btn" onClick={() => setNewCode(generateCode())}><RefreshCw size={14} /></button>
            <button className="btn-primary" onClick={handleUpdateCode}>Atnaujinti</button>
          </div>
        </div>
      )}
      <div className="card">
        <h3 className="card-title"><Settings size={16} /> Jūsų paskyra</h3>
        <div className="admin-info-row">
          <span className="admin-info-label">Vardas</span>
          <span className="admin-info-value">{userData?.displayName}</span>
        </div>
        <div className="admin-info-row">
          <span className="admin-info-label">El. paštas</span>
          <span className="admin-info-value">{userData?.email}</span>
        </div>
        <div className="admin-info-row">
          <span className="admin-info-label">Rolė</span>
          <span className="admin-info-value">🔑 Administratorius</span>
        </div>
      </div>
    </div>
  );
}
