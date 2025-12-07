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

  // Debug: Log all props to diagnose rendering issues
  React.useEffect(() => {
    console.log('🔍 RouteResults - availableRoutes:', availableRoutes);
    console.log('🔍 RouteResults - availableRoutes.length:', availableRoutes?.length);
    console.log('🔍 RouteResults - selectedRouteIndex:', selectedRouteIndex);
    console.log('🔍 RouteResults - filteredRestaurants:', filteredRestaurants?.length || 0);
    console.log('🔍 RouteResults - filteredRNRStops:', filteredRNRStops?.length || 0);
    console.log('🔍 RouteResults - filteredPetrolStations:', filteredPetrolStations?.length || 0);
    console.log('🔍 RouteResults - selectedPlaceType:', selectedPlaceType);
  }, [availableRoutes, selectedRouteIndex, filteredRestaurants, filteredRNRStops, filteredPetrolStations, selectedPlaceType]);

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
      className="route-results-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="results-header">
        <h2>🗺️ Route Results</h2>
        <div className="route-info">
          <span>📍 {startLocation?.name}</span>
          <span>→</span>
          <span>📍 {endLocation?.name}</span>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="route-results-content">
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

        console.log('🔍 RouteResults - placesToShow.length:', placesToShow.length);
        console.log('🔍 RouteResults - placesToShow (first 3):', placesToShow.slice(0, 3));
        
        if (placesToShow.length === 0) {
          console.log('⚠️ RouteResults - No places to show, returning null');
          return null;
        }

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
                    onClick={(e) => {
                      // Selecting anywhere on the card selects it, unless specific details clicked
                      onEaterySelect(place);
                    }}
                  >
                    {/* Left: Image Section */}
                    <div className="card-image-section">
                      {place.photos && place.photos.length > 0 ? (
                        <img
                          src={place.photos[0].getUrl ? place.photos[0].getUrl({ maxWidth: 200 }) : place.icon || ''}
                          alt={place.name}
                          className="card-image"
                        />
                      ) : (
                        <div className="card-image-placeholder">
                          {placeType === 'restaurant' ? '🍽️' : placeType === 'rnr' ? '🛣️' : '⛽'}
                        </div>
                      )}
                    </div>

                    {/* Middle: Details Section */}
                    <div className="card-details-section">
                      <div className="card-title">{place.name || place.displayName || place.eateryName}{brand}</div>

                      <div className="card-info-row">
                        {place.rating ? (
                          <div className="rating-badge">
                            <span className="rating-star">★</span>
                            <span>{place.rating}</span>
                            <span style={{ color: '#666' }}>({place.userRatingCount || 0})</span>
                          </div>
                        ) : (
                          <span style={{ color: '#666' }}>No rating</span>
                        )}
                      </div>

                      <div className="card-info-row">
                        {(place.detourDurationMinutes !== undefined && place.detourDurationMinutes !== Infinity) ? (
                          <div className="detour-badge">
                            +{place.detourDurationMinutes.toFixed(0)} min detour
                          </div>
                        ) : (
                          <div className="detour-badge">Unknown detour</div>
                        )}
                      </div>

                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4CAF50',
                          fontSize: '11px',
                          padding: 0,
                          cursor: 'pointer',
                          textAlign: 'left',
                          marginTop: '4px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails && onViewDetails(place);
                        }}
                      >
                        View Info &gt;
                      </button>
                    </div>

                    {/* Right: Add Action Section */}
                    <div
                      className={`card-action-section ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEaterySelect(place);
                      }}
                    >
                      <div className="action-icon">
                        {isSelected ? '✓' : '+'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      </div>
      {/* End of scrollable content */}

      {/* Action Buttons */}
      {/* Modals would go here - Save Route, Saved Routes, etc. */}
      {/* Footer is now outside the scrollable content */}
      <div className="results-footer">
        <div className="action-buttons">
          <button
            className="start-journey-btn"
            onClick={() => onStartNavigation && onStartNavigation(selectedEateries)}
          >
            Start Journey ({selectedEateries.length} Stops)
          </button>

          <div className="secondary-actions">
            <button
              className="save-btn"
              onClick={onSaveRoute}
            >
              💾 Save Route
            </button>
            <button
              className="load-btn"
              onClick={() => onShowSavedRoutes && onShowSavedRoutes(true)}
            >
              📂 Saved Routes
            </button>
          </div>
        </div>

        {/* User Actions (Logout etc) - Optional in footer, or keep hidden */}
        {currentUserId && (
          <div className="user-actions-footer">
            <span style={{ fontSize: '12px', color: '#666' }}>User: {currentUserId.substring(0, 8)}...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteResults;
