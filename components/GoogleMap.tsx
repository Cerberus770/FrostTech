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

// Default center: Manila, Philippines
const defaultCenter: [number, number] = [14.5995, 120.9842];

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
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(markerPosition || null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const mapCenter: [number, number] = center 
      ? [center.lat, center.lng] 
      : defaultCenter;

    const map = L.map(mapRef.current, {
      center: mapCenter,
      zoom: 17,
      zoomControl: true,
    });

    // Google Maps tile layer (roadmap)
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps',
      maxZoom: 20,
    }).addTo(map);

    if (pinnable) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
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
      markerRef.current = L.marker([markerPosition.lat, markerPosition.lng], { icon: defaultIcon }).addTo(map);
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
      mapInstanceRef.current.setView([center.lat, center.lng], 15);
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

      {/* Coordinates display */}
      {pin && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontWeight: 500,
            zIndex: 1000,
          }}
        >
          📍 {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
