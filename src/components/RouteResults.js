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

      {/* Restaurant Selection */}
      {filteredRestaurants && filteredRestaurants.length > 0 && (
        <div className="restaurant-selection">
          <h3>🍽️ Restaurants Along Route ({filteredRestaurants.length})</h3>
          <div className="restaurant-list">
            {filteredRestaurants.map((restaurant, index) => {
              // Build a stable unique id for both sides
              const getUniqueId = (r) =>
                r?.place_id || r?.id || `${r?.location?.lat}_${r?.location?.lng}_${r?.name || r?.displayName}`;

              const isSelected = selectedEateries.some(eatery => 
                getUniqueId(eatery) === getUniqueId(restaurant)
              );
              
              return (
                <div
                  key={index}
                  className={`restaurant-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onEaterySelect(restaurant)}
                >
                  <div className="restaurant-info">
                    <h4>{restaurant.name || restaurant.displayName}</h4>
                    <p>{restaurant.address || restaurant.formattedAddress}</p>
                    <div className="restaurant-details">
                      <span>⭐ {restaurant.rating || 'N/A'}</span>
                      {restaurant.detourDistanceKm && (
                        <span className="detour-info">🚗 {restaurant.detourDistanceKm.toFixed(1)}km detour</span>
                      )}
                      {restaurant.detourDurationMinutes && (
                        <span className="detour-info">⏱️ {restaurant.detourDurationMinutes.toFixed(0)}min</span>
                      )}
                    </div>
                  </div>
                  <div className="restaurant-actions">
                    <button
                      className={`select-btn ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEaterySelect(restaurant);
                      }}
                    >
                      {isSelected ? '✅ Selected' : '➕ Select'}
                    </button>
                    <button
                      className="select-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails && onViewDetails(restaurant);
                      }}
                    >
                      👁️ View Details
                    </button>
                    <FavoriteButton
                      restaurant={restaurant}
                      size="small"
                      showText={false}
                      className="favorite-btn"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Status Info */}
      <div className="status-info">
        <p>✅ Simple working version</p>
        <p>✅ Route calculation with alternatives</p>
        <p>✅ Restaurant discovery along route</p>
        <p>✅ Route selection (if multiple routes)</p>
        <p>✅ Multi-restaurant selection for food tours</p>
        <p>✅ Multi-stop navigation with waypoints</p>
        <p>✅ Save & load custom routes (user-specific)</p>
        <p>✅ Drive navigation integration</p>
        <p>✅ User restaurant submission</p>
        <p style={{ color: googleMapsLoaded ? '#4CAF50' : '#FF9800' }}>
          {googleMapsLoaded ? '✅ Google Maps loaded' : '⏳ Loading Google Maps...'}
        </p>
        
        {currentUserId && (
          <div className="user-actions">
            <p>👤 User ID: {currentUserId}</p>
            <div className="user-buttons">
              <button onClick={onClearUserData}>🗑️ Clear Data</button>
              <button onClick={onInspectData}>🔍 Inspect Data</button>
              <button onClick={onGetUserStats}>🎮 My Stats</button>
              <button onClick={onTestMultiRoute}>🧪 Test Multi-Route</button>
              <button onClick={onClearRouteCache}>🗑️ Clear Cache</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals would go here - Save Route, Saved Routes, etc. */}
    </div>
  );
};

export default RouteResults;
