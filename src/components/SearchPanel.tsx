import type { FormEvent } from 'react';
import type { Place } from '../types';
import { Icon } from './Icons';

const POPULAR: Place[] = [
  { id: 'pop-liberty', name: 'Statue of Liberty', detail: 'New York, USA', lat: 40.6892, lon: -74.0445 },
  { id: 'pop-eiffel', name: 'Eiffel Tower', detail: 'Paris, France', lat: 48.8584, lon: 2.2945 },
  { id: 'pop-colosseum', name: 'Colosseum', detail: 'Rome, Italy', lat: 41.8902, lon: 12.4922 },
  { id: 'pop-taj', name: 'Taj Mahal', detail: 'Agra, India', lat: 27.1751, lon: 78.0421 },
  { id: 'pop-kyoto', name: 'Fushimi Inari Taisha', detail: 'Kyoto, Japan', lat: 34.9671, lon: 135.7727 },
  { id: 'pop-santorini', name: 'Oia', detail: 'Santorini, Greece', lat: 36.4618, lon: 25.3753 },
];

interface SearchPanelProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: Place[];
  searching: boolean;
  searchError: boolean;
  selected: Place | null;
  onSelect: (place: Place) => void;
  favorites: Place[];
  onToggleFavorite: (place: Place) => void;
  token: string;
  onTokenChange: (value: string) => void;
  onShowAbout: () => void;
}

export function SearchPanel({
  query,
  onQueryChange,
  results,
  searching,
  searchError,
  selected,
  onSelect,
  favorites,
  onToggleFavorite,
  token,
  onTokenChange,
  onShowAbout,
}: SearchPanelProps) {
  const showResults = query.trim().length >= 2;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (results.length) onSelect(results[0]);
  };

  return (
    <div className="panel-inner">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <span />
        </div>
        <div>
          <h1>Windowseat</h1>
          <p>A window to anywhere</p>
        </div>
      </div>

      <form className="search-form" onSubmit={submit} role="search">
        <label className="sr-only" htmlFor="place-search">
          Search for a place
        </label>
        <Icon name="search" size={19} className="search-icon" />
        <input
          id="place-search"
          type="search"
          placeholder="Search a place, city, landmark…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            className="icon-button search-clear"
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
          >
            <Icon name="close" size={17} />
          </button>
        )}
      </form>

      <div className="panel-scroll">
        {showResults ? (
          <section className="panel-section">
            <div className="section-heading">
              <span>SEARCH RESULTS</span>
              {searching && <Icon name="spinner" size={14} className="spin" />}
            </div>
            {searchError && (
              <p className="notice notice-error">
                <Icon name="warning" size={16} /> Search is unavailable right now.
              </p>
            )}
            {!searching && !searchError && results.length === 0 && (
              <p className="notice">No places found. Try a different name.</p>
            )}
            <ul className="place-list">
              {results.map((place) => (
                <li key={place.id} className="place-row">
                  <button
                    type="button"
                    className={`place-main ${selected?.id === place.id ? 'is-active' : ''}`}
                    onClick={() => onSelect(place)}
                  >
                    <span className="place-pin">
                      <Icon name="pin" size={17} />
                    </span>
                    <span className="place-text">
                      <strong>{place.name}</strong>
                      <small>{place.detail}</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`icon-button fav-button ${favorites.some((f) => f.id === place.id) ? 'is-fav' : ''}`}
                    onClick={() => onToggleFavorite(place)}
                    aria-label={favorites.some((f) => f.id === place.id) ? 'Remove from saved' : 'Save place'}
                    aria-pressed={favorites.some((f) => f.id === place.id)}
                  >
                    <Icon name="heart" size={17} filled={favorites.some((f) => f.id === place.id)} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <>
            {favorites.length > 0 && (
              <section className="panel-section">
                <div className="section-heading">
                  <span>SAVED PLACES</span>
                  <Icon name="heart" size={13} />
                </div>
                <ul className="place-list">
                  {favorites.map((place) => (
                    <li key={place.id} className="place-row">
                      <button
                        type="button"
                        className={`place-main ${selected?.id === place.id ? 'is-active' : ''}`}
                        onClick={() => onSelect(place)}
                      >
                        <span className="place-pin">
                          <Icon name="pin" size={17} />
                        </span>
                        <span className="place-text">
                          <strong>{place.name}</strong>
                          <small>{place.detail}</small>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="icon-button fav-button is-fav"
                        onClick={() => onToggleFavorite(place)}
                        aria-label="Remove from saved"
                        aria-pressed="true"
                      >
                        <Icon name="heart" size={17} filled />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="panel-section">
              <div className="section-heading">
                <span>START SOMEWHERE</span>
                <Icon name="sparkle" size={13} />
              </div>
              <ul className="place-list">
                {POPULAR.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      className={`place-main ${selected?.id === place.id ? 'is-active' : ''}`}
                      onClick={() => onSelect(place)}
                    >
                      <span className="place-pin">
                        <Icon name="globe" size={17} />
                      </span>
                      <span className="place-text">
                        <strong>{place.name}</strong>
                        <small>{place.detail}</small>
                      </span>
                      <Icon name="chevronRight" size={15} className="row-chevron" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>

      <div className="panel-footer">
        <details className="settings">
          <summary>
            <Icon name="info" size={16} /> Street-level photos <Icon name="chevronRight" size={14} className="settings-chevron" />
          </summary>
          <p>
            Add a free <a href="https://www.mapillary.com/developer" target="_blank" rel="noreferrer">Mapillary access token</a>{' '}
            to include street-level panoramas. Your token stays in this browser.
          </p>
          <input
            type="password"
            value={token}
            onChange={(event) => onTokenChange(event.target.value)}
            placeholder="Paste access token"
            aria-label="Mapillary access token"
          />
        </details>
        <button type="button" className="about-link" onClick={onShowAbout}>
          About &amp; credits <Icon name="arrowUpRight" size={14} />
        </button>
      </div>
    </div>
  );
}
