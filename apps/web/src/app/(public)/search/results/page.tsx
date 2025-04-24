// src/app/(public)/search/results/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { searchApi } from '@/lib/api';
import { 
  MapPinIcon,
  ListBulletIcon,
  MapIcon,
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

const ProcedureMap = dynamic(() => import('@/components/maps/ProcedureMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 h-full w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  ),
});

type SearchResult = {
  id: string;
  price: number;
  procedure: { id: string; name: string; description?: string; category: { id: string; name: string } };
  location: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    provider: { id: string; name: string };
    latitude: number;
    longitude: number;
  };
  distance?: number;
};

type PriceStats = { min: number; max: number; average: number; median: number };

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get('query') || '';
  const location = searchParams.get('location') || '';
  const categoryId = searchParams.get('category') || '';
  const distanceRadius = searchParams.get('distance') || '50';
  const sort = searchParams.get('sort') || 'price_asc';
  const page = parseInt(searchParams.get('page') || '1');
  const priceMin = searchParams.get('price_min') || '';
  const priceMax = searchParams.get('price_max') || '';

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page, limit: 10, total: 0, pages: 0 });

  const [selectedDistance, setSelectedDistance] = useState(distanceRadius);
  const [selectedSort, setSelectedSort] = useState(sort);
  const [priceRangeMin, setPriceRangeMin] = useState(priceMin);
  const [priceRangeMax, setPriceRangeMax] = useState(priceMax);
  const [procedureName, setProcedureName] = useState('');

  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Only attempt to geocode if we have a location string and Google Maps is loaded
    if (window.google && location) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: location }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setMapCenter(results[0].geometry.location.toJSON());
        }
      });
    }
  }, [location]);

  useEffect(() => {
    const performSearch = async () => {
      if (!(query || location || categoryId)) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const params = { query, location, categoryId, distance: distanceRadius, sort, page: page.toString(), limit: '10', price_min: priceMin, price_max: priceMax };
        const response = await searchApi.searchProcedures(params);
        setResults(response.results);
        setPagination(response.pagination);
        setStats(response.stats || null);
        if (response.data?.searchLocation) {
          setMapCenter({ lat: response.data.searchLocation.latitude, lng: response.data.searchLocation.longitude });
        }
        setProcedureName(response.procedureName || query || 'healthcare procedures');
        setError(null);
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred while searching. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [query, location, categoryId, distanceRadius, sort, page, priceMin, priceMax]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('distance', selectedDistance);
    params.set('sort', selectedSort);
    params.set('page', '1');
    priceRangeMin ? params.set('price_min', priceRangeMin) : params.delete('price_min');
    priceRangeMax ? params.set('price_max', priceRangeMax) : params.delete('price_max');
    router.push(`/search/results?${params.toString()}`);
    setShowFilters(false);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/search/results?${params.toString()}`);
    window.scrollTo(0, 0);
  };

  const calculateSavings = (price: number) => (stats ? stats.average - price : null);
  const formatDistance = (d?: number) => d === undefined ? 'Unknown' : d < 0.1 ? '<0.1 miles' : d < 10 ? d.toFixed(1) + ' miles' : Math.round(d) + ' miles';
  const getSortText = (s: string) => ({ price_asc: 'Price: Low to High', price_desc: 'Price: High to Low', distance_asc: 'Distance: Nearest', name_asc: 'Name: A–Z', name_desc: 'Name: Z–A' }[s] || 'Relevance');

  const distanceOptions = [{ value: '5', label: '5 miles' }, { value: '10', label: '10 miles' }, { value: '25', label: '25 miles' }, { value: '50', label: '50 miles' }, { value: '100', label: '100 miles' }];
  const sortOptions = [{ value: 'price_asc', label: 'Price: Low to High' }, { value: 'price_desc', label: 'Price: High to Low' }, { value: 'distance_asc', label: 'Distance: Nearest' }, { value: 'name_asc', label: 'Name: A–Z' }, { value: 'name_desc', label: 'Name: Z–A' }];

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-blue-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-white">
            <h1 className="text-xl font-bold">{procedureName}</h1>
            {location && <p className="text-blue-100 text-sm">Near {location}</p>}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row">

          {/* Filters */}
          <div className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-6 space-y-6">
              <div className="bg-white p-4 shadow rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                  <button onClick={() => setShowFilters(false)} className="lg:hidden text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Close</span>
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Distance</h3>
                  <select value={selectedDistance} onChange={e => setSelectedDistance(e.target.value)} className="block w-full border-gray-300 rounded-md">
                    {distanceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Price Range</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="price-min" className="sr-only">Min</label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">$</span></div>
                        <input type="number" id="price-min" value={priceRangeMin} onChange={e => setPriceRangeMin(e.target.value)} placeholder="Min" className="block w-full pl-7 pr-3 border-gray-300 rounded-md" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="price-max" className="sr-only">Max</label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">$</span></div>
                        <input type="number" id="price-max" value={priceRangeMax} onChange={e => setPriceRangeMax(e.target.value)} placeholder="Max" className="block w-full pl-7 pr-3 border-gray-300 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Sort By</h3>
                  <select value={selectedSort} onChange={e => setSelectedSort(e.target.value)} className="block w-full border-gray-300 rounded-md">
                    {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <button onClick={handleApplyFilters} className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Apply</button>
              </div>
              {stats && (
                <div className="bg-white p-4 shadow rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-3">Price Info</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-sm text-gray-500">Average</span><span className="text-sm font-medium">${stats.average.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-500">Low</span><span className="text-sm font-medium">${stats.min.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-500">High</span><span className="text-sm font-medium">${stats.max.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-500">Median</span><span className="text-sm font-medium">${stats.median.toFixed(2)}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:flex-1 lg:ml-8 mt-6 lg:mt-0">
            {/* Mobile Header */}
            <div className="lg:hidden flex justify-between mb-4">
              <button onClick={() => setShowFilters(true)} className="px-3 py-2 border rounded-md"><AdjustmentsHorizontalIcon className="h-4 w-4" /></button>
              <div className="flex border rounded-md">
                <button onClick={() => setViewMode('list')} className={`${viewMode==='list'? 'bg-blue-600 text-white':'bg-white'} px-3 py-2`}><ListBulletIcon className="h-4 w-4" /></button>
                <button onClick={() => setViewMode('map')} className={`${viewMode==='map'? 'bg-blue-600 text-white':'bg-white'} px-3 py-2`}><MapIcon className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">{loading ? 'Searching...' : error ? 'Error' : `${pagination.total} results`}</h2>
              <div className="flex border rounded-md">
                <button onClick={() => setViewMode('list')} className={`${viewMode==='list'? 'bg-blue-600 text-white':'bg-white'} px-4 py-2`}><ListBulletIcon className="h-4 w-4 mr-1" />List</button>
                <button onClick={() => setViewMode('map')} className={`${viewMode==='map'? 'bg-blue-600 text-white':'bg-white'} px-4 py-2`}><MapIcon className="h-4 w-4 mr-1" />Map</button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
            )}
            {loading && (
              <div className="flex justify-center py-12"><div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full" /></div>
            )}
            {!loading && !error && results.length === 0 && (
              <div className="text-center py-12">
                <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">No results found.</p>
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              viewMode === 'list' ? (
                <div className="space-y-4">
                  {results.map(r => (
                    <div key={r.id} className="bg-white shadow rounded-lg overflow-hidden">
                      <div className="p-6 flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{r.procedure.name}</h3>
                          <p className="text-sm text-gray-500 truncate max-w-md">{r.procedure.description}</p>
                          <div className="mt-2 flex space-x-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">{r.procedure.category.name}</span>
                            {r.distance && <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">{formatDistance(r.distance)}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">${r.price.toFixed(2)}</p>
                          {calculateSavings(r.price) && <p className="text-sm text-green-600">Save ${calculateSavings(r.price)!.toFixed(2)}</p>}
                        </div>
                      </div>
                      <div className="px-6 pb-6 flex justify-between items-center border-t">
                        <div>
                          <p className="text-sm text-gray-900 font-medium">{r.location.provider.name}</p>
                          <p className="text-xs text-gray-500">{r.location.address}, {r.location.city}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Link href={`/locations/${r.location.id}`} className="px-3 py-2 border rounded-md text-sm">Details</Link>
                          <button onClick={() => {setSelectedResult(r); setViewMode('map');}} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">Map</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pagination.pages > 1 && (
                    <div className="flex justify-between items-center">
                      <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 border rounded-md">Previous</button>
                      <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="px-3 py-1 border rounded-md">Next</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[calc(100vh-220px)] rounded-lg overflow-hidden">
                  <ProcedureMap results={results} center={mapCenter || undefined} onMarkerClick={setSelectedResult} selectedMarker={selectedResult} />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
