
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { locationsApi, proceduresApi } from '@/lib/api';
import { getLogger, LogContext, cfg } from '@/lib/logger';
import { useToast } from '@/hooks/useToast';  // Import useToast
import {
  MapPinIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const log = getLogger(LogContext.RENDER);

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();  // Use showToast for error toasts
  const [stats, setStats] = useState({ locations: 0, procedures: 0, views: 0, searchImpressions: 0 });
  const [recentLocations, setRecentLocations] = useState<any[]>([]);
  const [topProcedures, setTopProcedures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !user) return;
    ran.current = true;

    // Single timer for entire dashboard load
    const dashboardTimer = log.timer('ProviderDashboard boot');
    
    // Single info log with context
    log.info('Initializing dashboard', { 
      userId: user?.id?.substring(0, 8),
      path: '/provider/dashboard'
    });

    (async () => {
      try {
        // Fetch locations
        const locations = await log.time('Fetch locations', async () => {
          const response = await locationsApi.getAll(1, 10);
          const locations = response.locations || [];
          setRecentLocations(locations.slice(0, 3));
          return { count: locations.length };
        });
        
        // Fetch procedures 
        const procedures = await log.time('Fetch procedures', async () => {
          if (!user.provider?.id) {
            log.warn('Provider ID missing, skipping procedure fetch');
            return { count: 0 };
          }
          
          const response = await proceduresApi.getProviderProcedures(user.provider.id);
          const procedures = response.procedures || [];
          setTopProcedures(procedures.sort((a, b) => b.price - a.price).slice(0, 5));
          return { count: procedures.length };
        });
        
        // Update stats once at the end
        setStats({
          locations: locations.count,
          procedures: procedures.count,
          views: Math.floor(Math.random() * 1000),
          searchImpressions: Math.floor(Math.random() * 5000)
        });
        
        // Single log for final state with concise stats
        log.info('Dashboard state ready', { 
          locations: locations.count, 
          procedures: procedures.count 
        });
      } catch (err) {
        log.error('Dashboard data fetch failed', err);
        // Trigger an error toast when fetching fails
        showToast('Failed to load dashboard data. Please try again.', 'error');
      } finally {
        setLoading(false);
        dashboardTimer.done();
      }
    })();
  }, [user, showToast]);

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
        <Link href="/provider/locations/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          Add Location
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<MapPinIcon className="h-6 w-6 text-gray-400" />} label="Locations" value={stats.locations} link="/provider/locations" />
        <StatCard icon={<ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />} label="Procedures" value={stats.procedures} link="/provider/procedures" />
        <StatCard icon={<UserGroupIcon className="h-6 w-6 text-gray-400" />} label="Profile Views" value={stats.views} link="/provider/analytics" />
        <StatCard icon={<CurrencyDollarIcon className="h-6 w-6 text-gray-400" />} label="Search Impressions" value={stats.searchImpressions} link="/provider/analytics" />
      </div>

      <SectionList title="Your Locations" emptyText="No locations yet" emptyLink="/provider/locations/new" items={recentLocations.map(loc => ({
        id: loc.id,
        primary: loc.name,
        secondary: `${loc.address1}, ${loc.city}, ${loc.state} ${loc.zipCode}`,
        href: `/provider/locations/${loc.id}/procedures`
      }))} />

      <SectionList title="Top Procedures" emptyText="No procedures yet" emptyLink="/provider/procedures" items={topProcedures.map(proc => ({
        id: proc.id,
        primary: proc.template.name,
        secondary: proc.location.name,
        value: `$${proc.price}`
      }))} />
    </div>
  );
}

function StatCard({ icon, label, value, link }: any) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5 flex items-center">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
            <dd>
              <div className="text-lg font-medium text-gray-900">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3 text-sm">
        <Link href={link} className="font-medium text-blue-600 hover:text-blue-500">
          View all
        </Link>
      </div>
    </div>
  );
}

function SectionList({ title, emptyText, emptyLink, items }: any) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {items.length > 0 ? (
          items.map((item: any) => (
            <li key={item.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-600">{item.primary}</div>
                {item.secondary && <div className="text-sm text-gray-500">{item.secondary}</div>}
              </div>
              {item.href ? (
                <Link href={item.href} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  Manage
                </Link>
              ) : item.value && (
                <div className="text-sm font-semibold">{item.value}</div>
              )}
            </li>
          ))
        ) : (
          <li className="px-4 py-5 sm:px-6 text-center text-gray-500">
            {emptyText}
            <div className="mt-4">
              <Link href={emptyLink} className="text-blue-600 hover:text-blue-500">Add now</Link>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}

