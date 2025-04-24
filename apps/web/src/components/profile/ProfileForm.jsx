import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';

const ProfileForm = ({ initialData, onSubmit, isLoading }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialData || {
    organizationName: user?.provider?.organizationName || '',
    bio: user?.provider?.bio || '',
    website: user?.provider?.website || '',
    phone: user?.provider?.phone || user?.phone || '',
    address: user?.provider?.address || '',
    city: user?.provider?.city || '',
    state: user?.provider?.state || '',
    zipCode: user?.provider?.zipCode || '',
  });
  
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors = {};
    if (!formData.organizationName) {
      newErrors.organizationName = 'Organization name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
      <div className="space-y-8 divide-y divide-gray-200">
        <div>
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Provider Profile</h3>
            <p className="mt-1 text-sm text-gray-500">
              This information will be displayed publicly so be careful what you share.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="organizationName"
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.organizationName ? 'border-red-300' : ''
                  }`}
                />
                {errors.organizationName && (
                  <p className="mt-2 text-sm text-red-600">{errors.organizationName}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                About
              </label>
              <div className="mt-1">
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Brief description of your organization.
              </p>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="website"
                  id="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Address</h3>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Street address
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="city"
                  id="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State / Province
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="state"
                  id="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                ZIP / Postal code
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="zipCode"
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProfileForm;
