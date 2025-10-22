import React from 'react';

const RouteInput = ({
  isLoading,
  googleMapsLoaded,
  startLocation,
  endLocation,
  onGeocodeStart,
  onGeocodeEnd,
  onFindRoute,
  onShowSubmissionForm,
  onShowSaveRouteForm,
  onShowSavedRoutes
}) => {
  return (
    <div style={{ margin: '20px 0', width: '100%', maxWidth: '500px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label>Start Location:</label>
        <input
          type="text"
          placeholder="Enter start city (e.g., Kajang)"
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          onBlur={async (e) => {
            if (e.target.value) {
              await onGeocodeStart(e.target.value);
            }
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>End Location:</label>
        <input
          type="text"
          placeholder="Enter end city (e.g., Seremban)"
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          onBlur={async (e) => {
            if (e.target.value) {
              await onGeocodeEnd(e.target.value);
            }
          }}
        />
      </div>

      <button
        onClick={onFindRoute}
        disabled={!startLocation || !endLocation || isLoading || !googleMapsLoaded}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#CC0001',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: (isLoading || !googleMapsLoaded) ? 'not-allowed' : 'pointer',
          opacity: (isLoading || !googleMapsLoaded) ? 0.6 : 1,
          marginBottom: '10px'
        }}
      >
        {!googleMapsLoaded ? 'Loading Google Maps...' : isLoading ? 'Finding Route...' : `Find Food Along Route 🍽️ (${startLocation ? '✓' : '✗'} → ${endLocation ? '✓' : '✗'})`}
      </button>

      <button
        onClick={onShowSubmissionForm}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        ➕ Add New Restaurant
      </button>

      {startLocation && endLocation && (
        <button
          onClick={onShowSaveRouteForm}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          💾 Save This Route
        </button>
      )}

      <button
        onClick={onShowSavedRoutes}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        📁 View Saved Routes
      </button>
    </div>
  );
};

export default RouteInput;


