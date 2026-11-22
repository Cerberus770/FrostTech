'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack/next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ========================================================
// REGION 10 (Northern Mindanao) Geographic Boundaries
// Coverage:
// - Misamis Oriental (Cagayan de Oro, Gingoog, El Salvador)
// - Bukidnon (Malaybalay, Valencia, Maramag, Manolo Fortich)
// - Lanao del Norte (Iligan City, Tubod, Kapatagan)
// - Misamis Occidental (Ozamiz, Oroquieta, Tangub)
// - Camiguin Island (Mambajao, Catarman)
// ========================================================
export const REGION_10_BOUNDS: [[number, number], [number, number]] = [
  [7.35, 123.35], // Southwest corner (Southern Bukidnon / Western MisOcc)
  [9.45, 125.45], // Northeast corner (Camiguin / Eastern MisOr)
];

// Default Center: Cagayan de Oro City Center, Region 10
export const REGION_10_DEFAULT_CENTER: [number, number] = [8.4864, 124.6521];

export function isWithinRegion10(lat: number, lng: number): boolean {
  return lat >= 7.35 && lat <= 9.45 && lng >= 123.35 && lng <= 125.45;
}

interface MapComponentProps {
  center?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number };
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
  height?: string;
  pinnable?: boolean;
}

export default function MapComponent({
  center,
  markerPosition,
  onLocationSelect,
  height = '350px',
  pinnable = true,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    markerPosition && isWithinRegion10(markerPosition.lat, markerPosition.lng)
      ? markerPosition
      : markerPosition || null
  );
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default to Region 10 center (Cagayan de Oro) if outside or omitted
    const mapCenter: [number, number] =
      center && isWithinRegion10(center.lat, center.lng)
        ? [center.lat, center.lng]
        : REGION_10_DEFAULT_CENTER;

    const map = L.map(mapRef.current, {
      center: mapCenter,
      zoom: 13,
      minZoom: 9, // Strictly prevent zooming out beyond Northern Mindanao
      maxZoom: 19,
      maxBounds: REGION_10_BOUNDS, // Confine map exclusively to Region 10
      maxBoundsViscosity: 1.0, // Hard bounce-back: users CANNOT drag or pan outside Region 10
      zoomControl: true,
    });

    // Google Maps tile layer (roadmap)
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps (Region 10 Only)',
      maxZoom: 20,
    }).addTo(map);

    // Subtle boundary indicator for Region 10
    L.rectangle(REGION_10_BOUNDS, {
      color: '#0284c7',
      weight: 1.5,
      fillColor: '#0284c7',
      fillOpacity: 0.02,
      dashArray: '5, 5',
    }).addTo(map);

    if (pinnable) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Restrict pin placement strictly to Region 10
        if (!isWithinRegion10(lat, lng)) {
          setWarningMsg('⚠️ Pin location is outside Region 10. Service is restricted to Northern Mindanao (CDO, MisOr, MisOcc, Bukidnon, Lanao del Norte, Camiguin).');
          setTimeout(() => setWarningMsg(null), 4500);
          return;
        }

        setWarningMsg(null);
        const coords = { lat, lng };
        setPin(coords);

        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng, { icon: defaultIcon }).addTo(map);
        }

        if (onLocationSelect) {
          onLocationSelect(coords);
        }
      });
    }

    // Add initial marker if provided
    if (markerPosition) {
      const initialLat = isWithinRegion10(markerPosition.lat, markerPosition.lng)
        ? markerPosition.lat
        : REGION_10_DEFAULT_CENTER[0];
      const initialLng = isWithinRegion10(markerPosition.lat, markerPosition.lng)
        ? markerPosition.lng
        : REGION_10_DEFAULT_CENTER[1];

      markerRef.current = L.marker([initialLat, initialLng], { icon: defaultIcon }).addTo(map);
    }

    mapInstanceRef.current = map;

    // Fix map rendering in hidden containers — multiple attempts + observer
    const fixSize = () => map.invalidateSize();
    setTimeout(fixSize, 100);
    setTimeout(fixSize, 300);
    setTimeout(fixSize, 600);
    setTimeout(fixSize, 1000);

    // Watch for container becoming visible/resized
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(mapRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update pin display and center when props change
  const markerKey = markerPosition ? `${markerPosition.lat},${markerPosition.lng}` : '';
  const centerKey = center ? `${center.lat},${center.lng}` : '';

  useEffect(() => {
    if (markerPosition) {
      setPin({ lat: markerPosition.lat, lng: markerPosition.lng });
    }
  }, [markerKey]);

  useEffect(() => {
    if (pin && mapInstanceRef.current) {
      if (markerRef.current) {
        markerRef.current.setLatLng([pin.lat, pin.lng]);
      } else {
        markerRef.current = L.marker([pin.lat, pin.lng], { icon: defaultIcon }).addTo(mapInstanceRef.current);
      }
    }
  }, [pin]);

  // Update center when prop changes
  useEffect(() => {
    if (center && mapInstanceRef.current) {
      const targetCenter = isWithinRegion10(center.lat, center.lng)
        ? center
        : { lat: REGION_10_DEFAULT_CENTER[0], lng: REGION_10_DEFAULT_CENTER[1] };
      mapInstanceRef.current.setView([targetCenter.lat, targetCenter.lng], 15);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
    }
  }, [centerKey]);

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: height,
          minHeight: '200px',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />

      {/* Region 10 Lock Badge */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(4px)',
          border: '1px solid #bae6fd',
          color: '#0369a1',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.74rem',
          fontWeight: 700,
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
        }}
        title="Covered Areas: Cagayan de Oro, Misamis Oriental, Misamis Occidental, Bukidnon, Lanao del Norte, Camiguin"
      >
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
        Region 10 (Northern Mindanao)
      </div>

      {/* Out of Region Warning Toast */}
      {warningMsg && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            left: '10px',
            right: '10px',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 600,
            zIndex: 1001,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <i className="fa-solid fa-triangle-exclamation" style={{ color: '#dc2626' }}></i>
          <span>{warningMsg}</span>
        </div>
      )}

      {/* Coordinates display */}
      {pin && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span style={{ color: '#38bdf8' }}>📍 Region 10:</span>
          <span>{pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</span>
        </div>
      )}
    </div>
  );
}
