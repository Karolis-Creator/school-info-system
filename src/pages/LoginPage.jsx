// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { School, Lock, User, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { registerStudent, loginStudent, loginAdmin } = useAuth();
  const [role, setRole] = useState('student');       // 'student' | 'admin'
  const [subMode, setSubMode] = useState('login');   // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Student-only
  const [displayName, setDisplayName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');

  function switchRole(r) { setRole(r); setSubMode('login'); setError(''); }
  function switchSub(s) { setSubMode(s); setError(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (role === 'admin') {
        await loginAdmin(email, password);
      } else if (subMode === 'register') {
        await registerStudent(schoolCode, displayName, email, password);
      } else {
        await loginStudent(email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim());
    } finally {
      setLoading(false);
    }
  }

  const isRegister = role === 'student' && subMode === 'register';

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="login-orb orb1" />
        <div className="login-orb orb2" />
        <div className="login-orb orb3" />
      </div>

      <div className="login-card">
        <div className="login-logo"><School size={32} /></div>
        <h1 className="login-title">Mokyklos sistema</h1>
        <p className="login-sub">Mokinio pagalbininkas</p>

        {/* Role tabs */}
        <div className="login-tabs">
          <button className={`login-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => switchRole('student')}>
            <User size={14} /> Mokinys
          </button>
          <button className={`login-tab ${role === 'admin' ? 'active' : ''}`}
            onClick={() => switchRole('admin')}>
            <Lock size={14} /> Administratorius
          </button>
        </div>

        {/* Student sub-tabs */}
        {role === 'student' && (
          <div className="sub-tabs">
            <button className={`sub-tab ${subMode === 'login' ? 'active' : ''}`}
              onClick={() => switchSub('login')}>
              <LogIn size={13} /> Prisijungti
            </button>
            <button className={`sub-tab ${subMode === 'register' ? 'active' : ''}`}
              onClick={() => switchSub('register')}>
              <UserPlus size={13} /> Registruotis
            </button>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label>Mokyklos kodas</label>
                <input type="text" value={schoolCode}
                  onChange={e => setSchoolCode(e.target.value.toUpperCase())}
                  placeholder="pvz. VILNIUS2024" required maxLength={20} />
                <span className="form-hint">Kodą suteikia mokyklos administratorius</span>
              </div>
              <div className="form-group">
                <label>Vardas Pavardė</label>
                <input type="text" value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Jonas Jonaitis" required />
              </div>
            </>
          )}

          <div className="form-group">
            <label>El. paštas</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder={role === 'admin' ? 'admin@mokykla.lt' : 'mokinys@gmail.com'} required />
          </div>

          <div className="form-group">
            <label>Slaptažodis</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required minLength={6} />
            {isRegister && <span className="form-hint">Mažiausiai 6 simboliai</span>}
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="spin-sm" /> : isRegister
              ? <><UserPlus size={16} /> Sukurti paskyrą</>
              : <><ArrowRight size={16} /> Prisijungti</>}
          </button>
        </form>

        {role === 'student' && (
          <p className="login-switch">
            {subMode === 'login'
              ? <>Neturi paskyros? <button onClick={() => switchSub('register')}>Registruokis</button></>
              : <>Jau turi paskyrą? <button onClick={() => switchSub('login')}>Prisijunk</button></>}
          </p>
        )}
      </div>
    </div>
  );
}
