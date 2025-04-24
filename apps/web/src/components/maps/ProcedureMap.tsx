// src/components/maps/ProcedureMap.tsx
'use client';

import { useState, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { MapPinIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type ProcedureMapProps = {
  results: any[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (result: any) => void;
  selectedMarker?: any | null;
};

const containerStyle = { width: '100%', height: '100%' };
const libraries: ('places')[] = ['places'];

export default function ProcedureMap({
  results,
  center,
  zoom = 10,
  onMarkerClick,
  selectedMarker
}: ProcedureMapProps) {
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Log the API key (without showing the actual key)
  useEffect(() => {
    console.log('Google Maps API Key Status:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
  }, []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    // Adding these options to help prevent errors
    onLoad: () => console.log('Google Maps script loaded successfully'),
    onError: (error) => {
      console.error('Google Maps script failed to load:', error);
      setMapError('Failed to load Google Maps: ' + error);
    }
  });

  // Default to California if no center is provided
  const mapCenter = center || (results.length > 0
    ? { lat: results[0].location.latitude, lng: results[0].location.longitude }
    : { lat: 37.7749, lng: -122.4194 } // San Francisco as default
  );

  if (loadError || mapError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-red-50 text-red-700">
        <p>Error loading map: {loadError?.message || mapError}</p>
        <p className="text-sm mt-2">
          Please verify your Google Maps API key is correctly set up in your environment variables as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and 
          the following APIs are enabled in your Google Cloud Console:
        </p>
        <ul className="list-disc ml-6 mt-2 text-sm">
          <li>Maps JavaScript API</li>
          <li>Geocoding API</li>
          <li>Places API</li>
        </ul>
      </div>
    );
  }
  
  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        <p className="ml-4">Loading map...</p>
      </div>
    );
  }

  const formatPrice = (price: number) =>
    price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
    
  const formatDistance = (d?: number) => {
    if (d === undefined) return '';
    if (d < 0.1) return '<0.1 mi';
    return d < 10 ? `${d.toFixed(1)} mi` : `${Math.round(d)} mi`;
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={zoom}
      options={{ 
        streetViewControl: false, 
        mapTypeControl: false,
        fullscreenControl: true
      }}
    >
      {results.map((result) => (
        <Marker
          key={result.id}
          position={{ lat: result.location.latitude, lng: result.location.longitude }}
          onClick={() => onMarkerClick?.(result)}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: selectedMarker?.id === result.id ? 10 : 6,
            fillColor: selectedMarker?.id === result.id ? '#2563EB' : '#FFFFFF',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#2563EB'
          }}
        >
          {selectedMarker?.id === result.id && (
            <InfoWindow onCloseClick={() => onMarkerClick?.(null)}>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium text-gray-900 pr-4">{result.procedure.name}</h3>
                  <span className="text-sm font-semibold text-blue-600">{formatPrice(result.price)}</span>
                </div>
                <div className="flex space-x-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">{result.procedure.category.name}</span>
                  {result.distance !== undefined && <span className="text-xs text-gray-500">{formatDistance(result.distance)}</span>}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-900">{result.location.provider.name}</p>
                  <p className="mt-1 text-xs text-gray-500 flex items-center"><MapPinIcon className="h-3 w-3 mr-1"/>{result.location.address}, {result.location.city}</p>
                </div>
                <div className="mt-2 flex justify-between">
                  <Link href={`/locations/${result.location.id}`} className="text-xs font-medium text-gray-700 underline">Details</Link>
                  <Link
                    href={`https://maps.google.com/?q=${encodeURIComponent(result.location.address + ', ' + result.location.city + ', ' + result.location.state)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 underline"
                  >Directions</Link>
                </div>
              </div>
            </InfoWindow>
          )}
        </Marker>
      ))}
    </GoogleMap>
  );
}
