// apps/web/src/components/providers/LocationForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { states } from '../../utils/states';
import apiClient from '../../lib/apiClient';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorAlert } from '../ui/ErrorAlert';
import { useToast } from '../../hooks/useToast';

// Define types for the form data
interface LocationFormData {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isActive: boolean;
}

// Define validation error interface
interface ValidationErrors {
  [key: string]: string | null;
}

// Props interface
interface LocationFormProps {
  className?: string;
}

export default function LocationForm({ className = '' }: LocationFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    isActive: true
  });
  
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (isEditMode) {
      const fetchLocation = async () => {
        try {
          setLoading(true);
          // Use apiClient instead of direct axios call
          const response = await apiClient.get<{ location: any }>(`/api/locations/${id}`);
          
          const { location } = response;
          setFormData({
            name: location.name,
            address1: location.address1,
            address2: location.address2 || '',
            city: location.city,
            state: location.state,
            zipCode: location.zipCode,
            phone: location.phone || '',
            isActive: location.isActive
          });
          setError(null);
        } catch (err) {
          console.error('Error fetching location:', err);
          setError('Failed to load location details. Please try again.');
          
          // Show error toast
          showToast({
            type: 'error',
            message: 'Failed to load location details'
          });
        } finally {
          setLoading(false);
        }
      };

      fetchLocation();
    }
  }, [id, token, isEditMode, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.name.trim()) errors.name = 'Location name is required';
    if (!formData.address1.trim()) errors.address1 = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state) errors.state = 'State is required';
    
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(formData.zipCode)) errors.zipCode = 'Please enter a valid ZIP code (12345 or 12345-6789)';
    
    if (formData.phone) {
      const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      if (!phoneRegex.test(formData.phone)) errors.phone = 'Please enter a valid phone number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (isEditMode) {
        // Use apiClient instead of direct axios call
        await apiClient.put(`/api/locations/${id}`, formData);
        
        showToast({
          type: 'success',
          message: 'Location updated successfully'
        });
      } else {
        // Use apiClient instead of direct axios call
        await apiClient.post('/api/locations', formData);
        
        showToast({
          type: 'success',
          message: 'Location created successfully'
        });
      }
      
      // Redirect back to locations list
      navigate('/provider/locations');
    } catch (err: any) {
      console.error('Error saving location:', err);
      if (err.response && err.response.data && err.response.data.errors) {
        // Handle validation errors from server
        const serverErrors: ValidationErrors = {};
        err.response.data.errors.forEach((error: { param: string; msg: string }) => {
          serverErrors[error.param] = error.msg;
        });
        setValidationErrors(serverErrors);
      } else {
        setError('Failed to save location. Please try again.');
      }
      
      showToast({
        type: 'error',
        message: 'Failed to save location'
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
          {isEditMode ? 'Edit Location' : 'Add New Location'}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {isEditMode 
            ? 'Update your location details'
            : 'Add a new location where you provide healthcare services'}
        </p>
      </div>
      
      {error && <ErrorAlert message={error} />}
      
      <div className="border-t border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Location Name *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    validationErrors.name ? 'border-red-300' : ''
                  }`}
                  placeholder="Main Office, North Clinic, etc."
                />
                {validationErrors.name && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="address1" className="block text-sm font-medium text-gray-700">
                Address Line 1 *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="address1"
                  id="address1"
                  value={formData.address1}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    validationErrors.address1 ? 'border-red-300' : ''
                  }`}
                  placeholder="Street address"
                />
                {validationErrors.address1 && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.address1}</p>
                )}
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="address2" className="block text-sm font-medium text-gray-700">
                Address Line 2
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="address2"
                  id="address2"
                  value={formData.address2}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="city"
                  id="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    validationErrors.city ? 'border-red-300' : ''
                  }`}
                />
                {validationErrors.city && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.city}</p>
                )}
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State *
              </label>
              <div className="mt-1">
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    validationErrors.state ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Select a state</option>
                  {states.map(state => (
                    <option key={state.abbreviation} value={state.abbreviation}>
                      {state.name}
                    </option>
                  ))}
                </select>
                {validationErrors.state && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.state}</p>
                )}
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                ZIP Code *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="zipCode"
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    validationErrors.zipCode ? 'border-red-300' : ''
                  }`}
                  placeholder="12345"
                />
                {validationErrors.zipCode && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.zipCode}</p>
                )}
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    validationErrors.phone ? 'border-red-300' : ''
                  }`}
                  placeholder="(123) 456-7890"
                />
                {validationErrors.phone && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.phone}</p>
                )}
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <div className="flex items-start mt-6">
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
                    Inactive locations and their procedures won't appear in search results
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-5 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/provider/locations')}
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
