// src/app/provider/locations/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { locationsApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

// Icons
import { MapPinIcon, BuildingOfficeIcon, PhoneIcon } from '@heroicons/react/24/outline';

// Define type for the location form data
type LocationFormData = {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  description: string;
};

// Initial form state
const initialFormData: LocationFormData = {
  name: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
  website: '',
  description: '',
};

export default function LocationFormPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  
  // Get location ID from params (undefined for new locations)
  const locationId = params.slug !== 'new' ? params.slug as string : undefined;
  const isEditMode = !!locationId;
  
  // Form state
  const [formData, setFormData] = useState<LocationFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<LocationFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  
  // Fetch location data if in edit mode
  useEffect(() => {
    const fetchLocation = async () => {
      if (locationId) {
        try {
          setIsLoading(true);
          const response = await locationsApi.getById(locationId);
          const location = response.data.location;
          
          // Update form data with location info
          setFormData({
            name: location.name || '',
            address1: location.address1 || '',
            address2: location.address2 || '',
            city: location.city || '',
            state: location.state || '',
            zipCode: location.zipCode || '',
            phone: location.phone || '',
            email: location.email || '',
            website: location.website || '',
            description: location.description || '',
          });
        } catch (error) {
          console.error('Error fetching location:', error);
          showToast('Error loading location data', 'error');
          router.push('/provider/locations');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchLocation();
  }, [locationId, router, showToast]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is modified
    if (errors[name as keyof LocationFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<LocationFormData> = {};
    
    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.address1.trim()) newErrors.address1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    
    // ZIP code format
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (formData.zipCode && !zipRegex.test(formData.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format';
    }
    
    // Phone format (if provided)
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    // Email format (if provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Website format (if provided)
    const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;
    if (formData.website && !urlRegex.test(formData.website)) {
      newErrors.website = 'Invalid website URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call geocoding API to get coordinates (mock implementation)
      const geocodedData = await geocodeAddress(
        formData.address1,
        formData.address2,
        formData.city,
        formData.state,
        formData.zipCode
      );
      
      // Prepare data for API
      const locationData = {
        ...formData,
        latitude: geocodedData.latitude,
        longitude: geocodedData.longitude,
      };
      
      // Create or update location
      if (isEditMode && locationId) {
        await locationsApi.update(locationId, locationData);
        showToast('Location updated successfully', 'success');
      } else {
        await locationsApi.create(locationData);
        showToast('Location created successfully', 'success');
      }
      
      // Navigate back to locations list
      router.push('/provider/locations');
    } catch (error) {
      console.error('Error saving location:', error);
      showToast('Error saving location', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Mock function for geocoding (would be replaced with actual API call)
  const geocodeAddress = async (
    address1: string,
    address2: string,
    city: string,
    state: string,
    zipCode: string
  ): Promise<{ latitude: number; longitude: number }> => {
    const address = `${address1} ${address2} ${city} ${state} ${zipCode}`.trim().replace(/\s+/g, '+');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results.length) {
      throw new Error('Failed to geocode address');
    }

    const { lat, lng } = data.results[0].geometry.location;
    return { latitude: lat, longitude: lng };
  };
  
  // List of US states for dropdown
  const usStates = [
    { value: '', label: 'Select State' },
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    // Add all other states here
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
  ];
  
  if (isLoading) {
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
            {isEditMode ? 'Edit Location' : 'Add New Location'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode 
              ? 'Update information for your healthcare location' 
              : 'Create a new healthcare location where you offer procedures'
            }
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Location Name */}
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Location Name *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`pl-10 block w-full rounded-md ${
                      errors.name 
                        ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } sm:text-sm`}
                    placeholder="Main Hospital Campus"
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600" id="name-error">
                    {errors.name}
                  </p>
                )}
              </div>
              
              {/* Address */}
              <div className="sm:col-span-6">
                <label htmlFor="address1" className="block text-sm font-medium text-gray-700">
                  Address Line 1 *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="address1"
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    className={`pl-10 block w-full rounded-md ${
                      errors.address1 
                        ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } sm:text-sm`}
                    placeholder="123 Medical Center Blvd"
                  />
                </div>
                {errors.address1 && (
                  <p className="mt-2 text-sm text-red-600" id="address1-error">
                    {errors.address1}
                  </p>
                )}
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="address2" className="block text-sm font-medium text-gray-700">
                  Address Line 2
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="address2"
                    name="address2"
                    value={formData.address2}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Suite 100"
                  />
                </div>
              </div>
              
              {/* City, State, ZIP */}
              <div className="sm:col-span-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`block w-full rounded-md ${
                      errors.city 
                        ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } sm:text-sm`}
                    placeholder="Healthville"
                  />
                </div>
                {errors.city && (
                  <p className="mt-2 text-sm text-red-600" id="city-error">
                    {errors.city}
                  </p>
                )}
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
                    className={`block w-full rounded-md ${
                      errors.state 
                        ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } sm:text-sm`}
                  >
                    {usStates.map(state => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.state && (
                  <p className="mt-2 text-sm text-red-600" id="state-error">
                    {errors.state}
                  </p>
                )}
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                  ZIP Code *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className={`block w-full rounded-md ${
                      errors.zipCode 
                        ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } sm:text-sm`}
                    placeholder="12345"
                  />
                </div>
                {errors.zipCode && (
                  <p className="mt-2 text-sm text-red-600" id="zipCode-error">
                    {errors.zipCode}
                  </p>
                )}
              </div>
              
              {/* Contact Information */}
              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`pl-10 block w-full rounded-md ${
                      errors.phone 
                        ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } sm:text-sm`}
                    placeholder="(555) 123-4567"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600" id="phone-error">
                    {errors.phone}
                  </p>
                )}
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full rounded-md ${
                      errors.email 
                        ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } sm:text-sm`}
                    placeholder="contact@yourhealthcare.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600" id="email-error">
                    {errors.email}
                  </p>
                )}
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className={`block w-full rounded-md ${
                      errors.website 
                        ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } sm:text-sm`}
                    placeholder="https://www.yourhealthcare.com"
                  />
                </div>
                {errors.website && (
                  <p className="mt-2 text-sm text-red-600" id="website-error">
                    {errors.website}
                  </p>
                )}
              </div>
              
              {/* Description */}
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="A brief description of this healthcare location..."
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              onClick={() => router.push('/provider/locations')}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Location' : 'Create Location'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
