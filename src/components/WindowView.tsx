import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Place, ViewImage } from '../types';
import { getPlaceClock } from '../lib/time';
import { Icon } from './Icons';

interface WindowViewProps {
  place: Place;
  images: ViewImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

interface DragState {
  x: number;
  y: number;
  panX: number;
  panY: number;
}

export function WindowView({ place, images, index, onIndexChange, onClose }: WindowViewProps) {
  const [now, setNow] = useState(() => new Date());
  const [reduceMotion, setReduceMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [fit, setFit] = useState<'contain' | 'cover'>('contain');
  const [dragging, setDragging] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const image = images[index];
  const clock = useMemo(() => getPlaceClock(place.lat, place.lon, now), [place.lat, place.lon, now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 20_000);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    media.addEventListener('change', update);
    return () => {
      window.clearInterval(timer);
      media.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [image?.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (images.length < 2) return;
      if (event.key === 'ArrowRight') onIndexChange((index + 1) % images.length);
      if (event.key === 'ArrowLeft') onIndexChange((index - 1 + images.length) % images.length);
      if (event.key === '+' || event.key === '=') setZoom((z) => Math.min(3, z + 0.2));
      if (event.key === '-') setZoom((z) => Math.max(1, z - 0.2));
      if (event.key === '0') {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, images.length, onClose, onIndexChange]);

  useEffect(() => {
    const element = sceneRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((current) => Math.min(3, Math.max(1, current - event.deltaY * 0.002)));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  if (!image) return null;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag) {
      setPan({ x: drag.panX + event.clientX - drag.x, y: drag.panY + event.clientY - drag.y });
      return;
    }
    if (reduceMotion) return;
    setParallax({
      x: (event.clientX / window.innerWidth - 0.5) * -18,
      y: (event.clientY / window.innerHeight - 0.5) * -14,
    });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setFit('contain');
  };

  const sceneStyle = {
    '--zoom': zoom,
    '--pan-x': `${pan.x + (reduceMotion ? 0 : parallax.x)}px`,
    '--pan-y': `${pan.y + (reduceMotion ? 0 : parallax.y)}px`,
  } as CSSProperties;

  const hourAngle = ((clock.hour % 12) + clock.minute / 60) * 30;
  const minuteAngle = clock.minute * 6;
  const clockStyle = {
    '--hour-angle': `${hourAngle}deg`,
    '--minute-angle': `${minuteAngle}deg`,
  } as CSSProperties;

  const phaseIcon = clock.phase === 'night' ? 'moon' : clock.phase === 'morning' ? 'sunrise' : 'sun';

  return (
    <div className={`window-overlay phase-${clock.phase}`} role="dialog" aria-modal="true" aria-label={`Window view of ${place.name}`}>
      <div
        className={`window-scene ${dragging ? 'is-dragging' : ''}`}
        ref={sceneRef}
        style={sceneStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="scene-backdrop" style={{ backgroundImage: `url("${image.url}")` }} />
        <img className={`scene-photo fit-${fit}`} src={image.url} alt="" draggable={false} />
        <div className="scene-vignette" />
      </div>

      <div className="daylight" aria-hidden="true" />
      <div className="lamp-glow" aria-hidden="true" />

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

      <div className="desk" aria-hidden="true">
        <div className="desk-top" />
        <div className="desk-front" />
        <div className="desk-items">
          <div className="desk-books">
            <i />
            <i />
            <i />
          </div>
          <div className="desk-mug">
            <span className="steam steam-one" />
            <span className="steam steam-two" />
          </div>
          <div className="desk-notebook" />
          <div className="desk-plant">
            <span className="leaf leaf-one" />
            <span className="leaf leaf-two" />
            <span className="leaf leaf-three" />
            <span className="pot" />
          </div>
          <div className="desk-clock" style={clockStyle}>
            <div className="clock-face">
              <span className="clock-hand hand-hour" />
              <span className="clock-hand hand-minute" />
              <span className="clock-pin" />
            </div>
            <span className="clock-digital">{clock.time}</span>
          </div>
          <div className="desk-lamp">
            <span className="lamp-arm" />
            <span className="lamp-shade" />
            <span className="lamp-base" />
          </div>
        </div>
      </div>

      <header className="window-bar">
        <button type="button" className="window-control" onClick={onClose}>
          <Icon name="arrowLeft" size={18} /> Close window
        </button>
        <div className="window-tools">
          <div className="zoom-controls">
            <button
              type="button"
              className="window-control icon-only"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              disabled={zoom <= 1}
              aria-label="Zoom out"
            >
              <Icon name="zoomOut" size={17} />
            </button>
            <span className="zoom-value">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="window-control icon-only"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              disabled={zoom >= 3}
              aria-label="Zoom in"
            >
              <Icon name="zoomIn" size={17} />
            </button>
            <button
              type="button"
              className="window-control fit-button"
              onClick={() => setFit((current) => (current === 'contain' ? 'cover' : 'contain'))}
              aria-label={fit === 'contain' ? 'Switch to fill view' : 'Switch to fit view'}
            >
              <Icon name="fit" size={16} /> {fit === 'contain' ? 'Fit' : 'Fill'}
            </button>
            <button type="button" className="window-control fit-button" onClick={resetView}>
              Reset
            </button>
          </div>
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
        </div>
      </header>

      <footer className="window-caption">
        <div className="caption-clock">
          <span className="phase-icon">
            <Icon name={phaseIcon} size={19} />
          </span>
          <div>
            <strong>{clock.time}</strong>
            <small>
              {clock.phaseLabel} · {clock.timezone.split('/').pop()?.replace('_', ' ')}
            </small>
          </div>
        </div>
        <div className="caption-place">
          <strong>{place.name}</strong>
          <span>{place.detail}</span>
        </div>
        <div className="caption-credit">
          <span className="drag-hint">Drag to move · Scroll to zoom</span>
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
