// src/pages/MapPage.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollection } from '../hooks/useFirestore';
import { Search, MapPin, Building, ChevronRight } from 'lucide-react';

// Floor plan images — host these in Firebase Storage or public folder
// For now we'll use the uploaded evacuation map images as floor reference
const FLOOR_PLANS = {
  white: {
    1: null, // Will be set from Firebase Storage or direct URL
    2: null,
    3: null,
  },
  red: {
    1: null,
    2: null,
    3: null,
  }
};

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function MapPage() {
  const { schoolId } = useAuth();
  const { data: teachers, loading } = useCollection('teachers', schoolId, 'name');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedBuilding, setSelectedBuilding] = useState('white');
  const [highlighted, setHighlighted] = useState(null);

  function handleSearch(q) {
    setSearch(q);
    if (!q.trim()) { setResults([]); return; }
    const nq = norm(q);
    const matches = teachers.filter(t =>
      norm(t.name).includes(nq) ||
      norm(t.subject).includes(nq) ||
      norm(t.room).includes(nq)
    );
    setResults(matches);
  }

  function selectTeacher(t) {
    setHighlighted(t);
    setSearch(t.name);
    setResults([]);
    // Auto-switch to correct floor based on room number prefix
    if (t.room) {
      const prefix = parseInt(t.room?.toString()[0]);
      if (prefix >= 1 && prefix <= 3) setSelectedFloor(prefix);
      if (t.room?.toString().startsWith('1') || t.room?.toString().startsWith('2') || t.room?.toString().startsWith('3')) {
        // White korpusas rooms typically 100–399
        setSelectedBuilding('white');
      }
    }
    if (t.building?.includes('Raudonas')) setSelectedBuilding('red');
  }

  const buildingLabel = selectedBuilding === 'white' ? 'Baltas korpusas' : 'Raudonas korpusas';

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1>Kabinetų žemėlapis</h1>
          <p className="page-sub">Surask kabinetą ar mokytoją</p>
        </div>
      </div>

      <div className="search-bar map-search" style={{ position: 'relative' }}>
        <Search size={18} className="search-icon" />
        <input
          placeholder="Mokytojo vardas, dalykas arba kabineto nr..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
        {results.length > 0 && (
          <div className="search-dropdown">
            {results.map(t => (
              <button key={t.id} className="search-result-item" onClick={() => selectTeacher(t)}>
                <div className="sri-avatar">{t.name?.[0]}</div>
                <div className="sri-info">
                  <span className="sri-name">{t.name}</span>
                  <span className="sri-sub">{t.subject}</span>
                </div>
                {t.room && <span className="sri-room">{t.room}</span>}
                <ChevronRight size={14} className="sri-arrow" />
              </button>
            ))}
          </div>
        )}
      </div>

      {highlighted && (
        <div className="highlighted-teacher">
          <div className="ht-avatar">{highlighted.name?.[0]}</div>
          <div className="ht-info">
            <p className="ht-name">{highlighted.name}</p>
            <p className="ht-subject">{highlighted.subject}</p>
          </div>
          <div className="ht-location">
            <MapPin size={14} />
            <span>{highlighted.room} kab.</span>
          </div>
          <div className="ht-building">
            <Building size={14} />
            <span>{highlighted.building || 'Baltas korpusas'}</span>
          </div>
          <button className="ht-close" onClick={() => { setHighlighted(null); setSearch(''); }}>✕</button>
        </div>
      )}

      <div className="map-controls">
        <div className="building-tabs">
          <button className={`building-tab ${selectedBuilding === 'white' ? 'active' : ''}`}
            onClick={() => setSelectedBuilding('white')}>⬜ Baltas korpusas</button>
          <button className={`building-tab ${selectedBuilding === 'red' ? 'active' : ''}`}
            onClick={() => setSelectedBuilding('red')}>🟥 Raudonas korpusas</button>
        </div>
        <div className="floor-tabs">
          {[1, 2, 3].map(f => (
            <button key={f} className={`floor-tab ${selectedFloor === f ? 'active' : ''}`}
              onClick={() => setSelectedFloor(f)}>{f} aukštas</button>
          ))}
        </div>
      </div>

      <div className="floor-plan-container">
        <div className="floor-plan-label">{buildingLabel} · {selectedFloor} aukštas</div>
        {/* Floor plan image — admin uploads to Firebase Storage */}
        <div className="floor-plan-placeholder">
          <MapPin size={48} className="fp-icon" />
          <p className="fp-text">Aukšto planas</p>
          <p className="fp-hint">{buildingLabel}, {selectedFloor} aukštas</p>
          <p className="fp-hint2">Administratorius gali įkelti aukšto plano nuotrauką</p>
        </div>
        
        {/* Room list for this floor */}
        <div className="room-grid">
          {teachers
            .filter(t => {
              const room = t.room?.toString() || '';
              const floorMatch = room.startsWith(String(selectedFloor));
              const buildingMatch = selectedBuilding === 'red'
                ? t.building?.includes('Raudonas')
                : !t.building?.includes('Raudonas');
              return floorMatch && buildingMatch;
            })
            .sort((a, b) => (a.room || '').localeCompare(b.room || '', undefined, { numeric: true }))
            .map(t => (
              <div key={t.id}
                className={`room-chip ${highlighted?.id === t.id ? 'highlighted' : ''}`}
                onClick={() => selectTeacher(t)}>
                <span className="room-num">{t.room}</span>
                <span className="room-teacher">{t.name?.split(' ').slice(-1)[0]}</span>
                <span className="room-subj">{t.subject}</span>
              </div>
            ))
          }
          {loading && <div className="loading-center"><div className="spinner" /></div>}
        </div>
      </div>
    </div>
  );
}
