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

  // Fetch location & categories on mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);

        // 1) Location
        const { location } = await locationsApi.getById(locationId);
        setLocation(location);

        // 2) Categories
        const { categories } = await proceduresApi.getCategories();
        setCategories(categories);

        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, [locationId]);

  // Search templates when term or category changes
  useEffect(() => {
    if (!searchTerm && !selectedCategory) {
      setTemplates([]);
      setFilteredTemplates([]);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const params: Record<string, any> = {};
        if (searchTerm) params.query = searchTerm;
        if (selectedCategory) params.categoryId = selectedCategory;

        const { templates } = await proceduresApi.getTemplates(params);
        setTemplates(templates);
        setFilteredTemplates(templates);
      } catch (err) {
        console.error(err);
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
      try {
        setStatsLoading(true);

        const { stats } = await searchApi.getStats(selectedTemplate.id, {
          locationId,
          radius: 50,
        });
        setPriceStats(stats);
        if (stats.average) setPrice(stats.average);
      } catch (err) {
        console.error(err);
        setPriceStats(null);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, [selectedTemplate, locationId]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSelectedCategory(e.target.value);

  const handleSelectTemplate = (tpl: ProcedureTemplate) => {
    setSelectedTemplate(tpl);
    setPriceStats(null);
    setPrice(0);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setPrice(isNaN(v) ? 0 : v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || price <= 0) {
      showToast('Please select a procedure and enter a valid price', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await proceduresApi.addPrice({
        locationId,
        templateId: selectedTemplate.id,
        price,
      });
      showToast('Procedure price added successfully', 'success');
      router.push(`/provider/locations/${locationId}/procedures`);
    } catch (err) {
      console.error(err);
      showToast('Failed to add procedure price', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              onClick={() => router.push(`/provider/locations/${locationId}/procedures`)}
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

