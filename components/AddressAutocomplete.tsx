'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AddressAutocompleteProps {
  onPlaceSelected: (address: string, lat: number | null, lng: number | null) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  value?: string;
  onChange?: (val: string) => void;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function AddressAutocomplete({ 
  onPlaceSelected, 
  placeholder = "Enter your address",
  className,
  style,
  value,
  onChange
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onChange) onChange(val);
    
    // Debounce the API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 400);
  };

  const handleSelect = (suggestion: Suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    if (onChange) onChange(suggestion.display_name);
    onPlaceSelected(suggestion.display_name, lat, lng);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder={placeholder}
        className={className}
        style={style}
        value={value}
        onChange={handleInputChange}
        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
      />
      
      {showSuggestions && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--bg-card, white)',
          border: '1px solid var(--border-color, #ddd)',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 9999,
          maxHeight: '220px',
          overflowY: 'auto',
        }}>
          {suggestions.map((s, i) => (
            <div 
              key={i}
              onClick={() => handleSelect(s)}
              style={{
                padding: '10px 14px',
                fontSize: '0.88rem',
                cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-color, #eee)' : 'none',
                color: 'var(--text-dark, #333)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,102,255,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary, #0066ff)', marginRight: '8px', fontSize: '0.8rem' }}></i>
              {s.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
