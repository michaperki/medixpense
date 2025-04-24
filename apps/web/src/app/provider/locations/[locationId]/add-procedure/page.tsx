'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { locationsApi, proceduresApi, searchApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { getLogger, LogContext } from '@/lib/logger';
import { MagnifyingGlassIcon, CheckIcon, ChartBarIcon } from '@heroicons/react/24/outline';

// Create a page-specific logger
const addProcedureLogger = getLogger(LogContext.RENDER);

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
  const { locationId } = useParams() as { locationId: string };
  const router = useRouter();
  const { showToast } = useToast();

  // State
  const [location, setLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
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

  // Log page initialization
  useEffect(() => {
    addProcedureLogger.info('Add procedure page initialized', {
      locationId,
      path: window.location.pathname
    });
    
    return () => {
      addProcedureLogger.debug('Add procedure page unmounted');
    };
  }, [locationId]);

  // Fetch location & categories on mount
  useEffect(() => {
    async function fetchInitialData() {
      addProcedureLogger.info('Fetching initial data', { locationId });
      
      try {
        setLoading(true);

        // 1) Location
        const locationResponse = await addProcedureLogger.time('Fetch location details', async () => {
          return locationsApi.getById(locationId);
        });
        
        const locationData = locationResponse.location || locationResponse;
        
        if (!locationData) {
          const errorMsg = 'Location data not found';
          addProcedureLogger.warn('Location data not found', { locationId });
          throw new Error(errorMsg);
        }
        
        addProcedureLogger.debug('Location data fetched', { 
          locationName: locationData.name,
          locationCity: locationData.city,
          locationState: locationData.state
        });
        
        setLocation(locationData);

        // 2) Categories
        const categoriesResponse = await addProcedureLogger.time('Fetch procedure categories', async () => {
          return proceduresApi.getCategories();
        });
        
        const categoriesData = categoriesResponse.categories || [];
        
        addProcedureLogger.debug('Categories fetched', { 
          count: categoriesData.length 
        });
        
        setCategories(categoriesData);
        setError(null);
      } catch (err) {
        addProcedureLogger.error('Failed to fetch initial data', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInitialData();
  }, [locationId]);

  // Search templates when term or category changes
  useEffect(() => {
    addProcedureLogger.debug('Search criteria changed', {
      searchTerm: searchTerm || '(empty)',
      selectedCategory: selectedCategory || '(none)'
    });
    
    if (!searchTerm && !selectedCategory) {
      addProcedureLogger.debug('Clearing templates - no search criteria');
      setTemplates([]);
      setFilteredTemplates([]);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setSearchLoading(true);
        addProcedureLogger.debug('Searching templates', {
          searchTerm,
          categoryId: selectedCategory
        });

        const params: Record<string, any> = {};
        if (searchTerm) params.query = searchTerm;
        if (selectedCategory) params.categoryId = selectedCategory;

        const templatesResponse = await addProcedureLogger.time('Search procedure templates', async () => {
          return proceduresApi.getTemplates(params);
        });
        
        const templatesData = templatesResponse.templates || [];
        
        addProcedureLogger.debug('Template search results', { 
          count: templatesData.length,
          hasResults: templatesData.length > 0
        });
        
        setTemplates(templatesData);
        setFilteredTemplates(templatesData);
      } catch (err) {
        addProcedureLogger.error('Template search failed', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, selectedCategory]);

  // Fetch price stats when template selected
  useEffect(() => {
    if (!selectedTemplate) return;

    async function fetchStats() {
      addProcedureLogger.info('Fetching price stats', { 
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name
      });
      
      try {
        setStatsLoading(true);

        const statsResponse = await addProcedureLogger.time('Fetch price statistics', async () => {
          return searchApi.getStats(selectedTemplate.id, {
            locationId,
            radius: 50,
          });
        });
        
        const statsData = statsResponse.stats;
        
        if (statsData) {
          addProcedureLogger.debug('Price stats received', { 
            min: statsData.min,
            max: statsData.max,
            avg: statsData.average,
            median: statsData.median
          });
          
          setPriceStats(statsData);
          if (statsData.average) {
            addProcedureLogger.debug('Setting default price to average', { 
              price: statsData.average 
            });
            setPrice(statsData.average);
          }
        } else {
          addProcedureLogger.debug('No price stats available');
          setPriceStats(null);
        }
      } catch (err) {
        addProcedureLogger.error('Failed to fetch price stats', err);
        setPriceStats(null);
      } finally {
        setStatsLoading(false);
      }
    }
    
    fetchStats();
  }, [selectedTemplate, locationId]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    addProcedureLogger.debug('Search term changed', { 
      oldTerm: searchTerm, 
      newTerm 
    });
    setSearchTerm(newTerm);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    addProcedureLogger.debug('Category selection changed', { 
      oldCategory: selectedCategory, 
      newCategory 
    });
    setSelectedCategory(newCategory);
  };

  const handleSelectTemplate = (tpl: ProcedureTemplate) => {
    addProcedureLogger.info('Template selected', { 
      templateId: tpl.id,
      templateName: tpl.name,
      categoryName: tpl.category.name
    });
    
    setSelectedTemplate(tpl);
    setPriceStats(null);
    setPrice(0);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    const newPrice = isNaN(v) ? 0 : v;
    
    addProcedureLogger.debug('Price changed', { 
      oldPrice: price, 
      newPrice 
    });
    
    setPrice(newPrice);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate || price <= 0) {
      addProcedureLogger.warn('Invalid form submission attempt', {
        hasTemplate: !!selectedTemplate,
        price
      });
      
      showToast('Please select a procedure and enter a valid price', 'error');
      return;
    }

    addProcedureLogger.info('Submitting procedure price', {
      locationId,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      price
    });
    
    try {
      setIsSubmitting(true);
      
      await addProcedureLogger.time('Add procedure price', async () => {
        return proceduresApi.addPrice({
          locationId,
          templateId: selectedTemplate.id,
          price,
        });
      });
      
      addProcedureLogger.info('Procedure price added successfully', {
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        price
      });
      
      showToast('Procedure price added successfully', 'success');
      
      addProcedureLogger.debug('Navigating to procedures list');
      router.push(`/provider/locations/${locationId}/procedures`);
    } catch (err) {
      addProcedureLogger.error('Failed to add procedure price', err);
      showToast('Failed to add procedure price', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Log component rendering state
  useEffect(() => {
    if (!loading) {
      addProcedureLogger.debug('Add procedure page render state', {
        isLoading: loading,
        hasError: !!error,
        hasLocation: !!location,
        locationName: location?.name,
        categoriesCount: categories.length,
        templatesCount: templates.length,
        filteredCount: filteredTemplates.length,
        hasSelectedTemplate: !!selectedTemplate,
        selectedTemplateName: selectedTemplate?.name,
        hasPriceStats: !!priceStats,
        currentPrice: price
      });
    }
  }, [
    loading, 
    error, 
    location, 
    categories.length,
    templates.length,
    filteredTemplates.length,
    selectedTemplate,
    priceStats,
    price
  ]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Procedure</h1>
          <p className="mt-1 text-sm text-gray-500">
            {location
              ? `Add a new procedure to ${location.name}`
              : 'Add a new procedure to your location'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
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

      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6">
              {/* Step 1 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Step 1: Select a Procedure
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Search */}
                  <div>
                    <label
                      htmlFor="search"
                      className="block text-sm font-medium text-gray-700"
                    >
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
                        className="block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g. MRI, X-ray"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      className="mt-1 block w-full py-2 px-3 border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Templates */}
                <div className="mt-4">
                  {searchLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="bg-gray-50 py-8 text-center rounded-md">
                      <p className="text-gray-500 text-sm">
                        {searchTerm || selectedCategory
                          ? 'No procedures match your search.'
                          : 'Enter search terms or select a category.'}
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto border border-gray-200 rounded-md">
                      {filteredTemplates.map((tpl) => (
                        <li
                          key={tpl.id}
                          className={`px-4 py-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
                            selectedTemplate?.id === tpl.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleSelectTemplate(tpl)}
                        >
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {tpl.name}
                            </h4>
                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                              {tpl.description || 'No description.'}
                            </p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              {tpl.category.name}
                            </span>
                          </div>
                          {selectedTemplate?.id === tpl.id && (
                            <CheckIcon className="h-5 w-5 text-blue-600" />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              {selectedTemplate && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Step 2: Set Your Price
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Price Input */}
                    <div>
                      <label
                        htmlFor="price"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Your Price ($)
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="price"
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={handlePriceChange}
                          className="block w-full pl-7 pr-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-gray-50 rounded-md p-4">
                      <div className="flex items-start">
                        <ChartBarIcon className="h-5 w-5 text-blue-500" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            Price Comparison
                          </h4>
                          {statsLoading ? (
                            <div className="flex justify-center items-center h-16">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500" />
                            </div>
                          ) : priceStats ? (
                            <div className="mt-2 text-sm text-gray-500 space-y-1">
                              <p>
                                Average:{' '}
                                <span className="font-medium text-gray-900">
                                  ${priceStats.average.toFixed(2)}
                                </span>
                              </p>
                              <p>
                                Range:{' '}
                                <span className="font-medium text-gray-900">
                                  ${priceStats.min.toFixed(2)} – $
                                  {priceStats.max.toFixed(2)}
                                </span>
                              </p>
                              <p>
                                Median:{' '}
                                <span className="font-medium text-gray-900">
                                  ${priceStats.median.toFixed(2)}
                                </span>
                              </p>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-gray-500">
                              No local price data available.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              onClick={() => {
                addProcedureLogger.debug('Canceling procedure addition, navigating back to procedures list');
                router.push(`/provider/locations/${locationId}/procedures`);
              }}
              className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTemplate || price <= 0 || isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
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
