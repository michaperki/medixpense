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
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [infoWindowPosition, setInfoWindowPosition] = useState<google.maps.LatLngLiteral | null>(null);
  
  // Update the selected marker when it changes from props
  useEffect(() => {
    if (selectedMarker) {
      setSelectedMarkerId(selectedMarker.id);
      // Make sure we have coordinates for the info window
      if (selectedMarker.location?.latitude && selectedMarker.location?.longitude) {
        setInfoWindowPosition({
          lat: selectedMarker.location.latitude,
          lng: selectedMarker.location.longitude
        });
      }
    } else {
      setSelectedMarkerId(null);
      setInfoWindowPosition(null);
    }
  }, [selectedMarker]);
  
  // Log the API key (without showing the actual key)
  useEffect(() => {
    console.log('Google Maps API Key Status:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
    // Debug data structure of results
    console.log('Map results:', results);
    console.log('Selected marker:', selectedMarker);
  }, [results, selectedMarker]);

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
  const mapCenter = center || (results.length > 0 && results[0].location?.latitude && results[0].location?.longitude
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

  // Guard against empty results
  if (!results || results.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No results to display on map</p>
      </div>
    );
  }

  const handleMarkerClick = (result: any) => {
    setSelectedMarkerId(result.id);
    setInfoWindowPosition({
      lat: result.location.latitude,
      lng: result.location.longitude
    });
    onMarkerClick?.(result);
  };

  const handleInfoWindowClose = () => {
    setSelectedMarkerId(null);
    setInfoWindowPosition(null);
    onMarkerClick?.(null);
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
      {results.map((result) => {
        // Check if location data exists and has coordinates
        if (!result.location?.latitude || !result.location?.longitude) {
          console.warn('Missing coordinates for marker:', result);
          return null;
        }

        // Check if this marker is selected
        const isSelected = selectedMarkerId === result.id;
        
        return (
          <Marker
            key={result.id}
            position={{ lat: result.location.latitude, lng: result.location.longitude }}
            onClick={() => handleMarkerClick(result)}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: isSelected ? 10 : 6,
              fillColor: isSelected ? '#2563EB' : '#FFFFFF',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#2563EB'
            }}
          />
        );
      })}

      {/* Separate InfoWindow component outside of the marker loop */}
      {selectedMarkerId && infoWindowPosition && (
        <InfoWindow
          position={infoWindowPosition}
          onCloseClick={handleInfoWindowClose}
        >
          <div className="space-y-2 max-w-xs">
            {selectedMarker && (
              <>
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium text-gray-900 pr-4">
                    {selectedMarker.provider?.name || "Provider"}
                  </h3>
                  <span className="text-sm font-semibold text-blue-600">
                    {formatPrice(selectedMarker.price)}
                  </span>
                </div>
                
                {selectedMarker.distance !== undefined && (
                  <div className="flex space-x-2">
                    <span className="text-xs text-gray-500">{formatDistance(selectedMarker.distance)}</span>
                  </div>
                )}
                
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-900">{selectedMarker.provider?.name || "Provider"}</p>
                  <p className="mt-1 text-xs text-gray-500 flex items-center">
                    <MapPinIcon className="h-3 w-3 mr-1"/>
                    {selectedMarker.location?.city}, {selectedMarker.location?.state}
                  </p>
                </div>
                
                {selectedMarker.provider?.id && (
                  <div className="mt-2 flex justify-between">
                    <Link href={`/providers/${selectedMarker.provider.id}`} className="text-xs font-medium text-gray-700 underline">
                      Details
                    </Link>
                    {selectedMarker.location?.city && (
                      <Link
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          `${selectedMarker.location.city}, ${selectedMarker.location.state}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-blue-600 underline"
                      >
                        Directions
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
