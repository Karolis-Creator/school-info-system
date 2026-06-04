// src/pages/SuperAdminPage.jsx
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, School, Key, User, RefreshCw, Check, X } from 'lucide-react';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function SuperAdminPage() {
  const { registerAdmin } = useAuth();
  const [schools, setSchools] = useState([]);
  const [showNewSchool, setShowNewSchool] = useState(false);
  const [showNewAdmin, setShowNewAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  // New school form
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState(generateCode());

  // New admin form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminSchoolId, setAdminSchoolId] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'schools'), snap => {
      setSchools(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleCreateSchool(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'schools'), {
        name: schoolName,
        accessCode: schoolCode,
        createdAt: serverTimestamp(),
        active: true,
      });
      showToast(`Mokykla "${schoolName}" sukurta! Kodas: ${schoolCode}`);
      setSchoolName(''); setSchoolCode(generateCode()); setShowNewSchool(false);
    } catch (err) {
      showToast('Klaida: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAdmin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await registerAdmin(adminEmail, adminPass, adminName, adminSchoolId);
      showToast(`Administratorius "${adminName}" sukurtas!`);
      setAdminEmail(''); setAdminPass(''); setAdminName(''); setAdminSchoolId('');
      setShowNewAdmin(false);
    } catch (err) {
      showToast('Klaida: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSchool(id, current) {
    await updateDoc(doc(db, 'schools', id), { active: !current });
  }

  return (
    <div className="sa-root">
      {toast && <div className="sa-toast">{toast}</div>}

      <div className="sa-header">
        <div>
          <h1>⚡ Super Administratorius</h1>
          <p>Mokyklų ir administratorių valdymas</p>
        </div>
        <div className="sa-header-actions">
          <button className="sa-btn" onClick={() => setShowNewSchool(!showNewSchool)}>
            <Plus size={16} /> Nauja mokykla
          </button>
          <button className="sa-btn secondary" onClick={() => setShowNewAdmin(!showNewAdmin)}>
            <User size={16} /> Naujas admin
          </button>
        </div>
      </div>

      {showNewSchool && (
        <div className="sa-panel">
          <h2><School size={18} /> Sukurti mokyklą</h2>
          <form onSubmit={handleCreateSchool} className="sa-form">
            <div className="form-row">
              <div className="form-group">
                <label>Mokyklos pavadinimas</label>
                <input value={schoolName} onChange={e => setSchoolName(e.target.value)}
                  placeholder="Vilniaus 1-oji gimnazija" required />
              </div>
              <div className="form-group">
                <label>Prisijungimo kodas</label>
                <div className="code-row">
                  <input value={schoolCode} onChange={e => setSchoolCode(e.target.value.toUpperCase())}
                    required maxLength={12} />
                  <button type="button" className="refresh-btn" onClick={() => setSchoolCode(generateCode())}>
                    <RefreshCw size={14} />
                  </button>
                </div>
                <span className="form-hint">Mokiniai naudos šį kodą prisijungimui</span>
              </div>
            </div>
            <div className="sa-form-actions">
              <button type="submit" className="sa-btn" disabled={loading}>Sukurti</button>
              <button type="button" className="sa-btn ghost" onClick={() => setShowNewSchool(false)}>Atšaukti</button>
            </div>
          </form>
        </div>
      )}

      {showNewAdmin && (
        <div className="sa-panel">
          <h2><Lock size={18} /> Registruoti administratorių</h2>
          <form onSubmit={handleCreateAdmin} className="sa-form">
            <div className="form-row">
              <div className="form-group">
                <label>Vardas Pavardė</label>
                <input value={adminName} onChange={e => setAdminName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>El. paštas</label>
                <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Slaptažodis</label>
                <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)}
                  required minLength={6} />
              </div>
              <div className="form-group">
                <label>Mokykla</label>
                <select value={adminSchoolId} onChange={e => setAdminSchoolId(e.target.value)} required>
                  <option value="">— Pasirinkite —</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="sa-form-actions">
              <button type="submit" className="sa-btn" disabled={loading}>Registruoti</button>
              <button type="button" className="sa-btn ghost" onClick={() => setShowNewAdmin(false)}>Atšaukti</button>
            </div>
          </form>
        </div>
      )}

      <h2 className="sa-section-title">Mokyklos ({schools.length})</h2>
      <div className="sa-schools-grid">
        {schools.map(s => (
          <div key={s.id} className={`sa-school-card ${s.active ? 'active' : 'inactive'}`}>
            <div className="sa-school-header">
              <School size={20} />
              <h3>{s.name}</h3>
              <button
                className={`status-toggle ${s.active ? 'on' : 'off'}`}
                onClick={() => toggleSchool(s.id, s.active)}
              >
                {s.active ? <Check size={12} /> : <X size={12} />}
                {s.active ? 'Aktyvi' : 'Neaktyvi'}
              </button>
            </div>
            <div className="sa-school-code">
              <Key size={14} />
              <span>Kodas:</span>
              <code>{s.accessCode}</code>
            </div>
            <div className="sa-school-id">
              <span>ID: {s.id}</span>
            </div>
          </div>
        ))}
        {schools.length === 0 && (
          <div className="sa-empty">Mokyklų dar nėra. Sukurkite pirmą!</div>
        )}
      </div>
    </div>
  );
}
