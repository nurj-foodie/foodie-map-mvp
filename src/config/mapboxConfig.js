// Mapbox Configuration
// Replace with your actual Mapbox access token
export const mapboxConfig = {
  accessToken: 'pk.eyJ1IjoibnVyai1tZWRpYSIsImEiOiJjbWgzOGdwYWswNHo5Mm9xMGVxMXllOGo3In0.LPWV713d55F-TseiPWfgmQ',
  defaultStyle: 'mapbox://styles/mapbox/streets-v11',
  styles: {
    streets: 'mapbox://styles/mapbox/streets-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    light: 'mapbox://styles/mapbox/light-v10',
    dark: 'mapbox://styles/mapbox/dark-v10',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11'
  }
};

// Set global access token
if (typeof window !== 'undefined' && window.mapboxgl) {
  window.mapboxgl.accessToken = mapboxConfig.accessToken;
}
