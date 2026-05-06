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

function ServiceCard({ service }: { service: Service }) {
  const [imgError, setImgError] = useState(false);
  const faviconUrl = getFaviconUrl(service.icon);

  return (
    <a href={service.url} target="_blank" rel="noopener noreferrer" className="card">
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
  );
}

export default function App() {
  const [search, setSearch] = useState('');
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
        {categories.length === 0 ? (
          <div className="empty">No services found</div>
        ) : (
          categories.map(category => (
            <section key={category}>
              <h2>{category}</h2>
              <div className="grid">
                {grouped[category].map(s => (
                  <ServiceCard key={s.url} service={s} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
