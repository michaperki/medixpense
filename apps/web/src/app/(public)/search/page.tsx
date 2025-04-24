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
        setCategories(response.categories); // ✅ Correct
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
      <div className="bg-blue-600 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="space-y-4 md:flex md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <label htmlFor="procedureSearch" className="block text-sm font-medium text-white mb-1">
                Procedure
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="procedureSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="MRI, X-ray, Physical Therapy, etc."
                />
              </div>
            </div>
            
            <div className="flex-1">
              <label htmlFor="locationSearch" className="block text-sm font-medium text-white mb-1">
                Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="locationSearch"
                  value={locationTerm}
                  onChange={(e) => setLocationTerm(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="City, State or ZIP"
                />
              </div>
            </div>
            
            <div className="flex-1 md:max-w-xs">
              <label htmlFor="categoryFilter" className="block text-sm font-medium text-white mb-1">
                Category
              </label>
              <select
                id="categoryFilter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
            
            <div className="md:self-end md:ml-4">
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Search Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search filters and results would be implemented here */}
        {/* This would be similar to the component we already created */}
      </div>
    </div>
  );
}
