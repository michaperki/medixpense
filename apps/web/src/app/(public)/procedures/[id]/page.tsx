'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { proceduresApi } from '@/lib/api';
import { handleApiError } from '@/lib/api/handleApiError';
import { ProcedureDetail } from '@/services/procedureService'; // Import the type
import {
  MapPinIcon,
  PhoneIcon,
  ChevronLeftIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  TagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const ProcedureMap = dynamic(() => import('@/components/maps/ProcedureMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 h-64 w-full flex items-center justify-center">
      <div className="spinner spinner-md" />
    </div>
  )
});

type Provider = {
  id: string;
  name: string;
  phone?: string;
  website?: string;
  description?: string;
  location: {
    id: string;
    address1?: string;
    address2?: string;
    city: string;
    state: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  };
};

export default function ProcedureDetailPage() {
  /* ------------------------------------------------------------
   * Routing
   * ---------------------------------------------------------- */
  const params = useParams();
  const procedureId = params?.id as string;

  /* ------------------------------------------------------------
   * Data
   * ---------------------------------------------------------- */
  const [procedure, setProcedure] = useState<ProcedureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  /* ------------------------------------------------------------
   * Fetch procedure data
   * ---------------------------------------------------------- */
  useEffect(() => {
    if (!procedureId) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Add debugging to see the request/response
        console.log(`Fetching procedure with ID: ${procedureId}`);
        const res = await proceduresApi.getProcedureById(procedureId);
        console.log('Procedure data received:', res);
        
        if (!res || !res.procedure) {
          throw new Error('Invalid response format from API');
        }
        
        setProcedure(res.procedure);
        
        // If there are providers with locations, center the map on the first one
        if (res.procedure?.providers?.length > 0) {
          const firstProviderWithLocation = res.procedure.providers.find(
            p => p.provider?.location?.latitude && p.provider?.location?.longitude
          );
          
          if (firstProviderWithLocation) {
            setMapCenter({
              lat: firstProviderWithLocation.provider.location.latitude!,
              lng: firstProviderWithLocation.provider.location.longitude!
            });
            setSelectedProvider(firstProviderWithLocation.id);
          }
        }
      } catch (err) {
        console.error('Error fetching procedure:', err);
        handleApiError(err, 'getProcedureById');
        setError('Failed to load procedure details. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [procedureId]);

  /* ------------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------- */
  const formatAddress = (location: Provider['location']) => {
    if (!location) return '';
    const parts = [
      location.address1,
      location.address2,
      `${location.city}, ${location.state}${location.zipCode ? ` ${location.zipCode}` : ''}`,
    ].filter(Boolean);
    return parts.join(', ');
  };

  /* ------------------------------------------------------------
   * Create map data from providers with proper structure
   * ---------------------------------------------------------- */
  const createMapData = (proc: ProcedureDetail | null) => {
    if (!proc?.providers) return [];
    
    return proc.providers
      .filter(p => p.provider?.location?.latitude && p.provider?.location?.longitude)
      .map(p => ({
        id: p.id,
        price: p.price,
        provider: {
          id: p.provider.id,
          name: p.provider.name
        },
        location: {
          id: p.provider.location.id,
          city: p.provider.location.city,
          state: p.provider.location.state,
          latitude: p.provider.location.latitude,
          longitude: p.provider.location.longitude
        }
      }));
  };

  /* ------------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */
  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (error || !procedure) {
    return (
      <div className="container py-8">
        <div className="alert alert-error">{error || 'Procedure not found'}</div>
        <Link href="/search" className="btn btn-outline mt-4 inline-flex items-center">
          <ChevronLeftIcon className="h-5 w-5 mr-2" />
          Back to Search
        </Link>
      </div>
    );
  }

  // Create map data with the right structure for the map component
  const mapData = createMapData(procedure);

  return (
    <div className="bg-white">
      {/* HEADER */}
      <div className="bg-primary text-white">
        <div className="container py-6">
          <Link href="/search" className="inline-flex items-center text-white hover:underline mb-2">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Back to Search
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">{procedure.name}</h1>
          <div className="mt-2 inline-flex items-center">
            <TagIcon className="h-5 w-5 mr-2" />
            <span className="text-sm">{procedure.category?.name}</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* LEFT COLUMN - Procedure Info */}
          <div className="md:col-span-1">
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">About this Procedure</h2>
              
              {procedure.description && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-800 mb-1">Description</h3>
                  <p className="text-sm text-gray-600">
                    {showFullDescription 
                      ? procedure.description 
                      : `${procedure.description.substring(0, 200)}${procedure.description.length > 200 ? '...' : ''}`}
                  </p>
                  {procedure.description.length > 200 && (
                    <button 
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-primary text-sm mt-1 hover:underline"
                    >
                      {showFullDescription ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}

              {procedure.duration && (
                <div className="mb-4 flex items-start">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-800">Duration</h3>
                    <p className="text-sm text-gray-600">{procedure.duration}</p>
                  </div>
                </div>
              )}

              {procedure.preparation && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-800 mb-1">Preparation</h3>
                  <p className="text-sm text-gray-600">{procedure.preparation}</p>
                </div>
              )}

              {procedure.aftercare && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-800 mb-1">Aftercare</h3>
                  <p className="text-sm text-gray-600">{procedure.aftercare}</p>
                </div>
              )}

              {procedure.averagePrice !== undefined && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Average Price:</span>
                    <span className="font-medium">${procedure.averagePrice.toFixed(2)}</span>
                  </div>
                  {procedure.lowestPrice !== undefined && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Lowest Price:</span>
                      <span className="font-medium text-green-600">${procedure.lowestPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {procedure.highestPrice !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Highest Price:</span>
                      <span className="font-medium">${procedure.highestPrice.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Providers */}
          <div className="md:col-span-2">
            {/* Map */}
            {mapData.length > 0 && (
              <div className="card p-0 mb-6" style={{ height: '300px' }}>
                <ProcedureMap
                  results={mapData}
                  center={mapCenter ?? undefined}
                  selectedMarker={mapData.find(m => m.id === selectedProvider) ?? undefined}
                  onMarkerClick={(result) => setSelectedProvider(result?.id ?? null)}
                />
              </div>
            )}

            {/* Provider List */}
            <h2 className="text-xl font-semibold mb-4">
              Available Providers ({procedure.providers?.length || 0})
            </h2>
            
            {!procedure.providers || procedure.providers.length === 0 ? (
              <div className="alert alert-info">No providers available for this procedure.</div>
            ) : (
              <div className="space-y-4">
                {procedure.providers.map(p => (
                  <div 
                    key={p.id} 
                    className={`card p-4 hover:border-primary transition-colors cursor-pointer ${
                      selectedProvider === p.id ? 'border-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedProvider(p.id);
                      if (p.provider?.location?.latitude && p.provider?.location?.longitude) {
                        setMapCenter({
                          lat: p.provider.location.latitude,
                          lng: p.provider.location.longitude
                        });
                      }
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{p.provider?.name || 'Provider'}</h3>
                        
                        {p.provider?.location && (
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {formatAddress(p.provider.location)}
                          </div>
                        )}
                        
                        {p.provider?.phone && (
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {p.provider.phone}
                          </div>
                        )}
                        
                        {p.provider?.description && (
                          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{p.provider.description}</p>
                        )}
                      </div>
                      
                      <div className="mt-3 md:mt-0 text-right">
                        <div className="flex items-center justify-end">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-1" />
                          <span className="text-xl font-bold text-gray-800">${p.price.toFixed(2)}</span>
                        </div>
                        
                        {p.savingsPercent && (
                          <div className="text-sm text-green-600 mt-1">
                            Save {p.savingsPercent}% compared to average
                          </div>
                        )}
                        
                        {p.provider?.website && (
                          <a 
                            href={p.provider.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline mt-2 inline-flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                            Visit Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
