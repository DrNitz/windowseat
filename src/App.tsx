import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { fetchPlaceImages, searchPlaces } from './lib/api';
import type { Place, ViewImage } from './types';
import { MapView } from './components/MapView';
import { SearchPanel } from './components/SearchPanel';
import { PlaceCard } from './components/PlaceCard';
import { WindowView } from './components/WindowView';
import { Icon } from './components/Icons';

const FAVORITES_KEY = 'windowseat:favorites';
const TOKEN_KEY = 'windowseat:mapillary';

function loadFavorites(): Place[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? (JSON.parse(stored) as Place[]) : [];
  } catch {
    return [];
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);
  const [images, setImages] = useState<ViewImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [windowOpen, setWindowOpen] = useState(false);
  const [favorites, setFavorites] = useState<Place[]>(loadFavorites);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const mapInstance = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(() => {
      searchPlaces(query, controller.signal)
        .then((places) => {
          setResults(places);
          setSearchError(false);
        })
        .catch((error) => {
          if (!isAbort(error)) {
            setResults([]);
            setSearchError(true);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    setImages([]);
    setImagesLoading(true);
    setImagesError(null);
    setActiveIndex(0);

    fetchPlaceImages(selected, controller.signal, token)
      .then((found) => {
        setImages(found);
        if (found.length === 0) setImagesError('No geotagged photos near this place.');
      })
      .catch((error) => {
        if (!isAbort(error)) setImagesError('Could not reach the photo libraries.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setImagesLoading(false);
      });

    return () => controller.abort();
  }, [selected, token]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(TOKEN_KEY, token);
  }, [token]);

  const handleMapReady = useCallback((map: MapLibreMap | null) => {
    mapInstance.current = map;
  }, []);

  const selectPlace = useCallback((place: Place) => {
    setSelected(place);
    setQuery('');
    setResults([]);
    setSidebarOpen(false);
    setWindowOpen(false);
  }, []);

  const toggleFavorite = useCallback((place: Place) => {
    setFavorites((current) =>
      current.some((item) => item.id === place.id)
        ? current.filter((item) => item.id !== place.id)
        : [...current, place],
    );
  }, []);

  const openMapWindow = useCallback(() => {
    const map = mapInstance.current;
    if (!map || !selected) return;
    try {
      const url = map.getCanvas().toDataURL('image/png');
      setImages([
        {
          id: `map-${Date.now()}`,
          url,
          credit: 'OpenStreetMap contributors',
          source: 'map',
          license: 'ODbL',
          link: 'https://www.openstreetmap.org/copyright',
          description: 'Map view',
        },
      ]);
      setActiveIndex(0);
      setImagesError(null);
      setWindowOpen(true);
    } catch {
      setImagesError('This browser blocked the map snapshot.');
    }
  }, [selected]);

  const isFavorite = selected ? favorites.some((item) => item.id === selected.id) : false;
  const streetIndex = images.findIndex((item) => item.source === 'karta' || item.source === 'mapillary');

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <SearchPanel
          query={query}
          onQueryChange={setQuery}
          results={results}
          searching={searching}
          searchError={searchError}
          selected={selected}
          onSelect={selectPlace}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          token={token}
          onTokenChange={setToken}
          onShowAbout={() => setAboutOpen(true)}
        />
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="drawer-scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <main className="stage">
        <MapView place={selected} onMapReady={handleMapReady} />

        <div className="stage-topbar">
          <button
            type="button"
            className="menu-button window-control"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" size={19} />
          </button>
          <span className="brand-mini">Windowseat</span>
          <button type="button" className="about-button window-control" onClick={() => setAboutOpen(true)}>
            <Icon name="info" size={16} /> About
          </button>
        </div>

        {!selected && (
          <div className="empty-hint">
            <Icon name="pin" size={18} />
            Search for a place to open your window
          </div>
        )}

        {selected && (
          <PlaceCard
            place={selected}
            images={images}
            loading={imagesLoading}
            error={imagesError}
            activeIndex={activeIndex}
            onActiveChange={setActiveIndex}
            onOpen={(index) => {
              setActiveIndex(index);
              setWindowOpen(true);
            }}
            onOpenMap={openMapWindow}
            streetIndex={streetIndex}
            onOpenStreet={() => {
              if (streetIndex >= 0) {
                setActiveIndex(streetIndex);
                setWindowOpen(true);
              }
            }}
            isFavorite={isFavorite}
            onToggleFavorite={() => toggleFavorite(selected)}
          />
        )}
      </main>

      {windowOpen && selected && images.length > 0 && (
        <WindowView
          place={selected}
          images={images}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={() => setWindowOpen(false)}
        />
      )}

      {aboutOpen && (
        <div className="about-backdrop" role="presentation" onClick={() => setAboutOpen(false)}>
          <section className="about-card" role="dialog" aria-modal="true" aria-label="About Windowseat" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="icon-button about-close"
              onClick={() => setAboutOpen(false)}
              aria-label="Close about dialog"
            >
              <Icon name="close" size={18} />
            </button>
            <p className="eyebrow">ABOUT</p>
            <h2>A window to anywhere</h2>
            <p>
              Search for a place, explore it on the map, then open it as a window. Windowseat uses open
              data and open imagery — no Google key, no subscription.
            </p>
            <ul>
              <li>Search: Photon (OpenStreetMap)</li>
              <li>Map: OpenFreeMap + MapLibre</li>
              <li>Photos: Wikipedia &amp; Wikimedia Commons</li>
              <li>Optional street-level: Mapillary, with your own free token</li>
            </ul>
            <p className="about-note">
              Photos are crowdsourced, not live. Coverage and quality vary by location. All imagery is
              credited in the window view.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
