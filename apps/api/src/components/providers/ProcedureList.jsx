// apps/web/src/components/providers/ProcedureList.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowsUpDownIcon, 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';
import apiClient from '../../lib/apiClient';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorAlert } from '../ui/ErrorAlert';
import { useToast } from '../../hooks/useToast';
import { ConfirmationModal } from '../ui/ConfirmationModal';

// Type definitions
interface Category {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  category: Category;
}

interface Procedure {
  id: string;
  templateId: string;
  template: Template;
  price: number;
  comments?: string;
  isActive: boolean;
}

interface Location {
  id: string;
  name: string;
  address1: string;
  city: string;
  state: string;
  zipCode: string;
  procedures: Procedure[];
}

// Component props interface
interface ProcedureListProps {
  className?: string;
}

export default function ProcedureList({ className = '' }: ProcedureListProps) {
  const { locationId } = useParams<{ locationId: string }>();
  const { token } = useAuth();
  const { showToast } = useToast();
  
  const [location, setLocation] = useState<Location | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name'); // 'name' or 'price'
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // 'asc' or 'desc'
  
  // For confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [procedureToDelete, setProcedureToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        setLoading(true);
        
        // Get location details - use apiClient instead of direct axios
        const locationResponse = await apiClient.get<{ location: Location }>(`/api/locations/${locationId}`);
        
        setLocation(locationResponse.location);
        setProcedures(locationResponse.location.procedures || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching location data:', err);
        setError('Failed to load location data. Please try again.');
        
        showToast({
          type: 'error',
          message: 'Failed to load location data'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocationData();
  }, [locationId, token, showToast]);
  
  const confirmDeleteProcedure = (procedureId: string) => {
    setProcedureToDelete(procedureId);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteProcedure = async () => {
    if (!procedureToDelete) return;
    
    try {
      // Use apiClient instead of direct axios
      await apiClient.delete(`/api/procedures/price/${procedureToDelete}`);
      
      // Remove procedure from state
      setProcedures(procedures.filter(proc => proc.id !== procedureToDelete));
      
      showToast({
        type: 'success',
        message: 'Procedure deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting procedure:', err);
      setError('Failed to delete procedure. Please try again.');
      
      showToast({
        type: 'error',
        message: 'Failed to delete procedure'
      });
    } finally {
      setIsDeleteModalOpen(false);
      setProcedureToDelete(null);
    }
  };
  
  const toggleSortOrder = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  const filteredProcedures = procedures
    .filter(proc => 
      proc.template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proc.template.category.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.template.name.localeCompare(b.template.name)
          : b.template.name.localeCompare(a.template.name);
      } else if (sortBy === 'price') {
        return sortOrder === 'asc' 
          ? a.price - b.price
          : b.price - a.price;
      }
      return 0;
    });
  
  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }
  
  if (!location) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Location not found</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>The location you're trying to view could not be found.</p>
            </div>
            <div className="mt-4">
              <Link
                to="/provider/locations"
                className="text-sm font-medium text-red-600 hover:text-red-500"
              >
                Go back to locations
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
      <div className="px-4 py-5 sm:px-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Procedures at {location.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {location.address1}, {location.city}, {location.state} {location.zipCode}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to={`/provider/locations/${locationId}/add-procedure`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Procedure
            </Link>
          </div>
        </div>
      </div>
      
      {error && <ErrorAlert message={error} />}
      
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search procedures..."
            />
          </div>
        </div>
      </div>
      
      {procedures.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No procedures</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first procedure to this location.
          </p>
          <div className="mt-6">
            <Link
              to={`/provider/locations/${locationId}/add-procedure`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Procedure
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortOrder('name')}
                  >
                    <div className="flex items-center">
                      Procedure
                      {sortBy === 'name' && (
                        <ArrowsUpDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortOrder('price')}
                  >
                    <div className="flex items-center">
                      Price
                      {sortBy === 'price' && (
                        <ArrowsUpDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProcedures.map((procedure) => (
                  <tr key={procedure.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{procedure.template.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{procedure.template.category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">${procedure.price.toFixed(2)}</div>
                      {procedure.comments && (
                        <div className="text-xs text-gray-500">{procedure.comments}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        procedure.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {procedure.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/provider/procedures/${procedure.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <PencilIcon className="h-5 w-5 inline" />
                      </Link>
                      <button
                        onClick={() => confirmDeleteProcedure(procedure.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredProcedures.length === 0 && (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No matching procedures</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search term.
              </p>
            </div>
          )}
        </>
      )}
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProcedure}
        title="Delete Procedure"
        message="Are you sure you want to delete this procedure price? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}
