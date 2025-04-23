// src/app/provider/locations/[locationId]/add-procedure/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { locationsApi, proceduresApi, searchApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { MagnifyingGlassIcon, CheckIcon, ChartBarIcon } from '@heroicons/react/24/outline';

type Location = {
  id: string;
  name: string;
  address1: string;
  city: string;
  state: string;
  zipCode: string;
};

type ProcedureTemplate = {
  id: string;
  name: string;
  description: string;
  category: {
    id: string;
    name: string;
  };
};

type PriceStats = {
  min: number;
  max: number;
  average: number;
  median: number;
};

export default function AddProcedurePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const locationId = params.locationId as string;
  
  // State
  const [location, setLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [templates, setTemplates] = useState<ProcedureTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ProcedureTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProcedureTemplate | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch location data and procedure categories on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch location details
        const locationResponse = await locationsApi.getById(locationId);
        setLocation(locationResponse.data.location);
        
        // Fetch categories
        const categoriesResponse = await proceduresApi.getCategories();
        setCategories(categoriesResponse.data.categories);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [locationId]);
  
  // Fetch procedure templates when search term or category changes
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!searchTerm && !selectedCategory) {
        setTemplates([]);
        setFilteredTemplates([]);
        return;
      }
      
      try {
        setSearchLoading(true);
        
        const params: any = {};
        if (searchTerm) params.query = searchTerm;
        if (selectedCategory) params.categoryId = selectedCategory;
        
        const response = await proceduresApi.getTemplates(params);
        setTemplates(response.data.templates);
        setFilteredTemplates(response.data.templates);
        
      } catch (err) {
        console.error('Error searching for procedures:', err);
      } finally {
        setSearchLoading(false);
      }
    };
    
    // Debounce search
    const handler = setTimeout(() => {
      fetchTemplates();
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, selectedCategory]);
  
  // Fetch price statistics when a template is selected
  useEffect(() => {
    const fetchPriceStats = async () => {
      if (!selectedTemplate) return;
      
      try {
        setStatsLoading(true);
        
        // In a real implementation, you would call an API to get stats for the area
        const response = await searchApi.getStats(selectedTemplate.id, {
          locationId, // To exclude current location from stats
          radius: 50, // Miles
        });
        
        setPriceStats(response.data.stats);
        
        // If we have an average price, suggest it
        if (response.data.stats.average) {
          setPrice(response.data.stats.average);
        }
        
      } catch (err) {
        console.error('Error fetching price statistics:', err);
        // If stats API fails, don't show an error to the user, just don't show stats
        setPriceStats(null);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchPriceStats();
  }, [selectedTemplate, locationId]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };
  
  // Handle template selection
  const handleSelectTemplate = (template: ProcedureTemplate) => {
    setSelectedTemplate(template);
  };
  
  // Handle price change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setPrice(isNaN(value) ? 0 : value);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate || !price) {
      showToast('Please select a procedure and enter a price', 'error');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the procedure price record
      await proceduresApi.addPrice({
        locationId,
        templateId: selectedTemplate.id,
        price,
      });
      
      showToast('Procedure price added successfully', 'success');
      
      // Navigate back to procedures list
      router.push(`/provider/locations/${locationId}/procedures`);
      
    } catch (err) {
      console.error('Error adding procedure price:', err);
      showToast('Failed to add procedure price', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Add Procedure
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {location ? `Add a new procedure to ${location.name}` : 'Add a new procedure to your location'}
          </p>
        </div>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6">
              {/* Step 1: Select a procedure */}
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Step 1: Select a Procedure</h3>
                
                {/* Search and filter controls */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                      Search Procedures
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g. MRI, X-ray, Blood test"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Procedure templates list */}
                <div className="mt-4">
                  {searchLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <>
                      {filteredTemplates.length === 0 ? (
                        <div className="bg-gray-50 py-8 text-center rounded-md">
                          <p className="text-gray-500 text-sm">
                            {searchTerm || selectedCategory 
                              ? 'No procedures match your search. Try different keywords or category.' 
                              : 'Enter search terms or select a category to find procedures.'}
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-hidden border border-gray-200 rounded-md">
                          <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                            {filteredTemplates.map(template => (
                              <li 
                                key={template.id}
                                className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${
                                  selectedTemplate?.id === template.id ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => handleSelectTemplate(template)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {template.name}
                                    </h4>
                                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                                      {template.description || 'No description available'}
                                    </p>
                                    <div className="mt-1">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {template.category.name}
                                      </span>
                                    </div>
                                  </div>
                                  {selectedTemplate?.id === template.id && (
                                    <CheckIcon className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Step 2: Set Price (only visible if a procedure is selected) */}
              {selectedTemplate && (
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Step 2: Set Your Price</h3>
                  
                  <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Your Price ($)
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          name="price"
                          id="price"
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={handlePriceChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    {/* Price Statistics */}
                    <div className="bg-gray-50 rounded-md p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <ChartBarIcon className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            Price Comparison
                          </h4>
                          {statsLoading ? (
                            <div className="flex justify-center items-center h-16">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                          ) : (
                            <>
                              {priceStats ? (
                                <div className="mt-2 text-sm text-gray-500 space-y-1">
                                  <p>Average Price: <span className="font-medium text-gray-900">${priceStats.average.toFixed(2)}</span></p>
                                  <p>Range: <span className="font-medium text-gray-900">${priceStats.min.toFixed(2)} - ${priceStats.max.toFixed(2)}</span></p>
                                  <p>Median: <span className="font-medium text-gray-900">${priceStats.median.toFixed(2)}</span></p>
                                </div>
                              ) : (
                                <p className="mt-2 text-sm text-gray-500">
                                  No price data available for this procedure in your area.
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              onClick={() => router.push(`/provider/locations/${locationId}/procedures`)}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTemplate || price <= 0 || isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Add Procedure'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
