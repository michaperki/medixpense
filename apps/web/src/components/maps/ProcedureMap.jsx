// src/components/maps/ProcedureMap.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { MapPinIcon, PhoneIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type ProcedureMapProps = {
  results: any[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (result: any) => void;
  selectedMarker?: any | null;
};

// This is a mock implementation - in a real app you would use Google Maps or another mapping library
export default function ProcedureMap({ 
  results, 
  center, 
  zoom = 10, 
  onMarkerClick,
  selectedMarker 
}: ProcedureMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // In a real implementation, these would be markers on an actual map
  // For this demo, we'll just lay out "markers" in a grid
  const mapWidth = 800;
  const mapHeight = 600;
  
  // Generate mock positions for markers
  const markerPositions = results.map((result, index) => {
    // In a real app, you would use the actual lat/lng from the result
    // Here we just create a grid layout for demonstration
    const rowSize = Math.ceil(Math.sqrt(results.length));
    const row = Math.floor(index / rowSize);
    const col = index % rowSize;
    
    // Create a grid with some randomness
    const x = 100 + (col * (mapWidth - 200) / rowSize) + (Math.random() * 30);
    const y = 100 + (row * (mapHeight - 200) / rowSize) + (Math.random() * 30);
    
    return { x, y, result };
  });
  
  // Simulate map loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Format price
  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
  
  // Format distance
  const formatDistance = (distance?: number): string => {
    if (distance === undefined) return '';
    
    if (distance < 0.1) {
      return '<0.1 mi';
    } else if (distance < 10) {
      return `${distance.toFixed(1)} mi`;
    } else {
      return `${Math.round(distance)} mi`;
    }
  };
  
  if (!mapLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full bg-blue-50 overflow-hidden" ref={mapRef}>
      {/* Mock Map Background */}
      <div className="absolute inset-0 z-0">
        {/* Mock map grid lines */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-6">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border border-gray-200"></div>
          ))}
        </div>
        
        {/* Mock roads */}
        <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-300"></div>
        <div className="absolute top-2/3 left-0 right-0 h-1 bg-gray-300"></div>
        <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-gray-300"></div>
        <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-gray-300"></div>
        
        {/* Center marker if provided */}
        {center && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-6 w-6 rounded-full bg-blue-500 animate-ping opacity-75"></div>
            <div className="absolute top-0 left-0 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">You</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Markers */}
      {markerPositions.map(({ x, y, result }) => (
        <div 
          key={result.id}
          className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{ left: `${x}px`, top: `${y}px` }}
          onClick={() => onMarkerClick && onMarkerClick(result)}
        >
          <div 
            className={`flex items-center justify-center h-10 w-10 rounded-full shadow-md ${
              selectedMarker?.id === result.id
                ? 'bg-blue-600 text-white scale-125'
                : 'bg-white text-blue-600'
            } transition-all duration-200`}
          >
            <span className="text-sm font-semibold">${Math.round(result.price / 100)}</span>
          </div>
          
          {/* Info Window for selected marker */}
          {selectedMarker?.id === result.id && (
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 z-20 w-64">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-gray-900 pr-6">
                  {result.procedure.name}
                </h3>
                <span className="text-sm font-semibold text-blue-600">
                  {formatPrice(result.price)}
                </span>
              </div>
              
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {result.procedure.category.name}
                </span>
                {result.distance !== undefined && (
                  <span className="ml-1 text-xs text-gray-500">
                    {formatDistance(result.distance)}
                  </span>
                )}
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-900">
                  {result.location.provider.name}
                </p>
                <p className="mt-1 text-xs text-gray-500 flex items-start">
                  <MapPinIcon className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0 mt-0.5" />
                  <span>{result.location.address}, {result.location.city}</span>
                </p>
              </div>
              
              <div className="mt-2 flex justify-between">
                <Link
                  href={`/locations/${result.location.id}`}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Details
                </Link>
                <Link
                  href={`https://maps.google.com/?q=${result.location.address},${result.location.city},${result.location.state}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  Directions
                </Link>
              </div>
              
              {/* Arrow pointing to marker */}
              <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
            </div>
          )}
        </div>
      ))}
      
      {/* Map Controls (would be provided by actual map library) */}
      <div className="absolute right-4 top-4 flex flex-col space-y-2">
        <button className="bg-white rounded-full h-8 w-8 flex items-center justify-center shadow-md text-gray-700 hover:bg-gray-100">
          <span>+</span>
        </button>
        <button className="bg-white rounded-full h-8 w-8 flex items-center justify-center shadow-md text-gray-700 hover:bg-gray-100">
          <span>−</span>
        </button>
      </div>
      
      {/* Map Attribution (required by most map services) */}
      <div className="absolute bottom-1 right-1 text-xs text-gray-600 bg-white bg-opacity-75 px-1 rounded">
        Demo Map (not a real map service)
      </div>
    </div>
  );
}
