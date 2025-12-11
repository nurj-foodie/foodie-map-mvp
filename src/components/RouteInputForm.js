import React, { useEffect, useRef } from 'react';
import './RouteInputForm.css';

function RouteInputForm({
  startLocation,
  endLocation,
  startValue,
  endValue,
  isLoading,
  onStartLocationChange,
  onEndLocationChange,
  onFindRoute,
  // Autocomplete props
  startSuggestions = [],
  endSuggestions = [],
  showStartSuggestions = false,
  showEndSuggestions = false,
  onStartSuggestionClick,
  onEndSuggestionClick
}) {
  const resolvedStart = typeof startValue === 'string' ? startValue : (startLocation && startLocation.name ? startLocation.name : '');
  const resolvedEnd = typeof endValue === 'string' ? endValue : (endLocation && endLocation.name ? endLocation.name : '');

  const canSearch = Boolean(startValue && endValue) && !isLoading;
  const formRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        // Close suggestions by calling the handlers with empty arrays
        if (showStartSuggestions && onStartLocationChange) {
          onStartLocationChange(startValue); // This will trigger the suggestion logic to hide
        }
        if (showEndSuggestions && onEndLocationChange) {
          onEndLocationChange(endValue); // This will trigger the suggestion logic to hide
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStartSuggestions, showEndSuggestions, startValue, endValue, onStartLocationChange, onEndLocationChange]);

  return (
    <div className="route-input-form" ref={formRef}>
      <div className="route-inputs-container">
        <div className="connector-line"></div>

        <div className={`route-input-group ${showStartSuggestions && startSuggestions.length > 0 ? 'has-suggestions' : ''}`}>
          {/* Label removed for cleaner look, relying on placeholder and icons */}
          <div className={`input-with-suggestions ${showStartSuggestions && startSuggestions.length > 0 ? 'has-suggestions' : ''}`}>
            <input
              className="route-input"
              type="text"
              placeholder="Where are you starting?"
              value={resolvedStart}
              onChange={(e) => onStartLocationChange && onStartLocationChange(e.target.value)}
            />
            {showStartSuggestions && startSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {startSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-item"
                    onClick={() => onStartSuggestionClick && onStartSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`route-input-group ${showEndSuggestions && endSuggestions.length > 0 ? 'has-suggestions' : ''}`}>
          <div className={`input-with-suggestions ${showEndSuggestions && endSuggestions.length > 0 ? 'has-suggestions' : ''}`}>
            <input
              className="route-input"
              type="text"
              placeholder="Where do you want to go?"
              value={resolvedEnd}
              onChange={(e) => onEndLocationChange && onEndLocationChange(e.target.value)}
            />
            {showEndSuggestions && endSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {endSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-item"
                    onClick={() => onEndSuggestionClick && onEndSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        className="find-route-button"
        onClick={onFindRoute}
        disabled={!canSearch}
      >
        {isLoading ? 'Finding route…' : 'Find Food Along Route'}
      </button>
    </div>
  );
}

export default RouteInputForm;


