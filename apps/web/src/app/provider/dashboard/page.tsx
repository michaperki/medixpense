
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { locationsApi, proceduresApi } from '@/lib/api';
import {
  MapPinIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    locations: 0,
    procedures: 0,
    views: 0,
    searchImpressions: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentLocations, setRecentLocations] = useState<any[]>([]);
  const [topProcedures, setTopProcedures] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    const fetchDashboardData = async () => {
      try {
        console.log("User data:", user);  // Add this to check user data
        console.log("Provider ID:", user?.provider?.id);  // Add this to check provider ID
        // always load locations
        const locResp = await locationsApi.getAll(1, 10);
        const locations = locResp.locations ?? [];
        setRecentLocations(locations.slice(0, 3));

        // only load procedures when we know our provider ID
        let procedures: any[] = [];
        if (user?.provider?.id) {
          const procResp = await proceduresApi.getProviderProcedures(
            user.provider.id
          );
          procedures = procResp.procedures ?? [];
        }
        setTopProcedures(
          procedures.sort((a, b) => b.price - a.price).slice(0, 5)
        );

        // stats
        setStats({
          locations: locations.length,
          procedures: procedures.length,
          views: Math.floor(Math.random() * 1000),
          searchImpressions: Math.floor(Math.random() * 5000)
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
        <div>
          <Link
            href="/provider/locations/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Location
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Locations */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Locations
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {stats.locations}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/provider/locations"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
          </div>
        </div>

        {/* Procedures */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Procedures
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {stats.procedures}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/provider/procedures"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Views */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Profile Views
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {stats.views}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/provider/analytics"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Search Impressions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Search Impressions
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {stats.searchImpressions}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/provider/analytics"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Locations */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Your Locations
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your practice locations
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {recentLocations.length > 0 ? (
            recentLocations.map((location) => (
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
                    <Link
                      href={`/provider/locations/${location.id}/procedures`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Manage Procedures
                    </Link>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-5 sm:px-6 text-center">
              <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No locations</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first location.
              </p>
              <div className="mt-6">
                <Link
                  href="/provider/locations/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Location
                </Link>
              </div>
            </li>
          )}
        </ul>
        {recentLocations.length > 0 && (
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-center">
              <Link
                href="/provider/locations"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View all locations
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Top Procedures */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Top Procedures
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your most expensive procedures
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {topProcedures.length > 0 ? (
            topProcedures.map((procedure) => (
              <li key={procedure.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-blue-600">
                        {procedure.template.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {procedure.location.name}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">${procedure.price}</div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-5 sm:px-6 text-center">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No procedures</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't added any procedures yet.
              </p>
            </li>
          )}
        </ul>
        {topProcedures.length > 0 && (
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-center">
              <Link
                href="/provider/procedures"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View all procedures
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
