import React, { useRef } from 'react';
import FavoriteButton from './FavoriteButton';
import './RouteResults.css';

const RouteResults = ({ 
  startLocation, 
  endLocation, 
  availableRoutes, 
  selectedRouteIndex, 
  onRouteSelect,
  filteredRestaurants,
  filteredRNRStops,
  filteredPetrolStations,
  selectedEateries,
  onEaterySelect,
  onViewDetails,
  onBack,
  onStartNavigation,
  onSaveRoute,
  onLoadSavedRoutes,
  savedRoutes,
  onLoadRoute,
  onDeleteRoute,
  showSaveRouteForm,
  showSavedRoutes,
  routeName,
  onRouteNameChange,
  onShowSaveForm,
  onShowSavedRoutes,
  onCloseModals,
  onSaveRouteSubmit,
  currentUserId,
  onClearUserData,
  onInspectData,
  onGetUserStats,
  onTestMultiRoute,
  onClearRouteCache,
  googleMapsLoaded
}) => {
  const [selectedPlaceType, setSelectedPlaceType] = React.useState('all');
  // Simple right-swipe to go back (mobile)
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const handleTouchEnd = (e) => {
    const t = e.changedTouches && e.changedTouches[0];
    if (!t || touchStartX.current == null) return;
    const dx = t.clientX - touchStartX.current;
    const dy = Math.abs((t.clientY || 0) - (touchStartY.current || 0));
    // Trigger when swiping right > 60px with small vertical movement
    if (dx > 60 && dy < 40 && onBack) onBack();
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      className="route-results"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="results-header">
        <button
          className="back-to-search"
          onClick={() => onBack && onBack()}
          style={{
            marginRight: '10px',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        <h2>🗺️ Route Results</h2>
        <div className="route-info">
          <span>📍 {startLocation?.name}</span>
          <span>→</span>
          <span>📍 {endLocation?.name}</span>
        </div>
      </div>

      {/* Route Selection */}
      {availableRoutes && availableRoutes.length > 1 && (
        <div className="route-selection">
          <h3>Choose Your Route:</h3>
          <div className="route-options">
            {availableRoutes.map((route, index) => (
              <button
                key={index}
                className={`route-option ${selectedRouteIndex === index ? 'selected' : ''}`}
                onClick={() => onRouteSelect(index)}
              >
                <div className="route-summary">
                  {route.summary || `Route ${index + 1}`}
                </div>
                <div className="route-details">
                  <span>📏 {route.legs?.[0]?.distance?.text || 'Unknown'}</span>
                  <span>⏱️ {route.legs?.[0]?.duration?.text || 'Unknown'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="map-container">
        <div id="map" style={{ height: '50vh', minHeight: '300px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}></div>
      </div>

      {/* Place Type Filter Tabs */}
      <div className="place-type-tabs">
        <button
          className={`tab-btn ${selectedPlaceType === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedPlaceType('all')}
        >
          All ({((filteredRestaurants?.length || 0) + (filteredRNRStops?.length || 0) + (filteredPetrolStations?.length || 0))})
        </button>
        <button
          className={`tab-btn ${selectedPlaceType === 'restaurant' ? 'active' : ''}`}
          onClick={() => setSelectedPlaceType('restaurant')}
        >
          🍽️ Restaurants ({filteredRestaurants?.length || 0})
        </button>
        <button
          className={`tab-btn ${selectedPlaceType === 'rnr' ? 'active' : ''}`}
          onClick={() => setSelectedPlaceType('rnr')}
        >
          🛣️ R&R ({filteredRNRStops?.length || 0})
        </button>
        <button
          className={`tab-btn ${selectedPlaceType === 'petrol_station' ? 'active' : ''}`}
          onClick={() => setSelectedPlaceType('petrol_station')}
        >
          ⛽ Petrol ({filteredPetrolStations?.length || 0})
        </button>
      </div>

      {/* Places Selection - Unified component for all types */}
      {(() => {
        // Get places to display based on selected tab
        let placesToShow = [];
        if (selectedPlaceType === 'all') {
          placesToShow = [
            ...(filteredRestaurants || []).map(p => ({ ...p, placeType: 'restaurant' })),
            ...(filteredRNRStops || []).map(p => ({ ...p, placeType: 'rnr' })),
            ...(filteredPetrolStations || []).map(p => ({ ...p, placeType: 'petrol_station' }))
          ];
        } else if (selectedPlaceType === 'restaurant') {
          placesToShow = (filteredRestaurants || []).map(p => ({ ...p, placeType: 'restaurant' }));
        } else if (selectedPlaceType === 'rnr') {
          placesToShow = (filteredRNRStops || []).map(p => ({ ...p, placeType: 'rnr' }));
        } else if (selectedPlaceType === 'petrol_station') {
          placesToShow = (filteredPetrolStations || []).map(p => ({ ...p, placeType: 'petrol_station' }));
        }

        if (placesToShow.length === 0) return null;

        const getTypeLabel = (type) => {
          if (type === 'restaurant') return '🍽️ Restaurant';
          if (type === 'rnr') return '🛣️ R&R Stop';
          if (type === 'petrol_station') return '⛽ Petrol Station';
          return '📍 Place';
        };

        return (
          <div className="restaurant-selection">
            <h3>
              {selectedPlaceType === 'all' 
                ? `📍 Places Along Route (${placesToShow.length})`
                : `${getTypeLabel(selectedPlaceType)}s Along Route (${placesToShow.length})`
              }
            </h3>
            <div className="restaurant-list">
              {placesToShow.map((place, index) => {
                // Build a stable unique id for both sides
                const getUniqueId = (p) =>
                  p?.place_id || p?.id || `${p?.location?.lat}_${p?.location?.lng}_${p?.name || p?.displayName || p?.eateryName}`;

                const isSelected = selectedEateries.some(eatery => 
                  getUniqueId(eatery) === getUniqueId(place)
                );
                
                const placeType = place.placeType || place.type || 'restaurant';
                const brand = place.brand ? ` (${place.brand})` : '';
                
                return (
                  <div
                    key={index}
                    className={`restaurant-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => onEaterySelect(place)}
                  >
                    <div className="restaurant-info">
                      <h4>
                        {getTypeLabel(placeType)} {place.name || place.displayName || place.eateryName}{brand}
                      </h4>
                      <p>{place.address || place.formattedAddress}</p>
                      <div className="restaurant-details">
                        {place.rating && <span>⭐ {place.rating}</span>}
                        {place.detourDistanceKm && (
                          <span className="detour-info">🚗 {place.detourDistanceKm.toFixed(1)}km detour</span>
                        )}
                        {place.detourDurationMinutes && (
                          <span className="detour-info">⏱️ {place.detourDurationMinutes.toFixed(0)}min</span>
                        )}
                      </div>
                    </div>
                    <div className="restaurant-actions">
                      <button
                        className={`select-btn ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEaterySelect(place);
                        }}
                      >
                        {isSelected ? '✅ Selected' : '➕ Select'}
                      </button>
                      <button
                        className="select-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails && onViewDetails(place);
                        }}
                      >
                        👁️ View Details
                      </button>
                      {placeType === 'restaurant' && (
                        <FavoriteButton
                          restaurant={place}
                          size="small"
                          showText={false}
                          className="favorite-btn"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Action Buttons */}
      <div className="action-buttons">
        {/* Smart Start Journey Button - Always visible after route search */}
        <button
          className="start-journey-btn"
          onClick={onStartNavigation}
        >
          {selectedEateries.length > 0 
            ? `🚀 Start Journey${selectedEateries.length > 1 ? ` (${selectedEateries.length} stops)` : ''}`
            : '🚀 Start Journey'
          }
        </button>
        
        <div className="secondary-actions">
          <button className="save-btn" onClick={onShowSaveForm}>
            💾 Save This Route
          </button>
          <button className="load-btn" onClick={onShowSavedRoutes}>
            📚 My Saved Routes
          </button>
        </div>
      </div>


      {/* Modals would go here - Save Route, Saved Routes, etc. */}
    </div>
  );
};

export default RouteResults;
