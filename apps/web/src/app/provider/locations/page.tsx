'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { useQuery, useMutation, invalidateQueries } from '@/hooks/useQuery';
import { locationService, type Location } from '@/services';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MapPinIcon, 
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function LocationsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  
  // Direct data state to avoid dependency on hook
  const [locations, setLocations] = useState<Location[]>([]);
  const [pagination, setPagination] = useState({ page, limit, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref to prevent effect loops
  const initialLoadRef = useRef(false);
  
  // Fetch data directly to sidestep hook issues
  useEffect(() => {
    // Avoid multiple requests
    if (initialLoadRef.current) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await locationService.getAll({ page, limit });
        
        if (result && result.locations) {
          setLocations(result.locations);
          setPagination(result.pagination || { page, limit, total: 0, pages: 0 });
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        showToast(`Error loading locations: ${(error as Error).message}`, 'error');
      } finally {
        setIsLoading(false);
        initialLoadRef.current = true; // Mark as loaded
      }
    };
    
    fetchData();
  }, []); // Empty dependency array to run once

  // Handle page change - fetch new data when page changes
  const handlePageChange = useCallback((newPage: number) => {
    setIsLoading(true);
    setPage(newPage);
    
    locationService.getAll({ page: newPage, limit })
      .then(result => {
        if (result && result.locations) {
          setLocations(result.locations);
          setPagination(result.pagination || { page: newPage, limit, total: 0, pages: 0 });
        }
      })
      .catch(error => {
        console.error('Error fetching locations:', error);
        showToast(`Error: ${error.message}`, 'error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [limit, showToast]);

  // Delete location
  const handleDeleteLocation = async (id: string) => {
    try {
      setIsLoading(true);
      await locationService.delete(id);
      showToast('Location deleted successfully', 'success');
      
      // Refresh data
      const result = await locationService.getAll({ page, limit });
      if (result && result.locations) {
        setLocations(result.locations);
        setPagination(result.pagination || { page, limit, total: 0, pages: 0 });
      }
      
      setDeleteModalOpen(false);
      setLocationToDelete(null);
    } catch (error) {
      console.error('Error deleting location:', error);
      showToast(`Error: ${(error as Error).message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete click
  const handleDeleteClick = useCallback((location: Location) => {
    setLocationToDelete(location);
    setDeleteModalOpen(true);
  }, []);
  
  // Handle confirm delete
  const handleConfirmDelete = useCallback(() => {
    if (!locationToDelete) return;
    handleDeleteLocation(locationToDelete.id);
  }, [locationToDelete]);
  
  // Handle cancel delete
  const handleCancelDelete = useCallback(() => {
    setLocationToDelete(null);
    setDeleteModalOpen(false);
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your healthcare facility locations
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/provider/locations/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Location
          </Link>
        </div>
      </div>
      
      {isLoading && locations.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center bg-white py-12 px-4 shadow rounded-lg">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No locations yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first healthcare location.
          </p>
          <div className="mt-6">
            <Link 
              href="/provider/locations/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Location
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {locations.map((location) => (
                <li key={location.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="sm:flex sm:justify-between w-full">
                        <div>
                          <h3 className="text-lg font-medium text-blue-600 truncate">
                            {location.name}
                          </h3>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <MapPinIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            <p>
                              {location.address1}, 
                              {location.address2 ? ` ${location.address2},` : ''} 
                              {' '}{location.city}, {location.state} {location.zipCode}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 sm:mt-0 sm:ml-6 flex flex-col sm:items-end">
                          <div className="flex items-center text-sm text-gray-500">
                            <ClipboardDocumentListIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            <p>{location.procedureCount || 0} procedures</p>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            Added on {new Date(location.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 sm:flex sm:justify-end">
                      <div className="flex space-x-3">
                        <Link 
                          href={`/provider/locations/${location.id}/procedures`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <ClipboardDocumentListIcon className="-ml-0.5 mr-2 h-4 w-4" />
                          Manage Procedures
                        </Link>
                        <Link 
                          href={`/provider/locations/edit/${location.id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <PencilIcon className="-ml-0.5 mr-2 h-4 w-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(location)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <TrashIcon className="-ml-0.5 mr-2 h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-md shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1 || isLoading}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages || isLoading}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(page * limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      disabled={page === 1 || isLoading}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNumber;
                      if (pagination.pages <= 5) {
                        // Display all pages if 5 or fewer
                        pageNumber = i + 1;
                      } else if (page <= 3) {
                        // If near start, show first 5 pages
                        pageNumber = i + 1;
                      } else if (page >= pagination.pages - 2) {
                        // If near end, show last 5 pages
                        pageNumber = pagination.pages - 4 + i;
                      } else {
                        // Otherwise show 2 before and 2 after current page
                        pageNumber = page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          disabled={isLoading}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pageNumber
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(Math.min(pagination.pages, page + 1))}
                      disabled={page === pagination.pages || isLoading}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <ArrowRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Location
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete <span className="font-medium">{locationToDelete?.name}</span>? This action cannot be undone and will also delete all procedures associated with this location.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleConfirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
