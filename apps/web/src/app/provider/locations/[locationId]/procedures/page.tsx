// src/app/provider/locations/[locationId]/procedures/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { locationsApi, proceduresApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { getLogger, LogContext } from '@/lib/logger';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ClipboardDocumentListIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// Create a location-procedures specific logger
const locationProceduresLogger = getLogger(LogContext.RENDER);

type Procedure = {
  id: string;
  price: number;
  template: {
    id: string;
    name: string;
    description: string;
    category: {
      id: string;
      name: string;
    };
  };
};

type Location = {
  id: string;
  name: string;
  address1: string;
  city: string;
  state: string;
  zipCode: string;
};

type SortField = 'name' | 'price' | 'category';
type SortDirection = 'asc' | 'desc';

export default function ProceduresPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const locationId = params.locationId as string;
  
  // State
  const [location, setLocation] = useState<Location | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [bulkAdjustmentPercent, setBulkAdjustmentPercent] = useState<number>(0);
  
  // Log component initialization
  useEffect(() => {
    locationProceduresLogger.info('Location procedures page initialized', {
      locationId,
      path: window.location.pathname
    });
    
    return () => {
      locationProceduresLogger.debug('Location procedures page unmounted');
    };
  }, [locationId]);
  
  // Fetch data on component mount
  useEffect(() => {
    locationProceduresLogger.debug('Location ID changed, fetching data', { locationId });
    fetchLocationAndProcedures();
  }, [locationId]);
  
  const fetchLocationAndProcedures = async () => {
    locationProceduresLogger.info('Fetching location and procedures data', { locationId });
    
    try {
      setLoading(true);
      
      // Fetch location details with performance tracking
      const locationData = await locationsApi.getById(locationId);
      locationProceduresLogger.debug('Fetched location', { locationData });
      setLocation(locationData);
      
      
      if (!locationData) {
        const errorMsg = 'Location data not found';
        locationProceduresLogger.warn('Location data not found', { locationId });
        throw new Error(errorMsg);
      }
      
      locationProceduresLogger.debug('Location data fetched', { 
        locationName: locationData.name,
        locationCity: locationData.city,
        locationState: locationData.state
      });
      
      setLocation(locationData);
      locationProceduresLogger.debug('Location set in state', { location: locationData });

      // Try to fetch procedures, but don't let it break the page if it fails
      try {
        // Track procedure fetch performance
        locationProceduresLogger.debug('Calling getProviderProcedures()', { locationId });
        const proceduresResponse = await proceduresApi.getProviderProcedures({ locationId });
        
        // Handle different response structures for procedures
        const proceduresData = Array.isArray(proceduresResponse)
          ? proceduresResponse
          : proceduresResponse?.procedures ?? proceduresResponse?.data?.procedures ?? [];

        if (!Array.isArray(proceduresData)) {
          locationProceduresLogger.error('Unexpected response shape for procedures', { proceduresResponse });
          setProcedures([]);
          return;
        }
        
        locationProceduresLogger.debug('Procedures data fetched', {
          count: proceduresData.length,
          hasProcedures: proceduresData.length > 0,
          responseFormat: proceduresResponse?.procedures ? 'direct' : 
                         (proceduresResponse?.data ? 'nested' : 'unknown')
        });
        
        setProcedures(proceduresData);
        
        // Only extract categories if we have procedure data
        if (proceduresData.length > 0) {
          locationProceduresLogger.debug('Extracting unique categories');
          
          const uniqueCategories = [...new Set(
            proceduresData
              .filter(p => p.template && p.template.category)
              .map((p) => p.template.category)
              .map(category => JSON.stringify(category))
          )].map(str => JSON.parse(str));
          
          locationProceduresLogger.debug('Categories extracted', { 
            categoryCount: uniqueCategories.length 
          });
          
          setCategories(uniqueCategories);
        } else {
          locationProceduresLogger.debug('No procedures found for location');
        }
      } catch (procedureErr) {
        locationProceduresLogger.error('Failed to fetch procedures', procedureErr);
        // We don't set the main error state here, as we still want to show the location
        // Just set empty procedures
        setProcedures([]);
      }
      
      setError(null);
    } catch (err) {
      locationProceduresLogger.error('Failed to fetch location data', err);
      setError('Failed to load location data. Please try again later.');
    } finally {
      setLoading(false);
      locationProceduresLogger.debug('Data fetching completed', { 
        hasLocation: !!location,
        procedureCount: procedures.length,
        hasError: !!error
      });
    }
  };
  
  // Handle sorting
  const handleSort = (field: SortField) => {
    locationProceduresLogger.debug('Sorting procedures', { 
      currentField: sortField, 
      newField: field, 
      currentDirection: sortDirection 
    });
    
    if (field === sortField) {
      // Toggle direction if clicking the same field
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
      
      locationProceduresLogger.debug('Changed sort direction', { 
        field, 
        newDirection 
      });
    } else {
      // Default to ascending for new sort field
      setSortField(field);
      setSortDirection('asc');
      
      locationProceduresLogger.debug('Changed sort field', { 
        oldField: sortField, 
        newField: field 
      });
    }
  };
  
  // Log when filter criteria change
  useEffect(() => {
    if (!loading) {
      locationProceduresLogger.debug('Filter/sort criteria updated', {
        searchTerm: searchTerm || '(none)',
        category: selectedCategory || '(all)',
        sortField,
        sortDirection
      });
    }
  }, [searchTerm, selectedCategory, sortField, sortDirection, loading]);
  
  // Get sorted and filtered procedures
  const filteredAndSortedProcedures = procedures
    .filter(procedure => {
      // Filter by search term
      const matchesSearch = searchTerm === '' || 
        procedure.template.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by category
      const matchesCategory = selectedCategory === '' || 
        procedure.template.category.id === selectedCategory;
        
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (sortField === 'name') {
        return multiplier * a.template.name.localeCompare(b.template.name);
      } else if (sortField === 'price') {
        return multiplier * (a.price - b.price);
      } else if (sortField === 'category') {
        return multiplier * a.template.category.name.localeCompare(b.template.category.name);
      }
      
      return 0;
    });
  
  // Log any filtering results
  useEffect(() => {
    if (!loading && procedures.length > 0) {
      locationProceduresLogger.debug('Filtered procedures result', {
        totalProcedures: procedures.length,
        filteredCount: filteredAndSortedProcedures.length,
        isFiltered: filteredAndSortedProcedures.length !== procedures.length
      });
    }
  }, [filteredAndSortedProcedures.length, procedures.length, loading]);
  
  // Handle procedure deletion
  const handleDeleteClick = (procedure: Procedure) => {
    locationProceduresLogger.debug('Delete procedure dialog opened', { 
      procedureId: procedure.id,
      procedureName: procedure.template?.name
    });
    
    setProcedureToDelete(procedure);
    setDeleteModalOpen(true);
  };
  
  const handleCancelDelete = () => {
    locationProceduresLogger.debug('Delete procedure canceled', {
      procedureId: procedureToDelete?.id
    });
    
    setProcedureToDelete(null);
    setDeleteModalOpen(false);
  };
  
  const handleConfirmDelete = async () => {
    if (!procedureToDelete) {
      locationProceduresLogger.warn('Attempted to confirm delete with no procedure selected');
      return;
    }
    
    locationProceduresLogger.info('Deleting procedure', { 
      id: procedureToDelete.id,
      name: procedureToDelete.template?.name
    });
    
    try {
      setIsDeleting(true);
      
      // Track performance of deletion
      await locationProceduresLogger.time('Delete procedure', async () => {
        await proceduresApi.deletePrice(procedureToDelete.id);
      });
      
      // Update state
      setProcedures(prev => prev.filter(proc => proc.id !== procedureToDelete.id));
      
      locationProceduresLogger.info('Procedure deleted successfully', {
        id: procedureToDelete.id
      });
      
      // Show success message
      showToast('Procedure deleted successfully', 'success');
      
      // Close modal
      setDeleteModalOpen(false);
      setProcedureToDelete(null);
    } catch (err) {
      locationProceduresLogger.error('Failed to delete procedure', {
        id: procedureToDelete.id,
        error: err
      });
      
      showToast('Failed to delete procedure', 'error');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle bulk selection
  const handleSelectProcedure = (procedureId: string) => {
    locationProceduresLogger.debug('Toggle procedure selection', { 
      procedureId, 
      wasSelected: selectedProcedures.includes(procedureId) 
    });
    
    setSelectedProcedures(prev => {
      if (prev.includes(procedureId)) {
        return prev.filter(id => id !== procedureId);
      } else {
        return [...prev, procedureId];
      }
    });
  };
  
  const handleSelectAll = () => {
    const allSelected = selectedProcedures.length === filteredAndSortedProcedures.length;
    
    locationProceduresLogger.debug('Toggle select all procedures', { 
      currentlySelected: selectedProcedures.length,
      total: filteredAndSortedProcedures.length,
      allSelected,
      action: allSelected ? 'deselect-all' : 'select-all'
    });
    
    if (allSelected) {
      // Deselect all
      setSelectedProcedures([]);
    } else {
      // Select all filtered procedures
      setSelectedProcedures(filteredAndSortedProcedures.map(p => p.id));
    }
  };
  
  // Handle bulk price adjustment
  const handleBulkPriceAdjustment = async () => {
    if (selectedProcedures.length === 0 || bulkAdjustmentPercent === 0) {
      locationProceduresLogger.warn('Attempted bulk price adjustment with invalid parameters', {
        selectedCount: selectedProcedures.length,
        adjustmentPercent: bulkAdjustmentPercent
      });
      return;
    }
    
    locationProceduresLogger.info('Starting bulk price adjustment', {
      selectedCount: selectedProcedures.length,
      adjustmentPercent: bulkAdjustmentPercent
    });
    
    try {
      // Log the start of the bulk operation
      locationProceduresLogger.group('Bulk price adjustment', () => {
        locationProceduresLogger.debug('Selected procedures', {
          ids: selectedProcedures,
          count: selectedProcedures.length
        });
        
        locationProceduresLogger.debug('Adjustment details', {
          percent: bulkAdjustmentPercent,
          factor: 1 + (bulkAdjustmentPercent / 100)
        });
      });
      
      // Track performance of the bulk operation
      await locationProceduresLogger.time('Bulk price adjustment', async () => {
        // Here we'd normally make an API call to update all prices at once
        // For this example, we'll simulate it by updating each procedure individually
        
        const updatedProcedures = [...procedures];
        
        for (const procedureId of selectedProcedures) {
          const procedure = updatedProcedures.find(p => p.id === procedureId);
          if (procedure) {
            const adjustmentFactor = 1 + (bulkAdjustmentPercent / 100);
            const oldPrice = procedure.price;
            const newPrice = procedure.price * adjustmentFactor;
            
            // Log individual price updates
            locationProceduresLogger.debug('Updating procedure price', {
              procedureId,
              procedureName: procedure.template.name,
              oldPrice,
              newPrice,
              difference: newPrice - oldPrice
            });
            
            // Update in the backend (in a real implementation)
            await proceduresApi.updatePrice(procedureId, { 
              price: newPrice
            });
            
            // Update in local state
            procedure.price = newPrice;
          }
        }
        
        return updatedProcedures;
      });
      
      locationProceduresLogger.info('Bulk price adjustment completed', {
        updatedCount: selectedProcedures.length
      });
      
      showToast(`Updated prices for ${selectedProcedures.length} procedures`, 'success');
      
      // Reset selections
      setSelectedProcedures([]);
      setBulkAdjustmentPercent(0);
      setBulkEditMode(false);
    } catch (err) {
      locationProceduresLogger.error('Failed to update prices in bulk', err);
      showToast('Failed to update prices', 'error');
    }
  };
  
  // Log component rendering state
  useEffect(() => {
    if (!loading) {
      locationProceduresLogger.debug('Location procedures page render state', {
        isLoading: loading,
        hasError: !!error,
        hasLocation: !!location,
        locationName: location?.name,
        procedureCount: procedures.length,
        filteredCount: filteredAndSortedProcedures.length,
        categoryCount: categories.length,
        bulkEditMode,
        selectedProceduresCount: selectedProcedures.length
      });
    }
  }, [
    loading, 
    error, 
    location, 
    procedures.length, 
    filteredAndSortedProcedures.length, 
    categories.length,
    bulkEditMode,
    selectedProcedures.length
  ]);
  
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
            {location ? `Procedures at ${location.name}` : 'Procedures'}
          </h1>
          {location && (
            <p className="mt-1 text-sm text-gray-500">
              {location.address1}, {location.city}, {location.state} {location.zipCode}
            </p>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          {bulkEditMode ? (
            <>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  value={bulkAdjustmentPercent}
                  onChange={(e) => setBulkAdjustmentPercent(parseFloat(e.target.value))}
                  className="block w-28 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="% Change"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
              <button
                onClick={handleBulkPriceAdjustment}
                disabled={selectedProcedures.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Apply Changes
              </button>
              <button
                onClick={() => {
                  locationProceduresLogger.debug('Exiting bulk edit mode');
                  setBulkEditMode(false);
                  setSelectedProcedures([]);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  locationProceduresLogger.debug('Entering bulk edit mode');
                  setBulkEditMode(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Bulk Price Update
              </button>
              <Link
                href={`/provider/locations/${locationId}/add-procedure`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => locationProceduresLogger.info('Navigating to add procedure page', { locationId })}
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Add Procedure
              </Link>
            </>
          )}
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
              style={{ paddingLeft: '2rem' }} // ✅ Apply here
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 sr-only">
              Filter by category
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 text-gray-900 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >

              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Procedures Table */}
      {procedures.length === 0 ? (
        <div className="text-center bg-white py-12 px-4 shadow rounded-lg">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No procedures yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first procedure to this location.
          </p>
          <div className="mt-6">
            <Link
              href={`/provider/locations/${locationId}/add-procedure`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => locationProceduresLogger.info('Navigating to add procedure from empty state', { locationId })}
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Procedure
            </Link>
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
                      {bulkEditMode && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedProcedures.length === filteredAndSortedProcedures.length && filteredAndSortedProcedures.length > 0}
                            onChange={handleSelectAll}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </th>
                      )}
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
                        {bulkEditMode && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedProcedures.includes(procedure.id)}
                              onChange={() => handleSelectProcedure(procedure.id)}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {procedure.template.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {procedure.template.category.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 text-right text-sm font-medium">
                          ${procedure.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!bulkEditMode && (
                            <div className="flex justify-end space-x-2">
                              <Link
                                href={`/provider/procedures/${procedure.id}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                                onClick={() => locationProceduresLogger.debug('Navigating to edit procedure', { 
                                  procedureId: procedure.id,
                                  procedureName: procedure.template.name
                                })}
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
                          )}
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
                      Delete Procedure
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete {procedureToDelete?.template.name}? This action cannot be undone.
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
