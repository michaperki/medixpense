import axios from 'axios';
import { AxiosError } from 'axios';

// Define interfaces for improved type safety
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface ZipCodeMap {
  [zipCode: string]: Coordinates;
}

/**
 * Geocodes an address string to latitude and longitude coordinates
 * 
 * @param address - The address to geocode
 * @returns Coordinates or null if geocoding failed
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    // Log the geocoding attempt for debugging
    console.log(`Attempting to geocode: "${address}"`);
    
    // Handle ZIP code only inputs
    const zipCodeRegex = /^\d{5}(-\d{4})?$/;
    if (zipCodeRegex.test(address)) {
      address = `${address}, USA`; // Add country context for ZIP codes
    }
    
    // URL encode the address
    const encodedAddress = encodeURIComponent(address);
    
    // Make sure API key is available
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Missing GOOGLE_MAPS_API_KEY environment variable');
      return null;
    }
    
    // Make the geocoding request
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    const response = await axios.get(url);
    
    // Log the response status for debugging
    console.log(`Geocoding response status: ${response.data.status}`);
    
    // Check if the geocoding was successful
    if (response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
      console.error(`Geocoding failed: ${response.data.status || 'No results'}`);
      
      // For zip codes, return default coordinates based on common zip codes
      if (zipCodeRegex.test(address)) {
        // Hard-coded coordinates for common zip codes
        const zipCodeMap: ZipCodeMap = {
          '90210': { latitude: 34.0736, longitude: -118.4004 }, // Beverly Hills
          '10001': { latitude: 40.7501, longitude: -73.9996 }, // New York City
          '60601': { latitude: 41.8842, longitude: -87.6212 }  // Chicago
        };
        
        const zip = address.substring(0, 5);
        if (zip in zipCodeMap) {
          console.log(`Using default coordinates for ZIP code ${zip}`);
          return zipCodeMap[zip];
        }
      }
      
      return null;
    }
    
    // Extract the coordinates from the first result
    const location = response.data.results[0].geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng
    };
  } catch (error: unknown) {
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Geocoding error:', error.message);
    } else {
      console.error('Geocoding error:', error);
    }
    
    // Type check for axios error
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Response data:', axiosError.response.data);
        console.error('Response status:', axiosError.response.status);
      }
    }
    
    return null;
  }
}

/**
 * Reverse geocodes coordinates to an address
 * 
 * @param latitude - The latitude
 * @param longitude - The longitude
 * @returns Formatted address or null if reverse geocoding failed
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Missing GOOGLE_MAPS_API_KEY environment variable');
      return null;
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    const response = await axios.get(url);
    
    if (response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
      console.error(`Reverse geocoding failed: ${response.data.status || 'No results'}`);
      return null;
    }
    
    return response.data.results[0].formatted_address;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Reverse geocoding error:', error.message);
    } else {
      console.error('Reverse geocoding error:', error);
    }
    return null;
  }
}
