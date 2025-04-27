'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { handleApiError } from '@/lib/api/handleApiError';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ListBulletIcon,
  MapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { ProviderListItem } from '@/services/providerService'; // Import the types

const ProcedureMap = dynamic(() => import('@/components/maps/ProcedureMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 h-64 w-full flex items-center justify-center">
      <div className="spinner spinner-md" />
    </div>
  )
});

type Pagination = { page: number; limit: number; total: number; pages: number };

export default function ProvidersPage() {
  /* ------------------------------------------------------------
   * Routing + query-string helpers
   * ---------------------------------------------------------- */
  const searchParams = useSearchParams();
  const router = useRouter();

  const qp = (key: string, fallback = '') => searchParams.get(key) ?? fallback;

  /* ------------------------------------------------------------
   * Controlled inputs (synced ←→ query-string)
   * ---------------------------------------------------------- */
  const [searchQuery, setSearchQuery] = useState(qp('query'));
  const [location, setLocation] = useState(qp('location'));
  const [distance, setDistance] = useState(qp('distance', '50'));
  const [specialty, setSpecialty] = useState(qp('specialty'));
  const [sort, setSort] = useState(qp('sort', 'distance_asc'));

  /* ------------------------------------------------------------
   * Data
   * ---------------------------------------------------------- */
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [providers, setProviders] = useState<ProviderListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------
   * View state
   * ---------------------------------------------------------- */
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderListItem | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* ------------------------------------------------------------
   * Fetch specialties once
   * ---------------------------------------------------------- */
  useEffect(() => {
    // Use the correct provider service method
    api.providers.getSpecialties()
      .then((res) => {
        if (res.specialties) {
          setSpecialties(res.specialties);
        }
      })
      .catch((err) => handleApiError(err, 'fetchSpecialties'));
  }, []);

  /* ------------------------------------------------------------
   * Fetch providers whenever the query-string changes
   * ---------------------------------------------------------- */
  const lastKey = useRef('');

  useEffect(() => {
    const q = qp('query');
    const loc = qp('location');
    const dist = qp('distance', '50');
    const spec = qp('specialty');
    const srt = qp('sort', 'distance_asc');
    const pg = parseInt(qp('page', '1'), 10);

    // sync controlled inputs (when user hits back/forward)
    setSearchQuery(q);
    setLocation(loc);
    setDistance(dist);
    setSpecialty(spec);
    setSort(srt);

    const key = [q, loc, dist, spec, srt, pg].join('|');
    if (!loc && !q && !spec) return; // nothing to search yet
    if (key === lastKey.current) return;
    lastKey.current = key;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the correct search method
        const res = await api.search.searchProviders({
          query: q,
          location: loc,
          distance: dist,
          specialty: spec,
          sort: srt,
          page: pg.toString(),
          limit: '20'
        });
        
        console.log('Provider search results:', res);
        setProviders(Array.isArray(res.providers) ? res.providers : []);
        setPagination(res.pagination ?? { page: pg, limit: 20, total: 0, pages: 0 });
        
        if (res.data?.searchLocation) {
          setMapCenter({ lat: res.data.searchLocation.latitude, lng: res.data.searchLocation.longitude });
        }
      } catch (err) {
        console.error('Provider search error:', err);
        handleApiError(err, 'searchProviders');
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  /* ------------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------- */
  const pushParams = (p: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(p).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.set('page', '1'); // reset paging on new search
    router.push(`/providers?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams({ 
      query: searchQuery, 
      location, 
      distance, 
      specialty, 
      sort 
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/providers?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatMiles = (d?: number) => (d ? `${d.toFixed(1)} mi` : '');
  
  const formatRating = (rating?: number, reviewCount?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg 
              key={star} 
              className={`h-4 w-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="ml-1 text-sm text-gray-600">
          {rating.toFixed(1)} {reviewCount ? `(${reviewCount})` : ''}
        </span>
      </div>
    );
  };

  /* ------------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */
  return (
    <div className="bg-white">
      {/* SEARCH BAR */}
      <div className="bg-primary">
        <div className="container py-6">
          <h1 className="text-2xl font-bold text-white mb-4">Find Healthcare Providers</h1>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">
            {/* search query */}
            <div className="md:col-span-2 relative">
              <label htmlFor="searchQuery" className="text-white text-sm mb-1 block">Provider or Specialty</label>
              <MagnifyingGlassIcon className="absolute left-3 top-9 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                id="searchQuery"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Provider name, specialty..."
                style={{ paddingLeft: '2rem' }}
                className="form-input pl-10"
              />
            </div>
            {/* location */}
            <div className="md:col-span-1 relative">
              <label htmlFor="location" className="text-white text-sm mb-1 block">Location</label>
              <MapPinIcon className="absolute left-3 top-9 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                id="location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="ZIP or City"
                style={{ paddingLeft: '2rem' }}
                className="form-input pl-10"
              />
            </div>
            {/* distance */}
            <div className="md:col-span-1">
              <label htmlFor="distance" className="text-white text-sm mb-1 block">Distance</label>
              <select
                id="distance"
                value={distance}
                onChange={e => setDistance(e.target.value)}
                className="form-select"
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
                <option value="100">100 miles</option>
              </select>
            </div>
            {/* submit */}
            <div className="flex items-end">
              <button type="submit" className="btn btn-primary w-full md:w-auto flex items-center justify-center">
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RESULTS */}
      <div className="container py-8">
        {providers.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-gray-800">
              {loading ? 'Searching…' : `${pagination.total} providers`}
            </h2>
            <div className="flex items-center space-x-2">
              <div className="mr-2">
                <button 
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="btn btn-outline btn-sm flex items-center"
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
                  Filters
                </button>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => setViewMode('list')} className={`icon-btn ${viewMode === 'list' ? 'active' : ''}`}>
                  <ListBulletIcon className="h-5 w-5" />
                </button>
                <button onClick={() => setViewMode('map')} className={`icon-btn ${viewMode === 'map' ? 'active' : ''}`}>
                  <MapIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {filtersOpen && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="specialty" className="text-sm font-medium text-gray-700 block mb-1">Specialty</label>
                <select
                  id="specialty"
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  className="form-select"
                >
                  <option value="">All Specialties</option>
                  {specialties.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sort" className="text-sm font-medium text-gray-700 block mb-1">Sort By</label>
                <select
                  id="sort"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="form-select"
                >
                  <option value="distance_asc">Distance (Nearest)</option>
                  <option value="rating_desc">Rating (Highest)</option>
                  <option value="procedure_count_desc">Most Procedures</option>
                  <option value="name_asc">Name (A-Z)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={() => {
                    pushParams({ 
                      query: searchQuery, 
                      location, 
                      distance, 
                      specialty, 
                      sort 
                    });
                  }}
                  className="btn btn-primary w-full"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <div className="alert alert-error mb-4">{error}</div>}
        {loading && <div className="loading-spinner"><div className="spinner spinner-md" /></div>}
        {!loading && !error && providers.length === 0 && (
          <div className="text-center text-gray-600">No providers found. Try adjusting your search criteria.</div>
        )}

        {!loading && !error && providers.length > 0 && viewMode === 'list' && (
          <div className="space-y-4">
            {providers.map(provider => (
              <div key={provider.id} className="card p-4 hover:shadow-md transition duration-200">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-24 md:h-24 flex-shrink-0 mb-3 md:mb-0 md:mr-4">
                    {provider.logoUrl ? (
                      <img 
                        src={provider.logoUrl} 
                        alt={provider.name} 
                        className="w-full h-full object-contain rounded-md"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex flex-col md:flex-row md:justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">
                          <Link href={`/providers/${provider.id}`} className="hover:underline">{provider.name}</Link>
                        </h3>
                        {formatRating(provider.rating, provider.reviewCount)}
                        {provider.specialties && provider.specialties.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {provider.specialties.slice(0, 3).map(spec => (
                              <span key={spec} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                {spec}
                              </span>
                            ))}
                            {provider.specialties.length > 3 && (
                              <span className="text-xs text-gray-500">+{provider.specialties.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 md:mt-0 text-right">
                        {provider.distance !== undefined && (
                          <span className="text-sm text-gray-600">{formatMiles(provider.distance)}</span>
                        )}
                        {provider.procedureCount && (
                          <div className="text-sm text-gray-600">{provider.procedureCount} procedures</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                      <span>
                        {provider.location.address1 ? 
                          `${provider.location.address1}, ` : 
                          ''}
                        {provider.location.city}, {provider.location.state}
                        {provider.location.zipCode ? ` ${provider.location.zipCode}` : ''}
                      </span>
                    </div>
                    {provider.description && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">{provider.description}</p>
                    )}
                    <div className="mt-3 flex space-x-2">
                      <Link 
                        href={`/providers/${provider.id}`}
                        className="btn btn-sm btn-outline"
                      >
                        View Details
                      </Link>
                      {provider.website && (
                        <a 
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && providers.length > 0 && viewMode === 'map' && (
          <div className="card" style={{ height: '70vh' }}>
            <ProcedureMap
              results={providers.map(p => ({
                id: p.id,
                provider: {
                  id: p.id,
                  name: p.name
                },
                location: {
                  id: p.location.id || 'unknown',
                  city: p.location.city,
                  state: p.location.state,
                  latitude: p.location.latitude,
                  longitude: p.location.longitude
                }
              }))}
              center={mapCenter ?? undefined}
              selectedMarker={selectedProvider ? {
                id: selectedProvider.id,
                provider: {
                  id: selectedProvider.id,
                  name: selectedProvider.name
                },
                location: {
                  id: selectedProvider.location.id || 'unknown',
                  city: selectedProvider.location.city,
                  state: selectedProvider.location.state,
                  latitude: selectedProvider.location.latitude,
                  longitude: selectedProvider.location.longitude
                }
              } : undefined}
              onMarkerClick={(result) => {
                if (result) {
                  const provider = providers.find(p => p.id === result.id);
                  if (provider) {
                    setSelectedProvider(provider);
                  }
                } else {
                  setSelectedProvider(null);
                }
              }}
            />
          </div>
        )}

        {!loading && !error && pagination.pages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-4">
            <button 
              onClick={() => handlePageChange(pagination.page - 1)} 
              disabled={pagination.page === 1} 
              className="icon-btn"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</span>
            <button 
              onClick={() => handlePageChange(pagination.page + 1)} 
              disabled={pagination.page === pagination.pages} 
              className="icon-btn"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
