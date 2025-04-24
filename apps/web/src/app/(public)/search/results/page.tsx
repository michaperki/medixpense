// src/app/(public)/search/results/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
      <div className="loading-spinner">
        <div className="spinner spinner-md"></div>
      </div>
    </div>
  ),
});

export default function SearchResultsPage() {
  // All your state and handlers stay the same
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

  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page, limit: 10, total: 0, pages: 0 });
  const [selectedDistance, setSelectedDistance] = useState(distanceRadius);
  const [selectedSort, setSelectedSort] = useState(sort);
  const [priceRangeMin, setPriceRangeMin] = useState(priceMin);
  const [priceRangeMax, setPriceRangeMax] = useState(priceMax);
  const [procedureName, setProcedureName] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);

  // Keep all your useEffect hooks and handlers the same
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

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/search/results?${params.toString()}`);
    window.scrollTo(0, 0);
  };

  const calculateSavings = (price) => (stats ? stats.average - price : null);
  const formatDistance = (d) => d === undefined ? 'Unknown' : d < 0.1 ? '<0.1 miles' : d < 10 ? d.toFixed(1) + ' miles' : Math.round(d) + ' miles';

  const distanceOptions = [
    { value: '5', label: '5 miles' },
    { value: '10', label: '10 miles' },
    { value: '25', label: '25 miles' },
    { value: '50', label: '50 miles' },
    { value: '100', label: '100 miles' }
  ];
  
  const sortOptions = [
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'distance_asc', label: 'Distance: Nearest' },
    { value: 'name_asc', label: 'Name: A–Z' },
    { value: 'name_desc', label: 'Name: Z–A' }
  ];

  // Define text color styles to be used consistently
  const textPrimaryStyle = { color: 'var(--color-gray-800)' };
  const textSecondaryStyle = { color: 'var(--color-gray-600)' };
  const textTertiaryStyle = { color: 'var(--color-gray-500)' };
  const textWhiteStyle = { color: 'var(--color-white)' };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-primary">
        <div className="container py-6">
          <div className="flex justify-between items-center">
            <h1 className="page-title" style={textWhiteStyle}>{procedureName}</h1>
            {location && <p style={{ color: 'var(--color-primary-100)' }}>{" Near " + location}</p>}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="container py-6">
        <div className="two-col-layout">
          {/* Filters */}
          <div className={`two-col-sidebar ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-6 space-y-6">
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h2 className="section-title mb-0" style={textPrimaryStyle}>Filters</h2>
                  <button onClick={() => setShowFilters(false)} className="lg:hidden icon-btn">
                    <span className="sr-only">Close</span>
                    <ChevronRightIcon className="h-5 w-5" style={textSecondaryStyle} />
                  </button>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label" style={textSecondaryStyle}>Distance</label>
                    <select 
                      value={selectedDistance} 
                      onChange={e => setSelectedDistance(e.target.value)} 
                      className="form-select"
                      style={textPrimaryStyle}
                    >
                      {distanceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={textSecondaryStyle}>Price Range</label>
                    <div className="form-row">
                      <div className="form-col">
                        <div className="form-control-icon">
                          <div className="form-control-icon-start" style={textTertiaryStyle}>$</div>
                          <input 
                            type="number" 
                            value={priceRangeMin} 
                            onChange={e => setPriceRangeMin(e.target.value)} 
                            placeholder="Min" 
                            className="form-input" 
                            style={textPrimaryStyle}
                          />
                        </div>
                      </div>
                      <div className="form-col">
                        <div className="form-control-icon">
                          <div className="form-control-icon-start" style={textTertiaryStyle}>$</div>
                          <input 
                            type="number" 
                            value={priceRangeMax} 
                            onChange={e => setPriceRangeMax(e.target.value)} 
                            placeholder="Max" 
                            className="form-input" 
                            style={textPrimaryStyle}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={textSecondaryStyle}>Sort By</label>
                    <select 
                      value={selectedSort} 
                      onChange={e => setSelectedSort(e.target.value)} 
                      className="form-select"
                      style={textPrimaryStyle}
                    >
                      {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <button onClick={handleApplyFilters} className="btn btn-primary w-full">Apply</button>
                </div>
              </div>
              
              {stats && (
                <div className="price-info-box">
                  <h2 style={{ ...textPrimaryStyle, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-3)' }}>
                    Price Info
                  </h2>
                  <div className="space-y-2">
                    <div className="price-info-row">
                      <span style={textTertiaryStyle}>Average</span>
                      <span style={textPrimaryStyle}>${stats.average.toFixed(2)}</span>
                    </div>
                    <div className="price-info-row">
                      <span style={textTertiaryStyle}>Low</span>
                      <span style={textPrimaryStyle}>${stats.min.toFixed(2)}</span>
                    </div>
                    <div className="price-info-row">
                      <span style={textTertiaryStyle}>High</span>
                      <span style={textPrimaryStyle}>${stats.max.toFixed(2)}</span>
                    </div>
                    <div className="price-info-row">
                      <span style={textTertiaryStyle}>Median</span>
                      <span style={textPrimaryStyle}>${stats.median.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="two-col-main">
            {/* Mobile Header */}
            <div className="lg:hidden flex justify-between mb-4">
              <button onClick={() => setShowFilters(true)} className="icon-btn">
                <AdjustmentsHorizontalIcon className="h-5 w-5" style={textSecondaryStyle} />
              </button>
              <div className="view-mode-toggle">
                <button 
                  onClick={() => setViewMode('list')} 
                  className={viewMode === 'list' ? 'active' : ''}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setViewMode('map')} 
                  className={viewMode === 'map' ? 'active' : ''}
                >
                  <MapIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex justify-between items-center mb-4">
              <h2 className="section-title mb-0" style={textPrimaryStyle}>
                {loading ? 'Searching...' : error ? 'Error' : `${pagination.total} results`}
              </h2>
              <div className="view-mode-toggle">
                <button 
                  onClick={() => setViewMode('list')} 
                  className={viewMode === 'list' ? 'active' : ''}
                >
                  <ListBulletIcon className="h-5 w-5 mr-1" />List
                </button>
                <button 
                  onClick={() => setViewMode('map')} 
                  className={viewMode === 'map' ? 'active' : ''}
                >
                  <MapIcon className="h-5 w-5 mr-1" />Map
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <div className="alert-message">{error}</div>
              </div>
            )}
            
            {loading && (
              <div className="loading-spinner">
                <div className="spinner spinner-md"></div>
              </div>
            )}
            
            {!loading && !error && results.length === 0 && (
              <div className="empty-state">
                <MapPinIcon className="empty-state-icon" />
                <h3 className="empty-state-title" style={textPrimaryStyle}>No results found.</h3>
                <p className="empty-state-message" style={textSecondaryStyle}>Try adjusting your search criteria or filters.</p>
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              viewMode === 'list' ? (
                <div className="content-block">
                  {results.map(r => (
                    <div key={r.id} className="results-card">
                      <div className="p-6 flex flex-col md:flex-row md:justify-between md:items-start">
                        <div>
                          <h3 className="text-lg font-semibold" style={textPrimaryStyle}>{r.procedure.name}</h3>
                          <p style={textSecondaryStyle} className="truncate max-w-md">{r.procedure.description}</p>
                          <div className="mt-2 flex space-x-2">
                            <span className="result-category-tag">{r.procedure.category.name}</span>
                            {r.distance && <span className="result-distance-tag">{formatDistance(r.distance)}</span>}
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex flex-col items-end">
                          <div className="result-price" style={textPrimaryStyle}>${r.price.toFixed(2)}</div>
                          {calculateSavings(r.price) && calculateSavings(r.price) > 0 && (
                            <div className="result-savings">Save ${calculateSavings(r.price).toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                      <div className="card-footer flex justify-between items-center">
                        <div>
                          <p className="font-medium" style={textPrimaryStyle}>{r.location.provider.name}</p>
                          <p className="text-sm" style={textTertiaryStyle}>{r.location.address}, {r.location.city}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Link href={`/locations/${r.location.id}`} className="btn btn-secondary btn-sm">Details</Link>
                          <button onClick={() => {setSelectedResult(r); setViewMode('map');}} className="btn btn-primary btn-sm">Map</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pagination.pages > 1 && (
                    <div className="pagination">
                      <button 
                        onClick={() => handlePageChange(pagination.page - 1)} 
                        disabled={pagination.page === 1} 
                        className="pagination-button"
                        style={{ color: '#4b5563' }} // Force text color for the button text
                      >
                        <ChevronLeftIcon className="h-4 w-4 mr-1" />
                        Previous
                      </button>
                      <span style={{ color: '#4b5563' }}>
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <button 
                        onClick={() => handlePageChange(pagination.page + 1)} 
                        disabled={pagination.page === pagination.pages} 
                        className="pagination-button"
                        style={{ color: '#4b5563' }} // Force text color for the button text
                      >
                        Next
                        <ChevronRightIcon className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card" style={{ height: "calc(100vh - 220px)" }}>
                  <ProcedureMap 
                    results={results} 
                    center={mapCenter || undefined} 
                    onMarkerClick={setSelectedResult} 
                    selectedMarker={selectedResult} 
                  />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
