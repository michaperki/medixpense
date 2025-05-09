// apps/web/src/components/providers/LocationsList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapPinIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import apiClient from '../../lib/apiClient';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorAlert } from '../ui/ErrorAlert';
import { useToast } from '../../hooks/useToast';

// Define Location interface
interface Location {
  id: string;
  name: string;
  address1: string;
  city: string;
  state: string;
  zipCode: string;
  isActive: boolean;
}

// Component props interface
interface LocationsListProps {
  className?: string;
}

export default function LocationsList({ className = '' }: LocationsListProps) {
  const { token } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        // Use apiClient instead of direct axios call
        const response = await apiClient.get<{ locations: Location[] }>('/api/locations');
        setLocations(response.locations);
        setError(null);
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('Failed to load locations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [token]);

  const handleDeleteLocation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this location? This will also remove all procedure prices for this location.')) {
      return;
    }

    try {
      // Use apiClient instead of direct axios call
      await apiClient.delete(`/api/locations/${id}`);
      
      // Remove location from state
      setLocations(locations.filter(location => location.id !== id));
      
      // Show success toast
      showToast({
        type: 'success',
        message: 'Location deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting location:', err);
      setError('Failed to delete location. Please try again.');
      
      // Show error toast
      showToast({
        type: 'error',
        message: 'Failed to delete location'
      });
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Your Locations</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage the locations where you offer healthcare services
          </p>
        </div>
        <Link
          to="/provider/locations/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Location
        </Link>
      </div>
      
      {error && <ErrorAlert message={error} />}
      
      {locations.length === 0 ? (
        <div className="text-center py-12">
          <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No locations</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first location.
          </p>
          <div className="mt-6">
            <Link
              to="/provider/locations/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Location
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {locations.map((location) => (
            <li key={location.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPinIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-blue-600">{location.name}</div>
                      <div className="text-sm text-gray-500">
                        {location.address1}, {location.city}, {location.state} {location.zipCode}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/provider/locations/${location.id}/procedures`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Procedures
                    </Link>
                    <Link
                      to={`/provider/locations/${location.id}/edit`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      location.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
