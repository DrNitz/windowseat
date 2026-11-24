import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Place, ViewImage } from '../types';
import { Icon } from './Icons';

interface WindowViewProps {
  place: Place;
  images: ViewImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function WindowView({ place, images, index, onIndexChange, onClose }: WindowViewProps) {
  const [now, setNow] = useState(() => new Date());
  const [reduceMotion, setReduceMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const sceneRef = useRef<HTMLDivElement>(null);
  const image = images[index];

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    media.addEventListener('change', update);
    return () => {
      window.clearInterval(timer);
      media.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (images.length < 2) return;
      if (event.key === 'ArrowRight') onIndexChange((index + 1) % images.length);
      if (event.key === 'ArrowLeft') onIndexChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, images.length, onClose, onIndexChange]);

  const moveScene = (event: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const x = (event.clientX / window.innerWidth - 0.5) * -22;
    const y = (event.clientY / window.innerHeight - 0.5) * -16;
    sceneRef.current?.style.setProperty('--px', `${x}px`);
    sceneRef.current?.style.setProperty('--py', `${y}px`);
  };

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="window-overlay" role="dialog" aria-modal="true" aria-label={`Window view of ${place.name}`}>
      <div className="window-scene" ref={sceneRef} onMouseMove={moveScene}>
        <div className="scene-photo" style={{ backgroundImage: `url("${image.url}")` }} />
        <div className="scene-vignette" />
      </div>

      <div className="window-frame" aria-hidden="true">
        <div className="frame-edge frame-top" />
        <div className="frame-edge frame-bottom" />
        <div className="frame-edge frame-left" />
        <div className="frame-edge frame-right" />
        <div className="mullion mullion-vertical" />
        <div className="mullion mullion-horizontal" />
        <div className="curtain curtain-left" />
        <div className="curtain curtain-right" />
        <div className="sill" />
        <div className="glass-glare" />
      </div>

      <header className="window-bar">
        <button type="button" className="window-control" onClick={onClose}>
          <Icon name="arrowLeft" size={18} /> Close window
        </button>
        <div className="window-nav">
          <button
            type="button"
            className="window-control icon-only"
            onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
            disabled={images.length < 2}
            aria-label="Previous view"
          >
            <Icon name="chevronLeft" size={18} />
          </button>
          <span className="view-counter">
            {index + 1} / {images.length}
          </span>
          <button
            type="button"
            className="window-control icon-only"
            onClick={() => onIndexChange((index + 1) % images.length)}
            disabled={images.length < 2}
            aria-label="Next view"
          >
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      </header>

      <footer className="window-caption">
        <div className="caption-clock">
          <Icon name="clock" size={17} />
          <span>{time}</span>
        </div>
        <div className="caption-place">
          <strong>{place.name}</strong>
          <span>{place.detail}</span>
        </div>
        <div className="caption-credit">
          {image.credit}
          {image.link && (
            <a href={image.link} target="_blank" rel="noreferrer" aria-label="Open image source">
              <Icon name="arrowUpRight" size={13} />
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
