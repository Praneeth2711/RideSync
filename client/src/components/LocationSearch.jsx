import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, Search, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { locationService } from '../services/locationService';

const LocationSearch = ({
  label,
  placeholder = 'Search city or locality...',
  value, // Location object { name, city, state, latitude, longitude, placeId } or null
  onChange, // (locationObj | null) => void
  error,
  required = false,
  id,
}) => {
  const [inputValue, setInputValue] = useState(value ? value.name : '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(!!value && !!value.latitude);
  const [fetchError, setFetchError] = useState('');

  const dropdownRef = useRef(null);
  const cancelTokenRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync internal state if external value changes
  useEffect(() => {
    if (value && value.name) {
      setInputValue(value.name);
      setIsVerified(true);
    } else if (!value) {
      setInputValue('');
      setIsVerified(false);
    }
  }, [value]);

  // Handle outside click to close suggestions dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    setFetchError('');

    // If input changed after verification, invalidate verification
    if (isVerified) {
      setIsVerified(false);
      onChange(null);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Stale request cancelled');
    }

    if (!text || text.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      cancelTokenRef.current = axios.CancelToken.source();
      try {
        const results = await locationService.getAutocompleteSuggestions(
          text,
          cancelTokenRef.current.token
        );
        setSuggestions(results || []);
        setIsOpen(true);
      } catch (err) {
        if (!axios.isCancel(err)) {
          setFetchError(err.message || 'Unable to load location suggestions.');
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 350); // 350 ms debounce
  };

  const handleSelectSuggestion = (loc) => {
    setInputValue(loc.name);
    setIsVerified(true);
    setIsOpen(false);
    setSuggestions([]);
    setFetchError('');
    onChange(loc);
  };

  const handleClear = () => {
    setInputValue('');
    setIsVerified(false);
    setIsOpen(false);
    setSuggestions([]);
    setFetchError('');
    onChange(null);
  };

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-text-primary uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <MapPin className="absolute left-3.5 h-4 w-4 text-text-secondary pointer-events-none" />

        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-10 pr-10 py-2.5 text-sm bg-white border rounded-md text-text-primary placeholder:text-neutral-400 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-brand-black ${
            error
              ? 'border-red-500'
              : isVerified
              ? 'border-neutral-400'
              : 'border-border-subtle focus:border-brand-black'
          }`}
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {isLoading && (
            <div className="w-3.5 h-3.5 border-2 border-neutral-300 border-t-brand-black rounded-full animate-spin" />
          )}

          {isVerified && !isLoading && (
            <CheckCircle2
              className="h-4 w-4 text-emerald-600"
              title="Verified Geoapify Location"
            />
          )}

          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-neutral-400 hover:text-neutral-700 focus:outline-none"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Verification Warning message if user typed but did not select from suggestions */}
      {!isVerified && inputValue.trim().length >= 3 && !isLoading && !isOpen && (
        <p className="mt-1 text-[11px] text-amber-700 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          Please select a suggested place from the dropdown to verify coordinates.
        </p>
      )}

      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
      {fetchError && <span className="text-xs text-red-600 mt-1 block">{fetchError}</span>}

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-border-subtle rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-neutral-100">
          {suggestions.map((loc, idx) => (
            <li
              key={loc.placeId || `${loc.latitude}_${loc.longitude}_${idx}`}
              onClick={() => handleSelectSuggestion(loc)}
              className="px-3.5 py-2.5 text-sm hover:bg-neutral-50 cursor-pointer flex items-start gap-2.5 transition-colors"
            >
              <MapPin className="h-4 w-4 text-text-secondary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-text-primary leading-tight">
                  {loc.city || loc.name.split(',')[0]}
                </p>
                <p className="text-xs text-text-secondary leading-normal mt-0.5">
                  {loc.name}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOpen && !isLoading && suggestions.length === 0 && inputValue.trim().length >= 3 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-border-subtle rounded-md shadow-lg p-3 text-xs text-text-secondary text-center">
          No matching Indian locations found. Try entering the main city name.
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
