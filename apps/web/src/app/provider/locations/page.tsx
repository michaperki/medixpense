
'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { locationService, type Location } from '@/services';
import { getLogger, LogContext } from '@/lib/logger';
import { handleApiError } from '@/lib/api/handleApiError'; // Import error handler
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const log = getLogger(LogContext.RENDER);
const LIMIT = 10;

export default function LocationsPage() {
  const router = useRouter();
  const { showToast } = useToast(); // You still need this for manual toasts like success
  const [page, setPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const firstLoad = useRef(false);

  async function fetchLocations(currentPage: number) {
    const timer = log.timer(currentPage === 1 ? 'Initial locations load' : `Load page ${currentPage}`);
    try {
      const result = await locationService.getAll({ page: currentPage, limit: LIMIT });
      if (result?.locations) {
        setLocations(result.locations);
        setPagination(result.pagination ?? { page: currentPage, limit: LIMIT, total: 0, pages: 0 });
        log.info('Locations fetched', { page: currentPage, count: result.locations.length, total: result.pagination?.total });
      }
      timer.done();
    } catch (err) {
      timer.fail(err);
      handleApiError(err, 'fetchLocations');  // Automatically handles error logging and toasts
    }
  }

  useEffect(() => {
    if (firstLoad.current) return;
    firstLoad.current = true;

    const pageTimer = log.timer('LocationsPage boot');
    setIsLoading(true);
    fetchLocations(1)
      .finally(() => {
        setIsLoading(false);
        pageTimer.done();
      });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    log.info('Page change requested', { from: page, to: newPage });
    setIsLoading(true);
    setPage(newPage);
    fetchLocations(newPage)
      .finally(() => setIsLoading(false));
  }, [page]);

  const handleDeleteLocation = async (id: string) => {
    const timer = log.timer('Delete location');
    try {
      await locationService.delete(id);
      timer.done();
      showToast('Location deleted successfully', 'success');
      setIsLoading(true);
      await fetchLocations(page);
    } catch (err) {
      timer.fail(err);
      log.error('Delete failed', err);
      handleApiError(err, 'handleDeleteLocation');  // Automatically handles error logging and toasts
    } finally {
      setIsLoading(false);
      setDeleteModalOpen(false);
      setLocationToDelete(null);
    }
  };

  const handleDeleteClick = useCallback((loc: Location) => {
    log.info('Delete modal opened', { id: loc.id });
    setLocationToDelete(loc);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (locationToDelete) handleDeleteLocation(locationToDelete.id);
  }, [locationToDelete]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setLocationToDelete(null);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      log.info('Rendering locations list', { page, loaded: locations.length, totalPages: pagination.pages });
    }
  }, [isLoading, locations.length, page, pagination.pages]);

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
                              {location.address1}, {location.city}, {location.state} {location.zipCode}
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
                          href={`/provider/locations/${location.id}`}
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
            </div>
          )}
        </>
      )}
    </div>
  );
}

