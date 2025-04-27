'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { handleApiError } from '@/lib/api/handleApiError';
import {
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ClockIcon,
  StarIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const ProcedureMap = dynamic(() => import('@/components/maps/ProcedureMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 h-64 w-full flex items-center justify-center">
      <div className="spinner spinner-md" />
    </div>
  )
});

type Location = {
  id: string;
  name?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
};

type Procedure = {
  id: string;
  name: string;
  description?: string;
  price: number;
  savingsPercent?: number;
  category: {
    id: string;
    name: string;
  };
};

type Provider = {
  id: string;
  name: string;
  organizationName?: string;
  description?: string;
  mission?: string;
  logoUrl?: string;
  website?: string;
  phone?: string;
  email?: string;
  yearEstablished?: number;
  licensingInfo?: string;
  insuranceAccepted?: string[];
  specialties?: string[];
  services?: string[];
  reviewCount?: number;
  rating?: number;
  locations: Location[];
  procedures: Procedure[];
};

// Categories for grouping procedures
type Category = {
  id: string;
  name: string;
};

export default function ProviderDetailPage() {
  /* ------------------------------------------------------------
   * Routing
   * ---------------------------------------------------------- */
  const params = useParams();
  const router = useRouter();
  const providerId = params?.id as string;

  /* ------------------------------------------------------------
   * Data
   * ---------------------------------------------------------- */
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  
  // For procedure list
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [procedureSearch, setProcedureSearch] = useState<string>('');
  const [expandedHours, setExpandedHours] = useState<boolean>(false);

  /* ------------------------------------------------------------
   * Fetch provider data
   * ---------------------------------------------------------- */
  useEffect(() => {
    if (!providerId) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching provider with ID: ${providerId}`);
        // You'll need to create this API endpoint
        const res = await api.providers.getProviderById(providerId);
        console.log('Provider data received:', res);
        
        if (!res || !res.provider) {
          throw new Error('Invalid response format from API');
        }
        
        setProvider(res.provider);
        
        // Set the first location as selected by default if available
        if (res.provider.locations?.length > 0) {
          setSelectedLocation(res.provider.locations[0]);
          
          // Center map on first location with coordinates
          const locationWithCoords = res.provider.locations.find(
            loc => loc.latitude && loc.longitude
          );
          
          if (locationWithCoords) {
            setMapCenter({
              lat: locationWithCoords.latitude!,
              lng: locationWithCoords.longitude!
            });
          }
        }
        
        // Extract unique categories from procedures
        if (res.provider.procedures?.length > 0) {
          const uniqueCategories = [...new Map(
            res.provider.procedures
              .map(proc => proc.category)
              .filter(Boolean) // Remove nulls
              .map(cat => [cat.id, cat]) // Use id as key
          ).values()];
          
          setCategories(uniqueCategories);
        }
      } catch (err) {
        console.error('Error fetching provider:', err);
        handleApiError(err, 'getProviderById');
        setError('Failed to load provider details. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [providerId]);

  /* ------------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------- */
  const formatAddress = (location: Location) => {
    if (!location) return '';
    const parts = [
      location.address1,
      location.address2,
      `${location.city}, ${location.state}${location.zipCode ? ` ${location.zipCode}` : ''}`,
    ].filter(Boolean);
    return parts.join(', ');
  };
  
  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    // Format as (xxx) xxx-xxxx
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return phone; // Return original if not 10 digits
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };
  
  const filteredProcedures = () => {
    if (!provider?.procedures) return [];
    
    return provider.procedures.filter(proc => {
      // Filter by category if not 'all'
      if (selectedCategory !== 'all' && proc.category?.id !== selectedCategory) {
        return false;
      }
      
      // Filter by search text
      if (procedureSearch && !proc.name.toLowerCase().includes(procedureSearch.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };
  
  // For the map
  const mapLocations = provider?.locations?.filter(loc => loc.latitude && loc.longitude) || [];

  /* ------------------------------------------------------------
   * Rating Stars Component
   * ---------------------------------------------------------- */
  const RatingStars = ({ rating, reviewCount }: { rating?: number, reviewCount?: number }) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            star <= Math.floor(rating) ? (
              <StarIconSolid key={star} className="h-5 w-5 text-yellow-400" />
            ) : star - 0.5 <= rating ? (
              // Half star
              <div key={star} className="relative h-5 w-5">
                <StarIconSolid className="absolute h-5 w-5 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                <StarIcon className="absolute h-5 w-5 text-gray-300" style={{ clipPath: 'inset(0 0 0 50%)' }} />
              </div>
            ) : (
              <StarIcon key={star} className="h-5 w-5 text-gray-300" />
            )
          ))}
        </div>
        <span className="ml-2 text-gray-600">
          {rating.toFixed(1)} {reviewCount ? `(${reviewCount} reviews)` : ''}
        </span>
      </div>
    );
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

  if (error || !provider) {
    return (
      <div className="container py-8">
        <div className="alert alert-error">{error || 'Provider not found'}</div>
        <Link href="/providers" className="btn btn-outline mt-4 inline-flex items-center">
          <ChevronLeftIcon className="h-5 w-5 mr-2" />
          Back to Providers
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* HEADER */}
      <div className="bg-primary text-white">
        <div className="container py-6">
          <Link href="/providers" className="inline-flex items-center text-white hover:underline mb-2">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Back to Providers
          </Link>
          <div className="flex flex-col md:flex-row md:items-center">
            {provider.logoUrl && (
              <div className="mr-4 mb-4 md:mb-0">
                <img 
                  src={provider.logoUrl} 
                  alt={provider.name} 
                  className="h-16 w-16 object-contain bg-white rounded-md"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{provider.name}</h1>
              {provider.specialties && provider.specialties.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {provider.specialties.map(specialty => (
                    <span key={specialty} className="bg-blue-700 bg-opacity-50 text-white text-xs px-2 py-0.5 rounded-full">
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* LEFT COLUMN - Provider Info */}
          <div className="md:col-span-1">
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">About {provider.name}</h2>
              
              <RatingStars rating={provider.rating} reviewCount={provider.reviewCount} />
              
              {provider.description && (
                <div className="mt-4">
                  <p className="text-gray-600">{provider.description}</p>
                </div>
              )}
              
              {provider.mission && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-800 mb-1">Our Mission</h3>
                  <p className="text-sm text-gray-600">{provider.mission}</p>
                </div>
              )}
              
              {provider.yearEstablished && (
                <div className="mt-4 flex items-center text-gray-600">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                  Established in {provider.yearEstablished}
                </div>
              )}
              
              {provider.website && (
                <div className="mt-4 flex items-center">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <a 
                    href={provider.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline"
                  >
                    {provider.website.replace(/^https?:\/\//i, '')}
                  </a>
                </div>
              )}
              
              {provider.phone && (
                <div className="mt-4 flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <a href={`tel:${provider.phone}`} className="text-gray-600">
                    {formatPhone(provider.phone)}
                  </a>
                </div>
              )}
              
              {provider.email && (
                <div className="mt-4 flex items-center">
                  <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline">
                    {provider.email}
                  </a>
                </div>
              )}
            </div>
            
            {provider.insuranceAccepted && provider.insuranceAccepted.length > 0 && (
              <div className="card p-6 mb-6">
                <h3 className="font-medium text-gray-800 mb-3">Insurance Accepted</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.insuranceAccepted.map((insurance) => (
                    <span key={insurance} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      {insurance}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {provider.services && provider.services.length > 0 && (
              <div className="card p-6">
                <h3 className="font-medium text-gray-800 mb-3">Services</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {provider.services.map((service) => (
                    <li key={service}>{service}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Locations and Procedures */}
          <div className="md:col-span-2">
            {/* Locations */}
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Locations</h2>
              
              {mapLocations.length > 0 && (
                <div className="mb-4 h-64">
                  <ProcedureMap
                    results={mapLocations.map(loc => ({
                      id: loc.id,
                      provider: {
                        id: provider.id,
                        name: provider.name
                      },
                      location: {
                        id: loc.id,
                        city: loc.city,
                        state: loc.state,
                        latitude: loc.latitude,
                        longitude: loc.longitude
                      }
                    }))}
                    center={mapCenter ?? undefined}
                    selectedMarker={selectedLocation ? {
                      id: selectedLocation.id,
                      provider: {
                        id: provider.id,
                        name: provider.name
                      },
                      location: {
                        id: selectedLocation.id,
                        city: selectedLocation.city,
                        state: selectedLocation.state,
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude
                      }
                    } : undefined}
                    onMarkerClick={(result) => {
                      if (result) {
                        const location = provider.locations.find(loc => loc.id === result.id);
                        if (location) {
                          setSelectedLocation(location);
                        }
                      }
                    }}
                  />
                </div>
              )}
              
              <div className="space-y-4">
                {provider.locations.map(location => (
                  <div 
                    key={location.id}
                    className={`p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors ${
                      selectedLocation?.id === location.id ? 'border-primary bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedLocation(location);
                      if (location.latitude && location.longitude) {
                        setMapCenter({
                          lat: location.latitude,
                          lng: location.longitude
                        });
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {location.name || 'Main Location'}
                        </h3>
                        <div className="mt-1 flex items-center text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {formatAddress(location)}
                        </div>
                        
                        {location.phone && (
                          <div className="mt-1 flex items-center text-sm text-gray-600">
                            <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {formatPhone(location.phone)}
                          </div>
                        )}
                      </div>
                      
                      {location.latitude && location.longitude && (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(formatAddress(location))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Get Directions
                        </a>
                      )}
                    </div>
                    
                    {selectedLocation?.id === location.id && location.hours && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button 
                          className="flex items-center text-sm font-medium text-gray-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedHours(!expandedHours);
                          }}
                        >
                          <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                          Hours
                          <ChevronDownIcon className={`h-4 w-4 ml-1 text-gray-400 transition-transform ${
                            expandedHours ? 'transform rotate-180' : ''
                          }`} />
                        </button>
                        
                        {expandedHours && (
                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            {location.hours.monday && (
                              <>
                                <div className="text-gray-600">Monday</div>
                                <div>{location.hours.monday}</div>
                              </>
                            )}
                            {location.hours.tuesday && (
                              <>
                                <div className="text-gray-600">Tuesday</div>
                                <div>{location.hours.tuesday}</div>
                              </>
                            )}
                            {location.hours.wednesday && (
                              <>
                                <div className="text-gray-600">Wednesday</div>
                                <div>{location.hours.wednesday}</div>
                              </>
                            )}
                            {location.hours.thursday && (
                              <>
                                <div className="text-gray-600">Thursday</div>
                                <div>{location.hours.thursday}</div>
                              </>
                            )}
                            {location.hours.friday && (
                              <>
                                <div className="text-gray-600">Friday</div>
                                <div>{location.hours.friday}</div>
                              </>
                            )}
                            {location.hours.saturday && (
                              <>
                                <div className="text-gray-600">Saturday</div>
                                <div>{location.hours.saturday}</div>
                              </>
                            )}
                            {location.hours.sunday && (
                              <>
                                <div className="text-gray-600">Sunday</div>
                                <div>{location.hours.sunday}</div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Procedures */}
            <div className="card p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-xl font-semibold mb-2 md:mb-0">
                  Available Procedures ({provider.procedures.length})
                </h2>
                
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={procedureSearch}
                    onChange={(e) => setProcedureSearch(e.target.value)}
                    placeholder="Search procedures..."
                    className="form-input pl-10 py-2"
                  />
                </div>
              </div>
              
              {categories.length > 0 && (
                <div className="mb-4">
                  <div className="flex overflow-x-auto gap-2 pb-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                        selectedCategory === 'all' 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      All Categories
                    </button>
                    
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                          selectedCategory === category.id 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {filteredProcedures().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {procedureSearch
                    ? `No procedures matching "${procedureSearch}"` 
                    : 'No procedures available in this category'}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredProcedures().map(procedure => (
                    <div key={procedure.id} className="py-4">
                      <div className="flex flex-col md:flex-row md:justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            <Link href={`/procedures/${procedure.id}`} className="hover:underline">
                              {procedure.name}
                            </Link>
                          </h3>
                          
                          {procedure.category && (
                            <div className="mt-1">
                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                                {procedure.category.name}
                              </span>
                            </div>
                          )}
                          
                          {procedure.description && (
                            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                              {procedure.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="mt-2 md:mt-0 text-right">
                          <div className="text-lg font-medium text-gray-800">
                            ${procedure.price.toFixed(2)}
                          </div>
                          
                          {procedure.savingsPercent && (
                            <div className="text-xs text-green-600">
                              Save {procedure.savingsPercent}% vs. average
                            </div>
                          )}
                          
                          <Link
                            href={`/procedures/${procedure.id}`}
                            className="mt-2 inline-block text-blue-600 text-sm hover:underline"
                          >
                            Compare prices
                            <ChevronRightIcon className="inline-block h-4 w-4 ml-1" />
                          </Link>
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
    </div>
  );
}
