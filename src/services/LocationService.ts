/**
 * ENCAPSULATION: LocationService class encapsulates all location-related logic
 * Private methods and properties are hidden, only public interface is exposed
 */

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  timestamp: Date;
}

export class LocationService {
  // ENCAPSULATION: Private static instance for singleton pattern
  private static instance: LocationService;
  private _currentLocation: LocationData | null = null;
  private _watchId: number | null = null;

  // Private constructor prevents direct instantiation
  private constructor() {}

  // Singleton pattern: Only one instance of LocationService exists
  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // ENCAPSULATION: Public getter for current location (read-only)
  get currentLocation(): LocationData | null {
    return this._currentLocation;
  }

  // Public method to capture location
  async captureLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await this.reverseGeocode(latitude, longitude);

          this._currentLocation = {
            lat: latitude,
            lng: longitude,
            address,
            timestamp: new Date(),
          };

          resolve(this._currentLocation);
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  // Watch location continuously
  startWatchingLocation(callback: (location: LocationData) => void): void {
    if (!("geolocation" in navigator)) return;

    this._watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await this.reverseGeocode(latitude, longitude);

        this._currentLocation = {
          lat: latitude,
          lng: longitude,
          address,
          timestamp: new Date(),
        };

        callback(this._currentLocation);
      },
      (error) => console.error("Watch location error:", error),
      { enableHighAccuracy: true }
    );
  }

  // Stop watching location
  stopWatchingLocation(): void {
    if (this._watchId !== null) {
      navigator.geolocation.clearWatch(this._watchId);
      this._watchId = null;
    }
  }

  // ENCAPSULATION: Private method for reverse geocoding
  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Using OpenStreetMap Nominatim for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    } catch (error) {
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
  }

  // Get distance between two points (Haversine formula)
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}
