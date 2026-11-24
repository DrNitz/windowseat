import type { Place, ViewImage } from '../types';
import { Icon } from './Icons';

interface PlaceCardProps {
  place: Place;
  images: ViewImage[];
  loading: boolean;
  error: string | null;
  activeIndex: number;
  onActiveChange: (index: number) => void;
  onOpen: (index: number) => void;
  onOpenMap: () => void;
  streetIndex: number;
  onOpenStreet: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function PlaceCard({
  place,
  images,
  loading,
  error,
  activeIndex,
  onActiveChange,
  onOpen,
  onOpenMap,
  streetIndex,
  onOpenStreet,
  isFavorite,
  onToggleFavorite,
}: PlaceCardProps) {
  const image = images[activeIndex];

  return (
    <section className="place-card" aria-label={`Details for ${place.name}`}>
      <div className="card-head">
        <div>
          <p className="eyebrow">NOW VIEWING</p>
          <h2>{place.name}</h2>
          <p className="card-subtitle">
            <Icon name="pin" size={14} /> {place.detail}
          </p>
        </div>
        <button
          type="button"
          className={`icon-button card-fav ${isFavorite ? 'is-fav' : ''}`}
          onClick={onToggleFavorite}
          aria-label={isFavorite ? 'Remove from saved' : 'Save place'}
          aria-pressed={isFavorite}
        >
          <Icon name="heart" size={19} filled={isFavorite} />
        </button>
      </div>

      <div className="card-media">
        {loading && (
          <div className="media-placeholder">
            <Icon name="spinner" size={26} className="spin" />
            <span>Looking for nearby views…</span>
          </div>
        )}
        {!loading && image && (
          <div className="media-photo" style={{ backgroundImage: `url("${image.url}")` }}>
            <button type="button" className="open-window-button" onClick={() => onOpen(activeIndex)}>
              <Icon name="sparkle" size={18} />
              Open window
              <Icon name="arrowUpRight" size={17} />
            </button>
          </div>
        )}
        {!loading && !image && (
          <div className="media-placeholder media-empty">
            <Icon name="image" size={28} />
            <strong>No photo found nearby</strong>
            <span>{error ?? 'You can still open the live map as your view.'}</span>
            <button type="button" className="text-button" onClick={onOpenMap}>
              <Icon name="map" size={16} /> Use map view
            </button>
          </div>
        )}
      </div>

      {streetIndex >= 0 && (
        <button type="button" className="street-button" onClick={onOpenStreet}>
          <Icon name="pin" size={16} />
          Open street view
          <span>
            {images.filter((item) => item.source === 'karta' || item.source === 'mapillary').length} nearby
          </span>
        </button>
      )}

      {images.length > 0 && (
        <div className="card-gallery">
          <div className="thumbs">
            {images.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={`thumb ${activeIndex === index ? 'is-active' : ''} ${
                  item.source === 'karta' || item.source === 'mapillary' ? 'thumb-street' : ''
                }`}
                style={{ backgroundImage: `url("${item.url}")` }}
                onClick={() => onActiveChange(index)}
                aria-label={`View image ${index + 1} of ${images.length}`}
                aria-pressed={activeIndex === index}
              />
            ))}
            <button type="button" className="thumb thumb-map" onClick={onOpenMap} aria-label="Open live map view">
              <Icon name="map" size={18} />
            </button>
          </div>
          {image && (
            <p className="photo-credit">
              <Icon name="image" size={13} />
              <span>{image.credit}</span>
              {image.license && <em>{image.license}</em>}
              {image.link && (
                <a href={image.link} target="_blank" rel="noreferrer" aria-label="Open image source">
                  <Icon name="arrowUpRight" size={13} />
                </a>
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
