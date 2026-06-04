// src/components/AppLayout.jsx
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Map, Calendar, Clock, Megaphone, Users, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/', icon: Map, label: 'Žemėlapis' },
  { path: '/kalendorius', icon: Calendar, label: 'Kalendorius' },
  { path: '/konsultacijos', icon: Clock, label: 'Konsultacijos' },
  { path: '/skelbimai', icon: Megaphone, label: 'Skelbimai' },
  { path: '/mokytojai', icon: Users, label: 'Mokytojai' },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, isSuperAdmin, isAdmin, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🏫</div>
          <div>
            <h1 className="brand-title">Mokykla</h1>
            <p className="brand-sub">Mokinio pagalbininkas</p>
          </div>
        </div>

        {userData && (
          <div className="sidebar-user">
            <div className="user-avatar">{userData.displayName?.[0] || '?'}</div>
            <div>
              <p className="user-name">{userData.displayName}</p>
              <p className="user-role">
                {isSuperAdmin ? '⚡ Super Admin' : isAdmin ? '🔑 Administratorius' : '👤 Mokinys'}
              </p>
            </div>
          </div>
        )}

        <div className="nav-items">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {isSuperAdmin && (
            <Link to="/superadmin" className={`nav-item superadmin ${location.pathname === '/superadmin' ? 'active' : ''}`}>
              <Shield size={18} />
              <span>Super Admin</span>
            </Link>
          )}
          {isAdmin && !isSuperAdmin && (
            <Link to="/admin" className={`nav-item admin-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              <Settings size={18} />
              <span>Administravimas</span>
            </Link>
          )}
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Atsijungti</span>
        </button>
      </nav>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`mobile-nav-item ${isActive ? 'active' : ''}`}>
              <div className={`mobile-nav-icon ${isActive ? 'active' : ''}`}>
                <item.icon size={20} />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
