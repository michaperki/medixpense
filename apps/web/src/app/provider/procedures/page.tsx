'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { proceduresApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/app/context/AuthContext';
import { getLogger, LogContext } from '@/lib/logger';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

// Create a procedures-specific logger
const proceduresLogger = getLogger(LogContext.RENDER)

type Procedure = {
  id: string;
  price: number;
  template?: {
    id: string;
    name: string;
    description?: string;
    category?: {
      id: string;
      name: string;
    };
  };
  location?: {
    id: string;
    name: string;
    address1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
};

type SortField = 'name' | 'price' | 'category' | 'location';
type SortDirection = 'asc' | 'desc';

export default function ProceduresPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // State
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [locations, setLocations] = useState<{id: string; name: string}[]>([]);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchProceduresAndFilters = async () => {
      proceduresLogger.info('Fetching provider procedures data');
      
      try {
        setLoading(true);
        
        // Get current user provider ID from auth context
        const providerId = user?.provider?.id;
        
        proceduresLogger.debug('User provider info', { 
          userId: user?.id, 
          providerId: providerId 
        });
        
        if (!providerId) {
          const errorMsg = 'Provider ID not found. Please check your login status.';
          proceduresLogger.warn('Missing provider ID for procedures fetch', {
            userId: user?.id,
            userRole: user?.role
          });
          
          setError(errorMsg);
          setLoading(false);
          return;
        }
        
        // Fetch using the provider ID with performance tracking
        const proceduresResponse = await proceduresLogger.time('Fetch provider procedures', async () => {
          return proceduresApi.getProviderProcedures(providerId);
        });
        
        // Handle both object response {procedures: [...]} and direct array response [...]
        const proceduresData = Array.isArray(proceduresResponse) 
          ? proceduresResponse 
          : (proceduresResponse.procedures || []);
          
        proceduresLogger.debug('Procedures data fetched', { 
          count: proceduresData.length,
          hasLocations: proceduresData.some(p => p.location?.id)
        });
        
        setProcedures(proceduresData);
        
        // No need to fetch specific locations/categories if we have no procedures
        if (proceduresData.length === 0) {
          proceduresLogger.debug('No procedures found for provider', { providerId });
          setLoading(false);
          return;
        }
        
        // Extract unique categories and locations with logging
        proceduresLogger.debug('Extracting categories and locations from procedures');
        
        const uniqueCategories: {id: string, name: string}[] = [];
        const uniqueLocations: {id: string, name: string}[] = [];
        
        // Safely extract categories and locations
        proceduresData.forEach(procedure => {
          // Extract category if it exists
          if (procedure && procedure.template && procedure.template.category) {
            const category = procedure.template.category;
            if (category.id && category.name) {
              // Check if this category is already in our list
              if (!uniqueCategories.some(c => c.id === category.id)) {
                uniqueCategories.push({
                  id: category.id,
                  name: category.name
                });
              }
            }
          }
          
          // Extract location if it exists
          if (procedure && procedure.location) {
            const location = procedure.location;
            if (location.id && location.name) {
              // Check if this location is already in our list
              if (!uniqueLocations.some(l => l.id === location.id)) {
                uniqueLocations.push({
                  id: location.id,
                  name: location.name
                });
              }
            }
          }
        });
        
        proceduresLogger.debug('Extracted filter data', { 
          categoryCount: uniqueCategories.length,
          locationCount: uniqueLocations.length
        });
        
        // Set state with extracted data
        setCategories(uniqueCategories);
        setLocations(uniqueLocations);
        
        setError(null);
      } catch (err) {
        proceduresLogger.error('Failed to fetch procedures data', err);
        setError('Failed to load procedures. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProceduresAndFilters();
  }, [user]);
  
  // Handle sorting
  const handleSort = (field: SortField) => {
    proceduresLogger.debug('Sorting procedures', { 
      currentField: sortField, 
      newField: field, 
      currentDirection: sortDirection 
    });
    
    if (field === sortField) {
      // Toggle direction if clicking the same field
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
      
      proceduresLogger.debug('Changed sort direction', { 
        field, 
        newDirection 
      });
    } else {
      // Default to ascending for new sort field
      setSortField(field);
      setSortDirection('asc');
      
      proceduresLogger.debug('Changed sort field', { 
        oldField: sortField, 
        newField: field 
      });
    }
  };
  
  // Log when filter criteria change
  useEffect(() => {
    if (!loading) {
      proceduresLogger.debug('Filter/sort criteria updated', {
        searchTerm: searchTerm || '(none)',
        category: selectedCategory || '(all)',
        location: selectedLocation || '(all)',
        sortField,
        sortDirection
      });
    }
  }, [searchTerm, selectedCategory, selectedLocation, sortField, sortDirection, loading]);
  
  // Get sorted and filtered procedures with safety checks
  const filteredAndSortedProcedures = procedures
    .filter(procedure => {
      // Filter by search term - check that template and name exist
      const matchesSearch = searchTerm === '' || 
        (procedure.template?.name && 
         procedure.template.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by category - check that template, category and id exist
      const matchesCategory = selectedCategory === '' || 
        (procedure.template?.category?.id && 
         procedure.template.category.id === selectedCategory);
        
      // Filter by location - check that location and id exist
      const matchesLocation = selectedLocation === '' || 
        (procedure.location?.id && 
         procedure.location.id === selectedLocation);
        
      return matchesSearch && matchesCategory && matchesLocation;
    })
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (sortField === 'name') {
        // Safe comparison for name
        const aName = a.template?.name || '';
        const bName = b.template?.name || '';
        return multiplier * aName.localeCompare(bName);
      } else if (sortField === 'price') {
        // Safe comparison for price
        return multiplier * ((a.price || 0) - (b.price || 0));
      } else if (sortField === 'category') {
        // Safe comparison for category
        const aCat = a.template?.category?.name || '';
        const bCat = b.template?.category?.name || '';
        return multiplier * aCat.localeCompare(bCat);
      } else if (sortField === 'location') {
        // Safe comparison for location
        const aLoc = a.location?.name || '';
        const bLoc = b.location?.name || '';
        return multiplier * aLoc.localeCompare(bLoc);
      }
      
      return 0;
    });
  
  // Log any filtering results
  useEffect(() => {
    if (!loading && procedures.length > 0) {
      proceduresLogger.debug('Filtered procedures result', {
        totalProcedures: procedures.length,
        filteredCount: filteredAndSortedProcedures.length,
        isFiltered: filteredAndSortedProcedures.length !== procedures.length
      });
    }
  }, [filteredAndSortedProcedures.length, procedures.length, loading]);
  
  // Handle procedure deletion
  const handleDeleteClick = (procedure: Procedure) => {
    proceduresLogger.debug('Delete procedure dialog opened', { 
      procedureId: procedure.id,
      procedureName: procedure.template?.name,
      locationName: procedure.location?.name
    });
    
    setProcedureToDelete(procedure);
    setDeleteModalOpen(true);
  };
  
  const handleCancelDelete = () => {
    proceduresLogger.debug('Delete procedure canceled', {
      procedureId: procedureToDelete?.id
    });
    
    setProcedureToDelete(null);
    setDeleteModalOpen(false);
  };
  
  const handleConfirmDelete = async () => {
    if (!procedureToDelete) {
      proceduresLogger.warn('Attempted to confirm delete with no procedure selected');
      return;
    }
    
    proceduresLogger.info('Deleting procedure', { 
      id: procedureToDelete.id,
      name: procedureToDelete.template?.name,
      location: procedureToDelete.location?.name
    });
    
    try {
      setIsDeleting(true);
      
      // Track performance of deletion
      await proceduresLogger.time('Delete procedure', async () => {
        await proceduresApi.deletePrice(procedureToDelete.id);
      });
      
      // Update state
      setProcedures(prev => prev.filter(proc => proc.id !== procedureToDelete.id));
      
      proceduresLogger.info('Procedure deleted successfully', {
        id: procedureToDelete.id
      });
      
      // Show success message
      showToast('Procedure deleted successfully', 'success');
      
      // Close modal
      setDeleteModalOpen(false);
      setProcedureToDelete(null);
    } catch (err) {
      proceduresLogger.error('Failed to delete procedure', {
        id: procedureToDelete.id,
        error: err
      });
      
      showToast('Failed to delete procedure', 'error');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Log component rendering state
  useEffect(() => {
    if (!loading) {
      proceduresLogger.debug('Procedures page render state', {
        isLoading: loading,
        hasError: !!error,
        procedureCount: procedures.length,
        filteredCount: filteredAndSortedProcedures.length,
        categoryCount: categories.length,
        locationCount: locations.length
      });
    }
  }, [loading, error, procedures.length, filteredAndSortedProcedures.length, categories.length, locations.length]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            All Procedures
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all procedures across your locations
          </p>
        </div>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4">
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
      
      {/* Search & Filter Controls */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:flex md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="relative max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search procedures"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            {categories.length > 0 && (
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block pl-3 pr-10 py-2 text-base text-gray-700 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
            
            {locations.length > 0 && (
              <select
                id="location-filter"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="block pl-3 pr-10 py-2 text-base text-gray-700 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm bg-white"
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
      
      {/* Procedures Table */}
      {procedures.length === 0 ? (
        <div className="text-center bg-white py-12 px-4 shadow rounded-lg">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No procedures yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding procedures to your locations.
          </p>
          <div className="mt-6">
            {locations.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Select a location to add procedures:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {locations.slice(0, 3).map(location => (
                    <Link
                      key={location.id}
                      href={`/provider/locations/${location.id}/add-procedure`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Add to {location.name}
                    </Link>
                  ))}
                  {locations.length > 3 && (
                    <Link
                      href="/provider/locations"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <MapPinIcon className="-ml-1 mr-2 h-5 w-5" />
                      View All Locations
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">You need to add a location first:</p>
                <Link
                  href="/provider/locations/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <BuildingOfficeIcon className="-ml-1 mr-2 h-5 w-5" />
                  Add Location
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          <span>Procedure Name</span>
                          {sortField === 'name' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUpIcon className="ml-1 w-4 h-4" />
                            ) : (
                              <ArrowDownIcon className="ml-1 w-4 h-4" />
                            )
                          ) : (
                            <ArrowsUpDownIcon className="ml-1 w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('category')}
                      >
                        <div className="flex items-center">
                          <span>Category</span>
                          {sortField === 'category' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUpIcon className="ml-1 w-4 h-4" />
                            ) : (
                              <ArrowDownIcon className="ml-1 w-4 h-4" />
                            )
                          ) : (
                            <ArrowsUpDownIcon className="ml-1 w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('location')}
                      >
                        <div className="flex items-center">
                          <span>Location</span>
                          {sortField === 'location' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUpIcon className="ml-1 w-4 h-4" />
                            ) : (
                              <ArrowDownIcon className="ml-1 w-4 h-4" />
                            )
                          ) : (
                            <ArrowsUpDownIcon className="ml-1 w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center justify-end">
                          <span>Price</span>
                          {sortField === 'price' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUpIcon className="ml-1 w-4 h-4" />
                            ) : (
                              <ArrowDownIcon className="ml-1 w-4 h-4" />
                            )
                          ) : (
                            <ArrowsUpDownIcon className="ml-1 w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedProcedures.map((procedure) => (
                      <tr key={procedure.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {procedure.template?.name || 'Unknown Procedure'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {procedure.template?.category?.name ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {procedure.template.category.name}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">Uncategorized</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {procedure.location?.name || 'Unknown Location'}
                          </div>
                          {procedure.location?.city && procedure.location?.state && (
                            <div className="text-xs text-gray-500">
                              {procedure.location.city}, {procedure.location.state}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          ${procedure.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/provider/procedures/${procedure.id}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <PencilIcon className="h-5 w-5" />
                              <span className="sr-only">Edit</span>
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(procedure)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-5 w-5" />
                              <span className="sr-only">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && procedureToDelete && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Procedure
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete {procedureToDelete.template?.name || 'this procedure'} 
                        {procedureToDelete.location?.name ? ` at ${procedureToDelete.location.name}` : ''}? 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isDeleting ? (
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
