// apps/web/src/components/providers/ProcedureForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CurrencyDollarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import apiClient from '../../lib/apiClient';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorAlert } from '../ui/ErrorAlert';
import { useToast } from '../../hooks/useToast';

// Define types
interface Category {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  category?: Category;
}

interface Location {
  id: string;
  name: string;
  address1: string;
  city: string;
  state: string;
  zipCode: string;
}

interface ProcedureFormData {
  templateId: string;
  price: string;
  comments: string;
  isActive: boolean;
}

interface ValidationErrors {
  [key: string]: string | null;
}

// Component props interface
interface ProcedureFormProps {
  className?: string;
}

export default function ProcedureForm({ className = '' }: ProcedureFormProps) {
  const { locationId, procedureId } = useParams<{ locationId?: string; procedureId?: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();
  const isEditMode = !!procedureId;

  const [location, setLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<ProcedureFormData>({
    templateId: '',
    price: '',
    comments: '',
    isActive: true
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // For template selection
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchingTemplates, setFetchingTemplates] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Initial data loading - location data and procedure data if editing
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!locationId) {
        setError('Location ID is missing');
        return;
      }
      
      try {
        setLoading(true);
        
        // Get location details - use apiClient instead of direct axios
        const locationResponse = await apiClient.get<{ location: Location }>(`/api/locations/${locationId}`);
        setLocation(locationResponse.location);
        
        // If editing, get procedure details
        if (isEditMode && procedureId) {
          const procedureResponse = await apiClient.get<{ procedurePrice: any }>(`/api/procedures/price/${procedureId}`);
          
          const { procedurePrice } = procedureResponse;
          
          setFormData({
            templateId: procedurePrice.templateId,
            price: procedurePrice.price.toString(),
            comments: procedurePrice.comments || '',
            isActive: procedurePrice.isActive
          });
          
          setSelectedTemplate(procedurePrice.template);
        }
        
        // Load categories for filter dropdown
        const categoriesResponse = await apiClient.get<{ categories: Category[] }>('/api/procedures/categories');
        setCategories(categoriesResponse.categories);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load data. Please try again.');
        
        showToast({
          type: 'error',
          message: 'Failed to load initial data'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [locationId, procedureId, token, isEditMode, showToast]);

  // Search for procedure templates when search term or category changes
  useEffect(() => {
    const searchTemplates = async () => {
      if (!searchTerm && !selectedCategory) return;
      
      try {
        setFetchingTemplates(true);
        
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCategory) params.append('categoryId', selectedCategory);
        
        const response = await apiClient.get<{ templates: Template[] }>(`/api/procedures/templates?${params.toString()}`);
        setTemplates(response.templates);
      } catch (err) {
        console.error('Error searching templates:', err);
        // Don't show error toast for search failures, as they're less critical
      } finally {
        setFetchingTemplates(false);
      }
    };
    
    const debounceTimeout = setTimeout(() => {
      searchTemplates();
    }, 300);
    
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, selectedCategory]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      templateId: template.id
    });
    setValidationErrors({
      ...validationErrors,
      templateId: null
    });
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.templateId) errors.templateId = 'Please select a procedure';
    
    const priceValue = parseFloat(formData.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      errors.price = 'Please enter a valid price greater than zero';
    }
    
    if (formData.comments && formData.comments.length > 500) {
      errors.comments = 'Comments must be less than 500 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm() || !locationId) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const dataToSubmit = {
        ...formData,
        locationId,
        price: parseFloat(formData.price)
      };
      
      if (isEditMode && procedureId) {
        await apiClient.put(`/api/procedures/price/${procedureId}`, dataToSubmit);
        
        showToast({
          type: 'success',
          message: 'Procedure price updated successfully'
        });
      } else {
        await apiClient.post('/api/procedures/price', dataToSubmit);
        
        showToast({
          type: 'success',
          message: 'Procedure price added successfully'
        });
      }
      
      // Redirect back to procedures list
      navigate(`/provider/locations/${locationId}/procedures`);
    } catch (err: any) {
      console.error('Error saving procedure:', err);
      if (err.response && err.response.data && err.response.data.errors) {
        // Handle validation errors from server
        const serverErrors: ValidationErrors = {};
        err.response.data.errors.forEach((error: { param: string; msg: string }) => {
          serverErrors[error.param] = error.msg;
        });
        setValidationErrors(serverErrors);
      } else {
        setError('Failed to save procedure. Please try again.');
      }
      
      showToast({
        type: 'error',
        message: 'Failed to save procedure'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-lg ${className}`}>
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {isEditMode ? 'Edit Procedure Price' : 'Add New Procedure Price'}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {isEditMode 
            ? 'Update procedure price information'
            : `Add a new procedure price for ${location?.name}`}
        </p>
        {location && (
          <p className="mt-1 text-sm text-gray-500">
            {location.address1}, {location.city}, {location.state} {location.zipCode}
          </p>
        )}
      </div>
      
      {error && <ErrorAlert message={error} />}
      
      <div className="border-t border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Procedure Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Procedure *
            </label>
            
            {selectedTemplate ? (
              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-lg font-medium text-blue-900">{selectedTemplate.name}</p>
                    <p className="text-sm text-blue-700">
                      Category: {selectedTemplate.category?.name || 'Unknown'}
                    </p>
                    {selectedTemplate.description && (
                      <p className="text-sm text-blue-700 mt-2">{selectedTemplate.description}</p>
                    )}
                  </div>
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(null);
                        setFormData({ ...formData, templateId: '' });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  {/* Category Filter */}
                  <div className="sm:w-1/3">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Category
                    </label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Search Box */}
                  <div className="sm:w-2/3">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                      Search Procedures
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Type to search for procedures..."
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Template Results */}
                <div className="mt-4 border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                  {fetchingTemplates ? (
                    <div className="flex justify-center items-center h-32">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm || selectedCategory 
                        ? 'No procedures match your search' 
                        : 'Enter a search term or select a category'}
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {templates.map(template => (
                        <li 
                          key={template.id}
                          className="p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => selectTemplate(template)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-blue-600">{template.name}</p>
                              <p className="text-sm text-gray-500">
                                Category: {template.category?.name || 'Unknown'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent double selection
                                selectTemplate(template);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Select
                            </button>
                          </div>
                          {template.description && (
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {validationErrors.templateId && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.templateId}</p>
                )}
              </>
            )}
          </div>
          
          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="price"
                id="price"
                value={formData.price}
                onChange={handleChange}
                className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md ${
                  validationErrors.price ? 'border-red-300' : ''
                }`}
                placeholder="0.00"
                aria-describedby="price-currency"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  USD
                </span>
              </div>
            </div>
            {validationErrors.price && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.price}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Enter the cash price for this procedure at this location.
            </p>
          </div>
          
          {/* Comments */}
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
              Comments (Optional)
            </label>
            <div className="mt-1">
              <textarea
                id="comments"
                name="comments"
                rows={3}
                value={formData.comments}
                onChange={handleChange}
                className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                  validationErrors.comments ? 'border-red-300' : ''
                }`}
                placeholder="Any special notes about this procedure price"
              />
            </div>
            {validationErrors.comments && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.comments}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Add any relevant notes about this price (e.g., what's included, preparation requirements, etc.)
            </p>
          </div>
          
          {/* Active Status */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="isActive" className="font-medium text-gray-700">
                Active
              </label>
              <p className="text-gray-500">
                Inactive procedures won't appear in search results
              </p>
            </div>
          </div>
          
          {/* Form Buttons */}
          <div className="pt-5 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(`/provider/locations/${locationId}/procedures`)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
