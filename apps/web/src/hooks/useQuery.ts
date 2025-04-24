// src/hooks/useQuery.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '@/lib/apiClient';

// Query Status
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

// Query Options
export interface QueryOptions<T> {
  enabled?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  refetchInterval?: number;
  cacheTime?: number;
  staleTime?: number;
  retry?: number | boolean;
  retryDelay?: number | ((retryAttempt: number) => number);
  queryKey?: any[];
}

// Query Result
export interface QueryResult<T> {
  data: T | undefined;
  error: ApiError | null;
  status: QueryStatus;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  refetch: () => Promise<T>;
}

// Simple cache implementation
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const queryCache = new Map<string, CacheItem<any>>();

// Generate cache key from query key
const generateCacheKey = (queryKey: any[]): string => {
  return JSON.stringify(queryKey);
};

// Main useQuery hook
export function useQuery<T>(
  queryFn: () => Promise<T>,
  options: QueryOptions<T> = {}
): QueryResult<T> {
  // Default options
  const {
    enabled = true,
    initialData,
    onSuccess,
    onError,
    refetchInterval = 0,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 0, // 0 means always stale
    retry = 3,
    retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
    queryKey = []
  } = options;

  // State
  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<ApiError | null>(null);
  const [status, setStatus] = useState<QueryStatus>(initialData ? 'success' : 'idle');
  
  // Refs for tracking component mount state, fetch status, and dependencies
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const refetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchPromiseRef = useRef<Promise<T> | null>(null);
  const queryKeyStringRef = useRef<string>(JSON.stringify(queryKey));
  const queryFnRef = useRef<() => Promise<T>>(queryFn);
  
  // Update refs when dependencies change
  useEffect(() => {
    queryKeyStringRef.current = JSON.stringify(queryKey);
  }, [queryKey]);
  
  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refetchIntervalRef.current) {
        clearInterval(refetchIntervalRef.current);
        refetchIntervalRef.current = null;
      }
    };
  }, []);
  
  // Fetch function for data retrieval
  const fetchData = useCallback(async (skipCache = false): Promise<T> => {
    // Prevent duplicate fetches for the same query
    if (fetchPromiseRef.current && !skipCache) {
      return fetchPromiseRef.current;
    }
    
    // Check cache if not skipping
    if (!skipCache && queryKey.length > 0) {
      const cacheKey = generateCacheKey(queryKey);
      const cachedItem = queryCache.get(cacheKey);
      
      if (cachedItem && Date.now() - cachedItem.timestamp < staleTime) {
        if (isMountedRef.current) {
          setData(cachedItem.data);
          setStatus('success');
          onSuccess?.(cachedItem.data);
        }
        return cachedItem.data;
      }
    }
    
    // Set loading state only if we don't already have data
    if (isMountedRef.current) {
      if (!data) {
        setStatus('loading');
      }
    }
    
    const fetchPromise = (async () => {
      try {
        const result = await queryFnRef.current();
        
        // Update state if component is still mounted
        if (isMountedRef.current) {
          setData(result);
          setStatus('success');
          setError(null);
          retryCountRef.current = 0;
          
          // Call onSuccess callback
          onSuccess?.(result);
        }
        
        // Cache the result if queryKey is provided
        if (queryKey.length > 0) {
          const cacheKey = generateCacheKey(queryKey);
          queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
          
          // Set up cache expiration
          setTimeout(() => {
            queryCache.delete(cacheKey);
          }, cacheTime);
        }
        
        return result;
      } catch (err) {
        const apiError = err as ApiError;
        
        // Update state if component is still mounted
        if (isMountedRef.current) {
          setError(apiError);
          setStatus('error');
          
          // Call onError callback
          onError?.(apiError);
          
          // Handle retry logic
          const maxRetries = typeof retry === 'boolean' ? (retry ? 3 : 0) : retry;
          
          if (retryCountRef.current < maxRetries) {
            const delay = typeof retryDelay === 'function'
              ? retryDelay(retryCountRef.current)
              : retryDelay;
            
            retryCountRef.current++;
            
            setTimeout(() => {
              if (isMountedRef.current) {
                fetchData(true).catch(() => {
                  // Handle any errors in retry silently
                });
              }
            }, delay);
          }
        }
        
        throw apiError;
      } finally {
        // Clear the fetch promise reference when done
        if (fetchPromiseRef.current === fetchPromise) {
          fetchPromiseRef.current = null;
        }
      }
    })();
    
    // Store the fetch promise
    fetchPromiseRef.current = fetchPromise;
    
    return fetchPromise;
  }, [data, queryKey, staleTime, cacheTime, onSuccess, onError, retry, retryDelay]);

  // Effect for initial fetch and refetch interval
  useEffect(() => {
    // Don't fetch if disabled
    if (!enabled) {
      return;
    }
    
    // Reset retry count and clear any existing interval
    retryCountRef.current = 0;
    if (refetchIntervalRef.current) {
      clearInterval(refetchIntervalRef.current);
      refetchIntervalRef.current = null;
    }
    
    // Perform the initial fetch
    fetchData().catch(() => {
      // Error is already handled in fetchData
    });
    
    // Set up refetch interval if needed
    if (refetchInterval > 0) {
      refetchIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchData().catch(() => {
            // Error is already handled in fetchData
          });
        }
      }, refetchInterval);
      
      return () => {
        if (refetchIntervalRef.current) {
          clearInterval(refetchIntervalRef.current);
          refetchIntervalRef.current = null;
        }
      };
    }
  }, [enabled, queryKeyStringRef.current, fetchData, refetchInterval]); // Use string ref to properly track changes

  // Manual refetch function
  const refetch = useCallback(async (): Promise<T> => {
    return fetchData(true);
  }, [fetchData]);

  // Derive states with safeguards to prevent incorrect loading state
  // KEY FIX: isLoading is false if we already have data
  const isLoading = status === 'loading' && !data;
  const isSuccess = status === 'success' || (data !== undefined && status === 'loading');
  const isError = status === 'error';
  const isIdle = status === 'idle';

  return {
    data,
    error,
    status,
    isLoading,
    isSuccess,
    isError,
    isIdle,
    refetch
  };
}

// Hook for mutations (create, update, delete)
export interface MutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: ApiError, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: ApiError | null, variables: TVariables) => void;
}

export interface MutationResult<TData, TVariables> {
  data: TData | undefined;
  error: ApiError | null;
  status: QueryStatus;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  mutate: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: MutationOptions<TData, TVariables> = {}
): MutationResult<TData, TVariables> {
  // Options
  const { onSuccess, onError, onSettled } = options;
  
  // State
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<ApiError | null>(null);
  const [status, setStatus] = useState<QueryStatus>('idle');
  
  // Reference to track component mount state
  const isMountedRef = useRef(true);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Reset function
  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setData(undefined);
      setError(null);
      setStatus('idle');
    }
  }, []);
  
  // Mutation function
  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    if (isMountedRef.current) {
      setStatus('loading');
      setError(null);
    }
    
    try {
      const result = await mutationFn(variables);
      
      if (isMountedRef.current) {
        setData(result);
        setStatus('success');
        
        // Call onSuccess callback
        onSuccess?.(result, variables);
        
        // Call onSettled callback
        onSettled?.(result, null, variables);
      }
      
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      
      if (isMountedRef.current) {
        setError(apiError);
        setStatus('error');
        
        // Call onError callback
        onError?.(apiError, variables);
        
        // Call onSettled callback
        onSettled?.(undefined, apiError, variables);
      }
      
      throw apiError;
    }
  }, [mutationFn, onSuccess, onError, onSettled]);
  
  // Calculate derived states
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isIdle = status === 'idle';
  
  return {
    data,
    error,
    status,
    isLoading,
    isSuccess,
    isError,
    isIdle,
    mutate,
    reset
  };
}

// Function to invalidate queries by prefix
export function invalidateQueries(keyPrefix: any[]): void {
  const prefixString = JSON.stringify(keyPrefix);
  
  for (const cacheKey of queryCache.keys()) {
    try {
      const parsedKey = JSON.parse(cacheKey);
      
      // Check if the key starts with the prefix
      const isMatch = keyPrefix.every((part, index) => {
        return JSON.stringify(parsedKey[index]) === JSON.stringify(part);
      });
      
      if (isMatch) {
        queryCache.delete(cacheKey);
      }
    } catch (e) {
      // Skip invalid cache keys
      console.error('Invalid cache key:', cacheKey);
    }
  }
}
