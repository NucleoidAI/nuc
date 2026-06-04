import { useState, useMemo } from 'react';
import './App.css';

interface Service {
  name: string;
  url: string;
  category: string;
  icon?: string;
}

declare global {
  interface Window {
    SERVICES: Service[];
  }
}

function getFaviconUrl(icon?: string) {
  if (!icon) return null;
  if (icon.startsWith('http')) return icon;
  return `https://www.google.com/s2/favicons?domain=${icon}&sz=64`;
}

function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('server-dashboard-favorites');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const toggle = (url: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      localStorage.setItem('server-dashboard-favorites', JSON.stringify([...next]));
      return next;
    });
  };

  return { favorites, toggle };
}

function ServiceCard({
  service,
  isFavorite,
  onToggleFavorite,
}: {
  service: Service;
  isFavorite: boolean;
  onToggleFavorite: (url: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const faviconUrl = getFaviconUrl(service.icon);

  return (
    <div className="card">
      <button
        className={`fav-btn${isFavorite ? ' fav-btn--active' : ''}`}
        onClick={e => { e.preventDefault(); onToggleFavorite(service.url); }}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        ★
      </button>
      <a href={service.url} className="card-link">
        <div className="card-icon">
          {faviconUrl && !imgError ? (
            <img src={faviconUrl} alt="" onError={() => setImgError(true)} />
          ) : (
            service.name.charAt(0)
          )}
        </div>
        <div className="card-text">
          <div className="card-name">{service.name}</div>
          <div className="card-url">{new URL(service.url).hostname}</div>
        </div>
      </a>
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState('');
  const { favorites, toggle } = useFavorites();
  const services: Service[] = window.SERVICES || [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return services;
    return services.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.url.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }, [search, services]);

  const favoriteServices = useMemo(
    () => filtered.filter(s => favorites.has(s.url)),
    [filtered, favorites]
  );

  const grouped = useMemo(() => {
    const map: Record<string, Service[]> = {};
    for (const s of filtered) {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    }
    return map;
  }, [filtered]);

  const categories = services
    .map(s => s.category)
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .filter(c => grouped[c]);

  return (
    <div className="app">
      <header>
        <h1>Server Dashboard</h1>
        <input
          className="search"
          type="search"
          placeholder="Search services..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </header>
      <main>
        {favoriteServices.length > 0 && (
          <section>
            <h2 className="h2--favorites">★ Favorites</h2>
            <div className="grid">
              {favoriteServices.map(s => (
                <ServiceCard
                  key={s.url}
                  service={s}
                  isFavorite={true}
                  onToggleFavorite={toggle}
                />
              ))}
            </div>
          </section>
        )}
        {categories.length === 0 ? (
          <div className="empty">No services found</div>
        ) : (
          categories.map(category => (
            <section key={category}>
              <h2>{category}</h2>
              <div className="grid">
                {grouped[category].map(s => (
                  <ServiceCard
                    key={s.url}
                    service={s}
                    isFavorite={favorites.has(s.url)}
                    onToggleFavorite={toggle}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
