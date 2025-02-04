import { Injectable } from '@angular/core';
import { Geolocation } from '@awesome-cordova-plugins/geolocation/ngx';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  googleMapsLoaded: boolean = false;

  constructor(private geolocation: Geolocation) {}

  /**
   * ✅ **Check location permission before requesting location**
   * Ensures iOS does not block UI when permissions are not granted.
   */
  async checkLocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!navigator.permissions) {
        console.warn('⚠️ Location permissions not supported on this device.');
        resolve(false);
        return;
      }

      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((permission) => {
        console.log('🔍 Location permission status:', permission.state);

        if (permission.state === 'granted') {
          resolve(true);
        } else if (permission.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000 }
          );
        } else {
          permission.onchange = () => resolve(permission.state === 'granted');
        }
      }).catch((error) => {
        console.error('🚨 Error checking location permissions:', error);
        resolve(false);
      });
    });
  }

  /**
   * 📍 **Get current position only if permission is granted**
   */
  async getCurrentPosition(): Promise<any> {
    const hasPermission = await this.checkLocationPermission();
    if (!hasPermission) {
      throw new Error('❌ Location permission not granted.');
    }

    return this.geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    });
  }

  /**
   * 🔄 **Watch user location updates (Real-time tracking)**
   */
  watchPosition(): Observable<any> {
    return new Observable((observer) => {
      this.checkLocationPermission().then(hasPermission => {
        if (!hasPermission) {
          observer.error('❌ Location permission denied.');
          return;
        }

        const watchId = this.geolocation.watchPosition({
          enableHighAccuracy: true,
        }).subscribe(
          (position: any) => observer.next(position),
          (error) => observer.error(error)
        );

        return () => watchId.unsubscribe();
      });
    });
  }

  /**
   * 📌 **Convert coordinates to an address using Google Maps API**
   */
  getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps?.Geocoder) {
        return reject('❌ Google Maps API not loaded.');
      }

      const geocoder = new google.maps.Geocoder();
      const latlng = { lat, lng };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK" && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(`❌ Geocoder failed: ${status}`);
        }
      });
    });
  }

  /**
   * 🏆 **Get autocomplete place suggestions**
   */
  async getPlaceSuggestions(input: string): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.maps.places) {
        reject("❌ Google Maps API not loaded");
        return;
      }

      const service = new google.maps.places.AutocompleteService();
      const request = {
        input,
        componentRestrictions: { country: 'br' },
        types: ['geocode'],
      };

      service.getPlacePredictions(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          const placeResults = results.map(result => ({
            place_id: result.place_id,
            description: result.description,
          } as unknown as google.maps.places.PlaceResult));
          resolve(placeResults);
        } else {
          console.error("❌ Error fetching place suggestions:", status);
          reject(status);
        }
      });
    });
  }

  /**
   * 🗺️ **Calculate distance and time between two locations**
   */
  async calculateDistanceAndTime(from: string, to: string): Promise<{ distance: number; duration: number }> {
    const hasPermission = await this.checkLocationPermission();
    if (!hasPermission) {
      throw new Error('❌ Location permission not granted');
    }

    return new Promise((resolve, reject) => {
      if (!window.google?.maps?.DistanceMatrixService) {
        return reject('❌ Google Maps API not loaded.');
      }

      const service = new google.maps.DistanceMatrixService();

      const request: google.maps.DistanceMatrixRequest = {
        origins: [from],
        destinations: [to],
        travelMode: google.maps.TravelMode.DRIVING,
      };

      service.getDistanceMatrix(request, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response?.rows?.[0]?.elements?.[0]) {
          const element = response.rows[0].elements[0];
          if (element.status === 'OK') {
            const distance = element.distance.value / 1000; // Convert to KM
            const duration = element.duration.value / 60; // Convert to minutes
            resolve({ distance, duration });
          } else {
            reject(new Error(`❌ Route calculation failed: ${element.status}`));
          }
        } else {
          console.error('❌ Error calculating distance and time:', status);
          reject(new Error(`Distance Matrix failed: ${status}`));
        }
      });
    });
  }

  /**
   * 📌 **Convert an address to coordinates using Google Maps API**
   */
  public geocodeAddress(address: string): Promise<google.maps.LatLng> {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps?.Geocoder) {
        return reject('❌ Google Maps API not loaded.');
      }

      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
          const location = results[0].geometry.location;
          resolve(location);
        } else {
          reject(`❌ Geocoding failed: ${status}`);
        }
      });
    });
  }

  /**
   * 🛠️ **Get autocomplete suggestions**
   */
  getAutocompleteSuggestions(input: string): any[] {
    const suggestions = [];
    const query = input.toLowerCase();

    this.getPlaceSuggestions(input).then((results) => {
      results.forEach((result) => {
        const resultDescription = (result as any).description;
        if (resultDescription && resultDescription.toLowerCase().includes(query)) {
          suggestions.push(result);
        }
      });
    });

    return suggestions;
  }
}
