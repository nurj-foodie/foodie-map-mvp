// Google Maps TypeScript declarations
declare global {
  interface Window {
    google: {
      maps: {
        importLibrary: (library: string) => Promise<any>;
        Map: new (element: HTMLElement, options: any) => any;
        DirectionsService: new () => any;
        DirectionsRenderer: new () => any;
        TravelMode: {
          DRIVING: string;
        };
        UnitSystem: {
          METRIC: string;
        };
        places: {
          PlacesService: new (map: any) => any;
          PlacesServiceStatus: {
            OK: string;
          };
        };
        geometry: {
          spherical: {
            computeDistanceBetween: (point1: any, point2: any) => number;
          };
        };
        Marker: new (options: any) => any;
        InfoWindow: new (options: any) => any;
        Size: new (width: number, height: number) => any;
      };
    };
  }

  // Global google variable
  const google: {
    maps: {
      importLibrary: (library: string) => Promise<any>;
      Map: new (element: HTMLElement, options: any) => any;
      DirectionsService: new () => any;
      DirectionsRenderer: new () => any;
      TravelMode: {
        DRIVING: string;
      };
      UnitSystem: {
        METRIC: string;
      };
      places: {
        PlacesService: new (map: any) => any;
        PlacesServiceStatus: {
          OK: string;
        };
      };
      geometry: {
        spherical: {
          computeDistanceBetween: (point1: any, point2: any) => number;
        };
      };
      Marker: new (options: any) => any;
      InfoWindow: new (options: any) => any;
      Size: new (width: number, height: number) => any;
    };
  };
}

export {};
