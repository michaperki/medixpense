// src/app/(public)/search/results/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { searchApi } from '@/lib/api';
import { MapPinIcon, ListBulletIcon, MapIcon, AdjustmentsHorizontalIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const ProcedureMap = dynamic(() => import('@/components/maps/ProcedureMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 h-full w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

type SearchResult = {
  id: string;
  price: number;
  procedure: {
    id: string;
    name: string;
    description?: string;
    category: {
      id: string;
      name: string;
    };
  };
  location: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    provider: {
      id: string;
      name: string;
    };
    latitude: number;
    longitude: number;
  };
  distance?: number;
};

type PriceStats = {
  min: number;
  max: number;
  average: number;
  median: number;
};

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Parse query parameters
  const query = searchParams.get('query') || '';
  const location = searchParams.get('location') || '';
  const procedureId = searchParams.get('procedure') || '';
  const categoryId = searchParams.get('category') || '';
  const distanceRadius = searchParams.get('distance') || '50';
  const sort = searchParams.get('sort') || 'price_asc';
  const page = parseInt(searchParams.get('page') || '1');
  const priceMin = searchParams.get('price_min') || '';
  const priceMax = searchParams.get('price_max') || '';
  
  // View state
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  
  // Search results state
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: page,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // Filter state (for UI)
  const [selectedDistance, setSelectedDistance] = useState(distanceRadius);
  const [selectedSort, setSelectedSort] = useState(sort);
  const [priceRangeMin, setPriceRangeMin] = useState(priceMin);
  const [priceRangeMax, setPriceRangeMax] = useState(priceMax);
  const [procedureName, setProcedureName] = useState('');
  
  // Selected result for map view
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  
  // Center point for map (based on search location)
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number} | null>(null);
  
  // Perform search when parameters change
  useEffect(() => {
    const performSearch = async () => {
      // Only search if there's at least a query, location, procedure, or category
      if (!(query || location || procedureId || categoryId)) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Build query parameters
        const params = {
          query,
          location,
          procedureId,
          categoryId,
          distance: distanceRadius,
          sort,
          page: page.toString(),
          limit: '10',
          price_min: priceMin,
          price_max: priceMax
        };
        
        // Perform search
        const response = await searchApi.searchProcedures(params);
        
        setResults(response.data.results);
        setPagination(response.data.pagination);
        setStats(response.data.stats || null);
        setProcedureName(response.data.procedureName || query || 'healthcare procedures');
        
        // Set map center if location is provided
        if (response.data.searchLocation) {
          setMapCenter({
            lat: response.data.searchLocation.latitude,
            lng: response.data.searchLocation.longitude
          });
        }
        
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
  }, [query, location, procedureId, categoryId, distanceRadius, sort, page, priceMin, priceMax]);
  
  // Apply filters
  const handleApplyFilters = () => {
    // Build URL with updated parameters
    const params = new URLSearchParams(searchParams.toString());
    
    params.set('distance', selectedDistance);
    params.set('sort', selectedSort);
    params.set('page', '1'); // Reset to page 1 when filters change
    
    if (priceRangeMin) {
      params.set('price_min', priceRangeMin);
    } else {
      params.delete('price_min');
    }
    
    if (priceRangeMax) {
      params.set('price_max', priceRangeMax);
    } else {
      params.delete('price_max');
    }
    
    // Navigate to search page with new parameters
    router.push(`/search/results?${params.toString()}`);
    
    // Hide filters panel on mobile
    setShowFilters(false);
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    // Build URL with updated page parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    
    // Navigate to search page with new page
    router.push(`/search/results?${params.toString()}`);
    
    // Scroll to top
    window.scrollTo(0, 0);
  };
  
  // Handle result selection for map
  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    
    if (viewMode === 'list') {
      setViewMode('map');
    }
  };
  
  // Calculate price savings compared to average
  const calculateSavings = (price: number): number | null => {
    if (!stats || !stats.average) return null;
    return stats.average - price;
  };
  
  // Format distance
  const formatDistance = (distance?: number): string => {
    if (distance === undefined) return 'Distance unknown';
    
    if (distance < 0.1) {
      return '<0.1 miles';
    } else if (distance < 10) {
      return distance.toFixed(1) + ' miles';
    } else {
      return Math.round(distance) + ' miles';
    }
  };
  
  // Get appropriate sort text
  const getSortText = (sortValue: string): string => {
    switch (sortValue) {
      case 'price_asc': return 'Price: Low to High';
      case 'price_desc': return 'Price: High to Low';
      case 'distance_asc': return 'Distance: Nearest First';
      case 'name_asc': return 'Name: A-Z';
      case 'name_desc': return 'Name: Z-A';
      default: return 'Relevance';
    }
  };
  
  // Available distance options
  const distanceOptions = [
    { value: '5', label: '5 miles' },
    { value: '10', label: '10 miles' },
    { value: '25', label: '25 miles' },
    { value: '50', label: '50 miles' },
    { value: '100', label: '100 miles' },
  ];
  
  // Available sort options
  const sortOptions = [
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'distance_asc', label: 'Distance: Nearest First' },
    { value: 'name_asc', label: 'Name: A-Z' },
    { value: 'name_desc', label: 'Name: Z-A' },
  ];
  
  return (
    <div className="bg-white">
      {/* Search Header */}
      <div className="bg-blue-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h1 className="text-xl font-bold">
                {procedureName}
              </h1>
              {location && (
                <p className="text-blue-100 text-sm mt-1">
                  Near {location}
                </p>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
            <Link 
              href="/search"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
            >
              Modify Search
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row">
          {/* Filters Section */}
          <div className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-6 space-y-6">
              <div className="bg-white p-4 shadow rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close filters</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Distance Filter */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Distance</h3>
                  <select
                    value={selectedDistance}
                    onChange={(e) => setSelectedDistance(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {distanceOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Price Range Filter */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Price Range</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="price-min" className="sr-only">Minimum Price</label>
                      <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          name="price-min"
                          id="price-min"
                          value={priceRangeMin}
                          onChange={(e) => setPriceRangeMin(e.target.value)}
                          className="block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md"
                          placeholder="Min"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="price-max" className="sr-only">Maximum Price</label>
                      <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          name="price-max"
                          id="price-max"
                          value={priceRangeMax}
                          onChange={(e) => setPriceRangeMax(e.target.value)}
                          className="block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sort By */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Sort By</h3>
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Apply Button */}
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Apply Filters
                </button>
              </div>
              
              {/* Price Statistics */}
              {stats && (
                <div className="bg-white p-4 shadow rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-3">Price Information</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Average:</span>
                      <span className="text-sm font-medium">${stats.average.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Lowest:</span>
                      <span className="text-sm font-medium">${stats.min.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Highest:</span>
                      <span className="text-sm font-medium">${stats.max.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Median:</span>
                      <span className="text-sm font-medium">${stats.median.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:flex-1 lg:ml-8 mt-6 lg:mt-0">
            {/* Mobile Filters Toggle & View Switcher */}
            <div className="lg:hidden flex justify-between mb-4">
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <AdjustmentsHorizontalIcon className="-ml-0.5 mr-2 h-4 w-4" />
                Filters
              </button>
              
              <div className="flex border border-gray-300 rounded-md">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700'
                  } px-3 py-2 text-sm font-medium rounded-l-md`}
                >
                  <ListBulletIcon className="h-4 w-4" />
                  <span className="sr-only">List View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`${
                    viewMode === 'map' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700'
                  } px-3 py-2 text-sm font-medium rounded-r-md`}
                >
                  <MapIcon className="h-4 w-4" />
                  <span className="sr-only">Map View</span>
                </button>
              </div>
            </div>
            
            {/* Desktop View Switcher */}
            <div className="hidden lg:flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {loading ? 'Searching...' : (
                    error ? 'Search Error' : `${pagination.total} results found`
                  )}
                </h2>
                <p className="text-sm text-gray-500">
                  Sorted by {getSortText(sort)}
                </p>
              </div>
              
              <div className="flex border border-gray-300 rounded-md">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700'
                  } px-4 py-2 text-sm font-medium rounded-l-md flex items-center`}
                >
                  <ListBulletIcon className="h-4 w-4 mr-2" />
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`${
                    viewMode === 'map' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700'
                  } px-4 py-2 text-sm font-medium rounded-r-md flex items-center`}
                >
                  <MapIcon className="h-4 w-4 mr-2" />
                  Map
                </button>
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    <div className="mt-4">
                      <Link
                        href="/search"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                      >
                        Try a new search
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {/* No Results Message */}
            {!loading && !error && results.length === 0 && (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No results found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search criteria or expanding your search area.
                </p>
                <div className="mt-6">
                  <Link
                    href="/search"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Modify Search
                  </Link>
                </div>
              </div>
            )}
            
            {/* View Content */}
            {!loading && !error && results.length > 0 && (
              <div className="h-full">
                {viewMode === 'list' ? (
                  /* List View */
                  <div className="space-y-4">
                    {results.map(result => (
                      <div key={result.id} className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900">
                                {result.procedure.name}
                              </h3>
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {result.procedure.category.name}
                                </span>
                                {result.distance !== undefined && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {formatDistance(result.distance)}
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-sm text-gray-500">
                                {result.procedure.description || 'No description available.'}
                              </p>
                            </div>
                            <div className="mt-4 md:mt-0 md:ml-6 text-right">
                              <p className="text-2xl font-bold text-gray-900">
                                ${result.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </p>
                              {calculateSavings(result.price) && (
                                <p className="mt-1 text-sm text-green-600">
                                  Save ${Math.abs(calculateSavings(result.price) as number).toFixed(2)} from average
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {result.location.provider.name}
                                </h4>
                                <p className="mt-1 text-sm text-gray-500">
                                  {result.location.name}
                                </p>
                                <p className="mt-1 flex items-center text-sm text-gray-500">
                                  <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                  {result.location.address}, {result.location.city}, {result.location.state} {result.location.zipCode}
                                </p>
                              </div>
                              <div className="flex">
                                <Link
                                  href={`/locations/${result.location.id}`}
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  View Details
                                </Link>
                                <button
                                  onClick={() => handleResultSelect(result)}
                                  className="ml-3 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <MapPinIcon className="-ml-0.5 mr-2 h-4 w-4" />
                                  Show on Map
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Pagination */}
                    {pagination.pages > 1 && (
                      <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                            disabled={pagination.page === pagination.pages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                              <span className="font-medium">
                                {Math.min(pagination.page * pagination.limit, pagination.total)}
                              </span>{' '}
                              of <span className="font-medium">{pagination.total}</span> results
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <button
                                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                                disabled={pagination.page === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <span className="sr-only">Previous</span>
                                <ChevronLeftIcon className="h-5 w-5" />
                              </button>
                              
                              {/* Page Numbers */}
                              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                let pageNumber;
                                if (pagination.pages <= 5) {
                                  // If 5 or fewer pages, show all
                                  pageNumber = i + 1;
                                } else if (pagination.page <= 3) {
                                  // If near start, show 1-5
                                  pageNumber = i + 1;
                                } else if (pagination.page >= pagination.pages - 2) {
                                  // If near end, show last 5
                                  pageNumber = pagination.pages - 4 + i;
                                } else {
                                  // Otherwise, show 2 before and 2 after current
                                  pageNumber = pagination.page - 2 + i;
                                }
                                
                                return (
                                  <button
                                    key={pageNumber}
                                    onClick={() => handlePageChange(pageNumber)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                      pagination.page === pageNumber
                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                                  >
                                    {pageNumber}
                                  </button>
                                );
                              })}
                              
                              <button
                                onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                                disabled={pagination.page === pagination.pages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <span className="sr-only">Next</span>
                                <ChevronRightIcon className="h-5 w-5" />
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Map View */
                  <div className="h-[calc(100vh-220px)] bg-gray-100 rounded-lg shadow overflow-hidden">
                    <ProcedureMap 
                      results={results}
                      center={mapCenter || undefined}
                      onMarkerClick={setSelectedResult}
                      selectedMarker={selectedResult}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
