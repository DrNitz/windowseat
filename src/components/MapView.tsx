import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Place } from '../types';

interface MapViewProps {
  place: Place | null;
  onMapReady?: (map: maplibregl.Map | null) => void;
}

export function MapView({ place, onMapReady }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const readyRef = useRef(onMapReady);
  readyRef.current = onMapReady;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [-74.0445, 40.6892],
      zoom: 3.4,
      attributionControl: false,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    mapRef.current = map;
    readyRef.current?.(map);

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      markerRef.current?.remove();
      readyRef.current?.(null);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !place) return;

    map.flyTo({
      center: [place.lon, place.lat],
      zoom: 14.5,
      duration: 2200,
      essential: true,
    });

    markerRef.current?.remove();
    const element = document.createElement('div');
    element.className = 'place-marker';
    element.innerHTML = '<span></span>';
    markerRef.current = new maplibregl.Marker({ element })
      .setLngLat([place.lon, place.lat])
      .addTo(map);
  }, [place]);

  return <div className="map-canvas" ref={containerRef} />;
}
