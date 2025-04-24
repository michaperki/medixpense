'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { proceduresApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { getLogger, LogContext } from '@/lib/logger';
import { 
  ArrowLeftIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  InformationCircleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

// Create a procedure-specific logger for this page
const editProcedureLogger = getLogger(LogContext.RENDER);

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
  location: {
    id: string;
    name: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
  };
};

type PriceStats = {
  min: number;
  max: number;
  average: number;
  median: number;
};

export default function EditProcedurePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const procedureId = params.procedureId as string;
  
  // State
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch procedure data on component mount
  useEffect(() => {
    const fetchProcedure = async () => {
      editProcedureLogger.info('Fetching procedure details', { procedureId });
      
      try {
        setLoading(true);
        
        // Fetch procedure details with performance tracking
        const response = await editProcedureLogger.time('Fetch procedure details', async () => {
          return proceduresApi.getProcedureById(procedureId);
        });
        
        const procedureData = response.procedurePrice;
        
        if (!procedureData) {
          editProcedureLogger.warn('Procedure not found', { procedureId });
          throw new Error('Procedure not found');
        }
        
        editProcedureLogger.debug('Procedure data loaded', { 
          procedureId: procedureData.id,
          templateName: procedureData.template?.name,
          locationName: procedureData.location?.name,
          currentPrice: procedureData.price
        });
        
        setProcedure(procedureData);
        setPrice(procedureData.price);
        
        // Fetch price statistics after fetching procedure
        fetchPriceStats(procedureData);
        
        setError(null);
      } catch (err) {
        editProcedureLogger.error('Failed to fetch procedure', { procedureId, error: err });
        setError('Failed to load procedure. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProcedure();
  }, [procedureId]);
  
  // Fetch price statistics 
  const fetchPriceStats = async (procData: Procedure) => {
    editProcedureLogger.debug('Fetching price statistics', {
      templateId: procData.template.id,
      locationId: procData.location.id
    });
    
    try {
      setStatsLoading(true);
      
      // Track performance of statistics fetch
      const response = await editProcedureLogger.time('Fetch price statistics', async () => {
        return proceduresApi.getPriceStats(procData.template.id, {
          locationId: procData.location.id, // To exclude current location from stats
          radius: 50, // Miles
        });
      });
      
      // Handle the response based on the API structure
      const statsData = response.stats;
      
      if (statsData) {
        editProcedureLogger.debug('Price statistics loaded', {
          min: statsData.min,
          max: statsData.max,
          average: statsData.average,
          median: statsData.median
        });
        
        setPriceStats(statsData);
      } else {
        editProcedureLogger.debug('No price statistics available for this procedure');
        // If no stats available, set to null
        setPriceStats(null);
      }
      
    } catch (err) {
      editProcedureLogger.warn('Failed to fetch price statistics', { 
        templateId: procData.template.id,
        error: err
      });
      // If stats API fails, don't show an error to the user, just don't show stats
      setPriceStats(null);
    } finally {
      setStatsLoading(false);
    }
  };
  
  // Handle price change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newPrice = isNaN(value) ? 0 : value;
    
    editProcedureLogger.debug('Price input changed', { 
      oldPrice: price,
      newPrice: newPrice
    });
    
    setPrice(newPrice);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    editProcedureLogger.info('Procedure price update submitted', { 
      procedureId,
      newPrice: price,
      oldPrice: procedure?.price
    });
    
    if (price <= 0) {
      editProcedureLogger.warn('Invalid price submitted', { price });
      showToast('Please enter a valid price', 'error');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Track performance of price update
      await editProcedureLogger.time('Update procedure price', async () => {
        return proceduresApi.updatePrice(procedureId, { price });
      });
      
      editProcedureLogger.info('Procedure price updated successfully', {
        procedureId,
        newPrice: price,
        priceDifference: price - (procedure?.price || 0)
      });
      
      showToast('Procedure price updated successfully', 'success');
      
      // Navigate back to procedures list
      router.push(`/provider/procedures`);
      
    } catch (err: any) {
      editProcedureLogger.error('Failed to update procedure price', {
        procedureId,
        price,
        error: err
      });
      
      const errorMessage = err.message || 'Failed to update procedure price';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Log component render state
  useEffect(() => {
    if (!loading) {
      editProcedureLogger.debug('Edit procedure page render state', {
        procedureId,
        hasData: !!procedure,
        hasError: !!error,
        priceStatsAvailable: !!priceStats,
        isSubmitting
      });
    }
  }, [loading, procedure, error, priceStats, isSubmitting, procedureId]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!procedure) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || 'Procedure not found'}</p>
              <button
                onClick={() => router.push('/provider/procedures')}
                className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeftIcon className="-ml-0.5 mr-2 h-4 w-4" />
                Back to Procedures
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Procedure Price
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Update the price for {procedure.template.name} at {procedure.location.name}
          </p>
        </div>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-red-400" />
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
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6">
              {/* Procedure Details */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Procedure Information</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Name:</span> {procedure.template.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Category:</span> {procedure.template.category.name}
                      </p>
                      {procedure.template.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">Description:</span> {procedure.template.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Location Information</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Name:</span> {procedure.location.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Address:</span> {procedure.location.address1}, {procedure.location.city}, {procedure.location.state} {procedure.location.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Price Form */}
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Update Price</h3>
                
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Your Price ($)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="price"
                        id="price"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={handlePriceChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  {/* Price Statistics */}
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Price Comparison
                        </h4>
                        {statsLoading ? (
                          <div className="flex justify-center items-center h-16">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                          </div>
                        ) : (
                          <>
                            {priceStats ? (
                              <div className="mt-2 text-sm text-gray-500 space-y-1">
                                <p>Average Price: <span className="font-medium text-gray-900">${priceStats.average.toFixed(2)}</span></p>
                                <p>Range: <span className="font-medium text-gray-900">${priceStats.min.toFixed(2)} - ${priceStats.max.toFixed(2)}</span></p>
                                <p>Median: <span className="font-medium text-gray-900">${priceStats.median.toFixed(2)}</span></p>
                                <p className="text-xs text-gray-400 mt-2">Based on similar procedures within 50 miles</p>
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-gray-500">
                                No price data available for this procedure in your area.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              onClick={() => {
                editProcedureLogger.debug('Edit canceled, returning to previous page');
                router.back();
              }}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={price <= 0 || isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Price'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
