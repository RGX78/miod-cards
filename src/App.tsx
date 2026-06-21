import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Grid, 
  Compass, 
  Heart, 
  X, 
  Activity,
  Layers,
  MapPin,
  FileText,
  Volume2,
  VolumeX
} from 'lucide-react';
import honeysData from './data/honeys.json';
import './App.css';

// Interfaces
interface Honey {
  name: string;
  description: string;
  image: string;
  manaType: 'Flora' | 'Arbor' | 'Glukoza' | 'MGO' | 'Nectar';
  type: string;
  color_desc: string;
  taste_desc: string;
  crystallization_desc: string;
  origin_desc: string;
  health_desc: string;
}

// 3D Card Component
interface HoneyCardProps {
  honey: Honey;
  onClick?: () => void;
  onCompareToggle?: (e: React.MouseEvent) => void;
  isCompared?: boolean;
  showCompareOption?: boolean;
}

const HoneyCard: React.FC<HoneyCardProps> = ({
  honey,
  onClick,
  onCompareToggle,
  isCompared = false,
  showCompareOption = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const width = box.width;
    const height = box.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Tilt calculations
    const rotateX = ((centerY - y) / centerY) * 12; // Max 12 deg tilt
    const rotateY = ((x - centerX) / centerX) * 12;
    
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    card.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // Frame styling class based on category
  const frameClass = `frame-${honey.manaType.toLowerCase()}`;

  return (
    <div 
      className={`card-scene ${isHovered ? 'hover-active' : ''} ${isCompared ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div 
        ref={cardRef}
        className="card-3d"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        {/* CARD FRONT */}
        <div className={`card-front ${frameClass}`}>
          
          {/* Compare Toggle Button */}
          {showCompareOption && onCompareToggle && (
            <button 
              className="card-selection-indicator" 
              onClick={(e) => {
                e.stopPropagation();
                onCompareToggle(e);
              }}
              style={{
                background: isCompared ? 'var(--color-gold)' : 'rgba(0,0,0,0.6)',
                border: isCompared ? '2px solid #fff' : '2px solid rgba(255,255,255,0.4)',
                color: isCompared ? '#000' : '#fff',
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 15,
                fontWeight: 'bold',
                fontSize: '0.8rem',
                padding: 0
              }}
            >
              {isCompared ? '✓' : '+'}
            </button>
          )}

          {/* Title Bar */}
          <div className="card-title-bar">
            <span className="card-name">{honey.name}</span>
            <span style={{ fontSize: '0.9rem' }}>🍯</span>
          </div>

          {/* Art Box */}
          <div className="card-art-box">
            <img 
              src={`${import.meta.env.BASE_URL}images/${honey.image}`} 
              alt={honey.name} 
              className="card-art-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400";
              }}
            />
          </div>

          {/* Type Bar */}
          <div className="card-type-bar">
            <span className="card-type-text">{honey.type}</span>
          </div>

          {/* Text Box */}
          <div className="card-text-box">
            {honey.description && (
              <div className="card-flavor-text" style={{ fontStyle: 'normal', color: '#e2e8f0' }}>
                {honey.description.length > 220 
                  ? `${honey.description.substring(0, 215)}...` 
                  : honey.description}
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="card-bottom-bar" style={{ height: '18px' }}>
            <span className="card-collector-info" style={{ color: 'var(--color-gold-light)' }}>
              {honey.origin_desc.split(';')[0]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function App() {
  const [activeTab, setActiveTab] = useState<'collection' | 'compare'>('collection');
  
  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('name');

  // Honeys List
  const [honeys, setHoneys] = useState<Honey[]>([]);

  // Compare State
  const [comparedHoneyNames, setComparedHoneyNames] = useState<string[]>([]);

  // Detailed Modal Inspector
  const [inspectingCard, setInspectingCard] = useState<Honey | null>(null);

  // Voice reader state
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
  };

  const playVoice = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert("Twoja przeglądarka nie wspiera odczytywania tekstu.");
      return;
    }

    window.speechSynthesis.cancel();

    if (isPlayingVoice) {
      setIsPlayingVoice(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pl-PL';

    utterance.onend = () => {
      setIsPlayingVoice(false);
    };

    utterance.onerror = () => {
      setIsPlayingVoice(false);
    };

    speechUtteranceRef.current = utterance;
    setIsPlayingVoice(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop voice when card changes or modal closes
  useEffect(() => {
    stopVoice();
  }, [inspectingCard]);

  // Load Data on Mount
  useEffect(() => {
    setHoneys(honeysData as Honey[]);
  }, []);

  // Comparison toggle
  const handleToggleCompare = (name: string) => {
    if (comparedHoneyNames.includes(name)) {
      setComparedHoneyNames(comparedHoneyNames.filter(n => n !== name));
    } else {
      if (comparedHoneyNames.length >= 2) {
        setComparedHoneyNames([comparedHoneyNames[0], name]);
      } else {
        setComparedHoneyNames([...comparedHoneyNames, name]);
      }
    }
  };

  // Compile full catalog of cards
  const getDisplayCards = () => {
    return honeys.filter(h => {
      // Search text match
      const text = `${h.name} ${h.description} ${h.type} ${h.health_desc} ${h.taste_desc} ${h.origin_desc}`.toLowerCase();
      if (searchQuery && !text.includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'All' && h.manaType !== categoryFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  };

  const displayCards = getDisplayCards();

  // Find cards currently chosen for comparison
  const comparedCards = comparedHoneyNames.map(name => {
    return honeys.find(h => h.name === name);
  }).filter((x): x is Honey => !!x);

  return (
    <div className="app-container">
      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">🍯</div>
          <div>
            <h1 className="app-title">Miodoteka</h1>
            <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
              Encyklopedia i Porównywarka Miodów
            </span>
          </div>
        </div>

        <nav className="app-navigation">
          <button 
            className={`nav-btn ${activeTab === 'collection' ? 'active' : ''}`}
            onClick={() => setActiveTab('collection')}
          >
            <Grid size={16} /> Encyklopedia ({honeys.length})
          </button>
          <button 
            className={`nav-btn ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <Compass size={16} /> Porównywarka ({comparedHoneyNames.length}/2)
          </button>
        </nav>

        <div className="header-stats">
          <div className="stat-badge">
            <span>Zbiory: {honeys.length} odmian</span>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="main-content">
        
        {/* TAB 1: ALBUM */}
        {activeTab === 'collection' && (
          <div className="collection-panel">
            
            {/* Filter controls */}
            <div className="control-bar">
              <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Szukaj miodu, właściwości leczniczych, smaku, pochodzenia..." 
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-groups">
                <select 
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">Wszystkie Kategorie</option>
                  <option value="Flora">🌸 Kwiatowe / Nektarowe</option>
                  <option value="Arbor">🌲 Leśne / Spadziowe</option>
                  <option value="Glukoza">⚡ Powszechne / Szybkokrystalizujące</option>
                  <option value="MGO">🧪 Specjalistyczne / Zdrowotne</option>
                </select>

                <select 
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Sortuj: Nazwa (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Collection Info */}
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Pokazano <strong>{displayCards.length}</strong> odmian miodu. Kliknij na kartę, aby przeczytać pełny opis w encyklopedii.
            </div>

            {/* Cards Grid */}
            {displayCards.length === 0 ? (
              <div className="empty-placeholder">
                <div className="empty-placeholder-title">Brak wyników</div>
                <p>Brak miodów spełniających wybrane kryteria wyszukiwania. Spróbuj zmienić wpisany tekst lub filtry.</p>
              </div>
            ) : (
              <div className="cards-grid">
                {displayCards.map((honey, index) => {
                  const isCompared = comparedHoneyNames.includes(honey.name);
                  return (
                    <HoneyCard 
                      key={`${honey.name}-${index}`}
                      honey={honey}
                      onClick={() => setInspectingCard(honey)}
                      showCompareOption={true}
                      isCompared={isCompared}
                      onCompareToggle={() => handleToggleCompare(honey.name)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPARE ARENA */}
        {activeTab === 'compare' && (
          <div className="compare-container">
            <div className="compare-header">
              <h2>Porównywarka Odmian Miodu</h2>
              <p>Wybierz 2 miody w Encyklopedii (klikając ikonkę "+" w prawym górnym rogu karty) i zobacz bezpośrednie porównanie ich właściwości fizycznych oraz medycznych.</p>
            </div>

            <div className="compare-arena">
              {/* Slot 1 */}
              <div className="compare-slot">
                {comparedCards[0] ? (
                  <>
                    <HoneyCard honey={comparedCards[0]} />
                    <button className="remove-compare-btn" onClick={() => handleToggleCompare(comparedCards[0].name)}>
                      <X size={14} /> Usuń
                    </button>
                  </>
                ) : (
                  <div className="compare-empty-slot" onClick={() => setActiveTab('collection')}>
                    <span>+ Wybierz pierwszy miód</span>
                  </div>
                )}
              </div>

              {/* VS Divider */}
              <div style={{ alignSelf: 'center', fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                VS
              </div>

              {/* Slot 2 */}
              <div className="compare-slot">
                {comparedCards[1] ? (
                  <>
                    <HoneyCard honey={comparedCards[1]} />
                    <button className="remove-compare-btn" onClick={() => handleToggleCompare(comparedCards[1].name)}>
                      <X size={14} /> Usuń
                    </button>
                  </>
                ) : (
                  <div className="compare-empty-slot" onClick={() => setActiveTab('collection')}>
                    <span>+ Wybierz drugi miód</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compare Table */}
            {comparedCards.length === 2 && (
              <div className="compare-matrix">
                <h3 style={{ fontFamily: 'var(--font-serif)', textAlign: 'center', color: '#fff', margin: '0 0 1.5rem 0' }}>
                  Zestawienie Parametrów
                </h3>

                {/* Metric: Type */}
                <div className="compare-row">
                  <div className="compare-value-left">{comparedCards[0].type}</div>
                  <div className="compare-metric">Gatunek</div>
                  <div className="compare-value-right">{comparedCards[1].type}</div>
                </div>

                {/* Metric: Color */}
                <div className="compare-row">
                  <div className="compare-value-left">{comparedCards[0].color_desc}</div>
                  <div className="compare-metric">Kolor</div>
                  <div className="compare-value-right">{comparedCards[1].color_desc}</div>
                </div>

                {/* Metric: Taste */}
                <div className="compare-row">
                  <div className="compare-value-left">{comparedCards[0].taste_desc}</div>
                  <div className="compare-metric">Smak i zapach</div>
                  <div className="compare-value-right">{comparedCards[1].taste_desc}</div>
                </div>

                {/* Metric: Crystallization */}
                <div className="compare-row">
                  <div className="compare-value-left">{comparedCards[0].crystallization_desc}</div>
                  <div className="compare-metric">Konsystencja i Krystalizacja</div>
                  <div className="compare-value-right">{comparedCards[1].crystallization_desc}</div>
                </div>

                {/* Metric: Health Properties */}
                <div className="compare-row" style={{ background: 'rgba(212, 175, 55, 0.03)' }}>
                  <div className="compare-value-left" style={{ fontWeight: 500, color: 'var(--color-gold-light)' }}>{comparedCards[0].health_desc}</div>
                  <div className="compare-metric" style={{ color: 'var(--color-gold)' }}>Działanie zdrowotne</div>
                  <div className="compare-value-right" style={{ fontWeight: 500, color: 'var(--color-gold-light)' }}>{comparedCards[1].health_desc}</div>
                </div>

                {/* Metric: Origin */}
                <div className="compare-row">
                  <div className="compare-value-left">{comparedCards[0].origin_desc}</div>
                  <div className="compare-metric">Pochodzenie / Dostępność</div>
                  <div className="compare-value-right">{comparedCards[1].origin_desc}</div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* DETAILED DIALOG MODAL */}
      {inspectingCard && (
        <div className="modal-overlay" onClick={() => setInspectingCard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setInspectingCard(null)}>
              <X size={20} />
            </button>

            {/* Left side: Card Showcase */}
            <div className="modal-card-display">
              <HoneyCard 
                honey={inspectingCard} 
                onClick={() => {}} 
              />
            </div>

            {/* Right side: Details */}
            <div className="modal-info-panel">
              <h2 className="modal-info-title">{inspectingCard.name}</h2>
              
              <div className="modal-honey-meta">
                <span className="meta-pill">
                  Gatunek: {inspectingCard.type}
                </span>
                <span className="meta-pill">
                  Kategoria: {
                    inspectingCard.manaType === 'Flora' ? 'Kwiatowy' :
                    inspectingCard.manaType === 'Arbor' ? 'Leśny / Spadź' :
                    inspectingCard.manaType === 'Glukoza' ? 'Powszechny' : 'Zdrowotny'
                  }
                </span>
              </div>

              <div className="detail-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="detail-label"><FileText size={12} style={{ marginRight: '5px' }} /> Opis</span>
                  <button 
                    onClick={() => playVoice(inspectingCard.description)}
                    style={{
                      background: isPlayingVoice ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212, 175, 55, 0.12)',
                      border: isPlayingVoice ? '1px solid #f87171' : '1px solid var(--color-gold)',
                      borderRadius: '20px',
                      color: isPlayingVoice ? '#f87171' : 'var(--color-gold-light)',
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: 600
                    }}
                  >
                    {isPlayingVoice ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    {isPlayingVoice ? "Zatrzymaj" : "Czytaj opis"}
                  </button>
                </div>
                <div className="detail-value">{inspectingCard.description}</div>
              </div>

              <div className="detail-section">
                <span className="detail-label"><Heart size={12} style={{ marginRight: '5px', color: 'var(--color-flora)' }} /> Właściwości zdrowotne</span>
                <div className="detail-value" style={{ borderLeftColor: 'var(--color-flora)', color: 'var(--color-gold-light)', fontWeight: 500 }}>{inspectingCard.health_desc}</div>
              </div>

              <div className="detail-section">
                <span className="detail-label"><Layers size={12} style={{ marginRight: '5px', color: 'var(--color-glukoza)' }} /> Konsystencja i krystalizacja</span>
                <div className="detail-value" style={{ borderLeftColor: 'var(--color-glukoza)' }}>{inspectingCard.crystallization_desc}</div>
              </div>

              <div className="detail-section">
                <span className="detail-label"><Activity size={12} style={{ marginRight: '5px', color: 'var(--color-mgo)' }} /> Smak i zapach</span>
                <div className="detail-value" style={{ borderLeftColor: 'var(--color-mgo)' }}>{inspectingCard.taste_desc}</div>
              </div>

              <div className="detail-section">
                <span className="detail-label"><MapPin size={12} style={{ marginRight: '5px', color: 'var(--color-nectar)' }} /> Pochodzenie i dostępność</span>
                <div className="detail-value" style={{ borderLeftColor: 'var(--color-nectar)' }}>{inspectingCard.origin_desc}</div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  className="open-booster-btn"
                  onClick={() => {
                    handleToggleCompare(inspectingCard.name);
                  }}
                  style={{
                    padding: '0.6rem 1.2rem',
                    fontSize: '0.9rem',
                    background: comparedHoneyNames.includes(inspectingCard.name) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid var(--color-gold)',
                    color: '#fff'
                  }}
                >
                  {comparedHoneyNames.includes(inspectingCard.name) ? "Usuń z porównywarki" : "Dodaj do porównywarki"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="app-footer">
        <p>© 2026 Miodoteka. Encyklopedia miodów na podstawie bazy wiedzy Obsidian Vault.</p>
      </footer>
    </div>
  );
}
