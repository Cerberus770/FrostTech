'use client';

import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '200px',
  borderRadius: '8px'
};

// Default center: Manila, Philippines
const defaultCenter = {
  lat: 14.5995,
  lng: 120.9842
};

interface MapComponentProps {
  center?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number };
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  height?: string;
  pinnable?: boolean;
}

export default function MapComponent({
  center = defaultCenter,
  markerPosition,
  onLocationSelect,
  onMapClick,
  height,
  pinnable = true,
}: MapComponentProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(markerPosition || null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const handleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (onMapClick) {
        onMapClick(e);
      }

      if (pinnable && e.latLng) {
        const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setPin(coords);
        if (onLocationSelect) {
          onLocationSelect(coords);
        }
      }
    },
    [onMapClick, onLocationSelect, pinnable]
  );

  if (!isLoaded)
    return (
      <div
        style={{
          ...containerStyle,
          height: height || '100%',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-light, #888)',
          border: '1px solid var(--border-color, #ddd)',
        }}
      >
        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
        Loading map...
      </div>
    );

  return (
    <div style={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={{ ...containerStyle, height: height || '100%' }}
        center={pin || center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleClick}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {pin && <Marker position={pin} />}
      </GoogleMap>

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
            zIndex: 5,
          }}
        >
          📍 {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
