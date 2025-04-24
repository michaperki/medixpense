// src/app/(public)/search/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { searchApi, proceduresApi } from '@/lib/api';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Parse query parameters
  const query = searchParams.get('query') || '';
  const location = searchParams.get('location') || '';
  const categoryId = searchParams.get('category') || '';
  const distance = searchParams.get('distance') || '50';
  const sort = searchParams.get('sort') || 'price_asc';
  const page = parseInt(searchParams.get('page') || '1');
  
  // State for search form
  const [searchTerm, setSearchTerm] = useState(query);
  const [locationTerm, setLocationTerm] = useState(location);
  const [selectedCategory, setSelectedCategory] = useState(categoryId);
  const [selectedDistance, setSelectedDistance] = useState(distance);
  const [selectedSort, setSelectedSort] = useState(sort);
  
  // State for search results
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: page,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  // State for categories
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // State for view mode
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await proceduresApi.getCategories();
        setCategories(response.categories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Search effect when parameters change
  useEffect(() => {
    // Only search if there's at least a search term or location
    if (!(query || location || categoryId)) {
      return;
    }
    
    const performSearch = async () => {
      setLoading(true);
      
      try {
        // Build query parameters
        const params = {
          query: query,
          location: location,
          categoryId: categoryId,
          distance: distance,
          sort: sort,
          page: page.toString(),
          limit: '20'
        };
        
        // Perform search
        const response = await searchApi.searchProcedures(params);
        
        setResults(response.results);
        setPagination(response.pagination);
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
  }, [query, location, categoryId, distance, sort, page]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    
    // Build new URL with search parameters
    const params = new URLSearchParams();
    if (searchTerm) params.set('query', searchTerm);
    if (locationTerm) params.set('location', locationTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedDistance) params.set('distance', selectedDistance);
    if (selectedSort) params.set('sort', selectedSort);
    params.set('page', '1');
    
    // Navigate to search page with new parameters
    router.push(`/search/results?${params.toString()}`)
  };
  
  const handlePageChange = (newPage) => {
    // Build new URL with updated page parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    
    // Navigate to search page with new parameters
    router.push(`/search?${params.toString()}`);
    
    // Scroll to top
    window.scrollTo(0, 0);
  };
  
  return (
    <div className="bg-white">
      {/* Search Form */}
      <div className="bg-primary">
        <div className="container py-6">
          <form onSubmit={handleSearch} className="form-layout">
            <div className="form-row">
              <div className="form-col">
                <label htmlFor="procedureSearch" className="form-label text-white">
                  Procedure
                </label>
                <div className="form-control-icon">
                  <div className="form-control-icon-start">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="procedureSearch"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    placeholder="MRI, X-ray, Physical Therapy, etc."
                    style={{ color: 'var(--color-gray-800)' }}
                  />
                </div>
              </div>
              
              <div className="form-col">
                <label htmlFor="locationSearch" className="form-label text-white">
                  Location
                </label>
                <div className="form-control-icon">
                  <div className="form-control-icon-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="locationSearch"
                    value={locationTerm}
                    onChange={(e) => setLocationTerm(e.target.value)}
                    className="form-input"
                    placeholder="City, State or ZIP"
                    style={{ color: 'var(--color-gray-800)' }}
                  />
                </div>
              </div>
              
              <div className="form-col">
                <label htmlFor="categoryFilter" className="form-label text-white">
                  Category
                </label>
                <select
                  id="categoryFilter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-select"
                  style={{ color: 'var(--color-gray-800)' }}
                >
                  <option value="">All Categories</option>
                  {loadingCategories ? (
                    <option disabled>Loading categories...</option>
                  ) : (
                    categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div className="form-col flex items-end">
                <button
                  type="submit"
                  className="btn"
                  style={{ 
                    backgroundColor: 'var(--color-primary-700)',
                    color: 'var(--color-white)',
                    border: '1px solid var(--color-primary-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Search Results */}
      <div className="container py-8">
        {error && (
          <div className="alert alert-error mb-4">
            <div className="alert-message">{error}</div>
          </div>
        )}
        
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner spinner-md"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="dashboard-container">
            {/* Results count and filter controls */}
            <div className="dashboard-header">
              <div>
                <p className="text-secondary">
                  {pagination.total} results found
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Distance filter */}
                <div className="form-group">
                  <label htmlFor="distanceFilter" className="form-label">
                    Distance
                  </label>
                  <select
                    id="distanceFilter"
                    value={selectedDistance}
                    onChange={(e) => {
                      setSelectedDistance(e.target.value);
                      // Update URL and trigger search
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('distance', e.target.value);
                      params.set('page', '1');
                      router.push(`/search?${params.toString()}`);
                    }}
                    className="form-select"
                    style={{ color: 'var(--color-gray-800)' }}
                  >
                    <option value="10">10 miles</option>
                    <option value="25">25 miles</option>
                    <option value="50">50 miles</option>
                    <option value="100">100 miles</option>
                  </select>
                </div>
                
                {/* Sort options */}
                <div className="form-group">
                  <label htmlFor="sortOptions" className="form-label">
                    Sort by
                  </label>
                  <select
                    id="sortOptions"
                    value={selectedSort}
                    onChange={(e) => {
                      setSelectedSort(e.target.value);
                      // Update URL and trigger search
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('sort', e.target.value);
                      router.push(`/search?${params.toString()}`);
                    }}
                    className="form-select"
                    style={{ color: 'var(--color-gray-800)' }}
                  >
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="distance_asc">Distance: Nearest</option>
                    <option value="rating_desc">Rating: Highest</option>
                  </select>
                </div>
                
                {/* View mode toggle */}
                <div className="view-mode-toggle">
                  <button 
                    type="button"
                    className={viewMode === 'list' ? 'active' : ''}
                    onClick={() => setViewMode('list')}
                  >
                    List
                  </button>
                  <button 
                    type="button"
                    className={viewMode === 'map' ? 'active' : ''}
                    onClick={() => setViewMode('map')}
                  >
                    Map
                  </button>
                </div>
              </div>
            </div>
            
            {/* Result cards */}
            <div className="content-block">
              {results.map((result) => (
                <div key={result.id} className="results-card p-4 mb-4">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary">
                        <Link href={`/procedures/${result.procedure.id}`} className="text-blue hover:underline">
                          {result.procedure.name}
                        </Link>
                      </h3>
                      <div className="mt-1">
                        <span className="result-category-tag">
                          {result.procedure.category.name}
                        </span>
                        {result.distance && (
                          <span className="result-distance-tag ml-2">
                            {result.distance.toFixed(1)} miles away
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-secondary">
                        {result.provider.name} • {result.location.city}, {result.location.state}
                      </p>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex flex-col items-end">
                      <div className="result-price">${result.price.toFixed(2)}</div>
                      {result.savingsPercent > 0 && (
                        <div className="result-savings">
                          Save {result.savingsPercent}% vs. avg. price
                        </div>
                      )}
                      <Link 
                        href={`/procedures/${result.procedure.id}?provider=${result.provider.id}&location=${result.location.id}`}
                        className="btn btn-primary mt-2"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.pages}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-6 text-center">
            <h3 style={{ color: 'var(--color-gray-800)', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-medium)' }} className="mb-2">
              No Procedures Found
            </h3>
            <p style={{ color: 'var(--color-gray-600)' }} className="mb-4">
              Try adjusting your search criteria or browse by category instead.
            </p>
            <div>
              <Link href="/" className="btn btn-primary">
                Return to Homepage
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
