import React, { useState } from 'react';
import DraggableBottomSheet from './DraggableBottomSheet';
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
  onShowSavedRoutes
}) => {
  const [selectedPlaceType, setSelectedPlaceType] = useState('all');
  const [sheetState, setSheetState] = useState('collapsed'); // 'collapsed', 'mid', 'full'

  // Calculate route summary from selected route
  const selectedRoute = availableRoutes?.[selectedRouteIndex];
  const routeSummary = selectedRoute
    ? `${selectedRoute.legs?.[0]?.duration?.text || 'N/A'} • ${selectedRoute.legs?.[0]?.distance?.text || 'N/A'}`
    : 'Route Summary';

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 RouteResults - availableRoutes:', availableRoutes?.length);
    console.log('🔍 RouteResults - selectedRouteIndex:', selectedRouteIndex);
    console.log('🔍 RouteResults - filteredRestaurants:', filteredRestaurants?.length || 0);
    console.log('🔍 RouteResults - selectedPlaceType:', selectedPlaceType);
  }, [availableRoutes, selectedRouteIndex, filteredRestaurants, selectedPlaceType]);

  return (
    <>
      {/* Map is rendered in App.tsx as full-screen background */}
      {/* Back button and FOB route selector are in App.tsx */}

      {/* Draggable Bottom Sheet */}
      <DraggableBottomSheet
        routeSummary={routeSummary}
        onSave={onSaveRoute}
        onLoad={() => onShowSavedRoutes?.(true)}
        sheetState={sheetState}
        onStateChange={setSheetState}
      >
        {/* Filter Tabs */}
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

        {/* Places Selection */}
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

          if (placesToShow.length === 0) {
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
                  // Build stable unique id
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
                            onViewDetails?.(place);
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
      </DraggableBottomSheet>

      {/* Start Button - Fixed at bottom, only visible in mid/full states */}
      {(sheetState === 'mid' || sheetState === 'full') && (
        <div className="fixed-start-button">
          <button
            className="start-journey-btn"
            onClick={() => onStartNavigation?.(selectedEateries)}
          >
            Start Journey ({selectedEateries.length} Stops)
          </button>
        </div>
      )}
    </>
  );
};

export default RouteResults;
