
// src/app/(public)/search/page.tsx – unified (list + map)
// -----------------------------------------------------------------------------
// • Keeps the existing search-form UX you like.
// • Replaces the old “results” page — a toggle shows the map without navigating
//   away, so you don’t lose scroll position or filters.
// • HandleSearch now pushes to `/search` (same route) → true SPA feel.
// -----------------------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { searchApi, proceduresApi } from '@/lib/api';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ListBulletIcon,
  MapIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const ProcedureMap = dynamic(() => import('@/components/maps/ProcedureMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 h-64 w-full flex items-center justify-center">
      <div className="spinner spinner-md" />
    </div>
  )
});

type Result = {
  id: string;
  price: number;
  distance?: number;
  savingsPercent?: number;
  provider: { id: string; name: string };
  location: { id: string; city: string; state: string; latitude?: number; longitude?: number };
  procedure: { id: string; name: string; description?: string; category: { id: string; name: string } };
};

type Pagination = { page: number; limit: number; total: number; pages: number };

export default function SearchPage() {
  /* ------------------------------------------------------------
   * Routing + query-string helpers
   * ---------------------------------------------------------- */
  const searchParams = useSearchParams();
  const router = useRouter();

  const qp = (key: string, fallback = '') => searchParams.get(key) ?? fallback;

  /* ------------------------------------------------------------
   * Controlled inputs (synced ←→ query-string)
   * ---------------------------------------------------------- */
  const [procedure, setProcedure]     = useState(qp('query'));
  const [location, setLocation]       = useState(qp('location'));
  const [categoryId, setCategoryId]   = useState(qp('category'));
  const [distance, setDistance]       = useState(qp('distance', '50'));
  const [sort, setSort]               = useState(qp('sort', 'price_asc'));

  /* ------------------------------------------------------------
   * Data
   * ---------------------------------------------------------- */
  const [categories,   setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [results,      setResults]    = useState<Result[]>([]);
  const [pagination,   setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading,      setLoading]    = useState(false);
  const [error,        setError]      = useState<string | null>(null);

  /* ------------------------------------------------------------
   * View state
   * ---------------------------------------------------------- */
  const [viewMode, setViewMode]       = useState<'list' | 'map'>('list');
  const [mapCenter, setMapCenter]     = useState<{ lat: number; lng: number } | null>(null);
  const [selectedResult, setSelected] = useState<Result | null>(null);

  /* ------------------------------------------------------------
   * Fetch categories once
   * ---------------------------------------------------------- */
  useEffect(() => {
    proceduresApi.getCategories().then((res) => setCategories(res.categories)).catch(console.error);
  }, []);

  /* ------------------------------------------------------------
   * Fetch search results whenever the query-string changes
   * ---------------------------------------------------------- */
  const lastKey = useRef('');

  useEffect(() => {
    const q   = qp('query');
    const loc = qp('location');
    const cat = qp('category');
    const dis = qp('distance', '50');
    const so  = qp('sort', 'price_asc');
    const pg  = parseInt(qp('page', '1'), 10);

    // sync controlled inputs (when user hits back/forward)
    setProcedure(q);
    setLocation(loc);
    setCategoryId(cat);
    setDistance(dis);
    setSort(so);

    const key = [q, loc, cat, dis, so, pg].join('|');
    if (!q && !loc && !cat) return; // nothing to search yet
    if (key === lastKey.current) return;
    lastKey.current = key;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await searchApi.searchProcedures({
          query: q,
          location: loc,
          categoryId: cat,
          distance: dis,
          sort: so,
          page: pg.toString(),
          limit: '20'
        });
        setResults(Array.isArray(res.results) ? res.results : []);
        setPagination(res.pagination ?? { page: pg, limit: 20, total: 0, pages: 0 });
        if (res.data?.searchLocation) {
          setMapCenter({ lat: res.data.searchLocation.latitude, lng: res.data.searchLocation.longitude });
        }
      } catch (err) {
        console.error(err);
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  /* ------------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------- */
  const pushParams = (p: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(p).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.set('page', '1'); // reset paging on new search
    router.push(`/search?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams({ query: procedure, location, category: categoryId, distance, sort });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/search?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatMiles = (d?: number) => (d ? `${d.toFixed(1)} mi` : '');

  /* ------------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */
  return (
    <div className="bg-white">
      {/* ----------------------------------------------------- */}
      {/* SEARCH BAR */}
      {/* ----------------------------------------------------- */}
      <div className="bg-primary">
        <div className="container py-6">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">
            {/* procedure */}
            <div className="md:col-span-2 relative">
              <label htmlFor="procedure" className="text-white text-sm mb-1 block">Procedure</label>
              <MagnifyingGlassIcon className="absolute left-3 top-9 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                id="procedure"
                value={procedure}
                onChange={e => setProcedure(e.target.value)}
                placeholder="MRI, CT…"
                className="form-input pl-10"
              style={{ paddingLeft: '2rem' }}
                style={{ color: 'var(--color-gray-800)', paddingLeft: '2rem'  }}
              />
            </div>
            {/* location */}
            <div className="md:col-span-1 relative">
              <label htmlFor="location" className="text-white text-sm mb-1 block">Location</label>
              <MapPinIcon className="absolute left-3 top-9 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                id="location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="ZIP or City"
                className="form-input pl-10"
                style={{ color: 'var(--color-gray-800)', paddingLeft: '2rem'  }}
              />
            </div>
            {/* category */}
            <div className="md:col-span-1">
              <label htmlFor="category" className="text-white text-sm mb-1 block">Category</label>
              <select
                id="category"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="form-select"
                style={{ color: 'var(--color-gray-800)' }}
              >
                <option value="">All</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {/* submit */}
            <div className="flex items-end">
              <button type="submit" className="btn btn-primary w-full md:w-auto flex items-center justify-center">
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ----------------------------------------------------- */}
      {/* RESULTS */}
      {/* ----------------------------------------------------- */}
      <div className="container py-8">
        {/* header */}
        {results.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-gray-800">
              {loading ? 'Searching…' : `${pagination.total} results`}
            </h2>
            <div className="flex space-x-2">
              <button onClick={() => setViewMode('list')} className={`icon-btn ${viewMode === 'list' ? 'active' : ''}`}>
                <ListBulletIcon className="h-5 w-5" />
              </button>
              <button onClick={() => setViewMode('map')} className={`icon-btn ${viewMode === 'map' ? 'active' : ''}`}>
                <MapIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* states */}
        {error && <div className="alert alert-error mb-4">{error}</div>}
        {loading && <div className="loading-spinner"><div className="spinner spinner-md" /></div>}
        {!loading && !error && results.length === 0 && (
          <div className="text-center text-gray-600">No procedures found.</div>
        )}

        {/* list */}
        {!loading && !error && results.length > 0 && viewMode === 'list' && (
          <div className="space-y-4">
            {results.map(r => (
              <div key={r.id} className="results-card p-4 flex flex-col md:flex-row md:justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    <Link href={`/procedures/${r.procedure.id}`} className="hover:underline">{r.procedure.name}</Link>
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{r.procedure.description}</p>
                  <div className="mt-1 flex space-x-2 text-sm">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{r.procedure.category.name}</span>
                    {r.distance && <span className="bg-gray-100 px-2 py-0.5 rounded">{formatMiles(r.distance)}</span>}
                  </div>
                </div>
                <div className="mt-3 md:mt-0 text-right whitespace-nowrap">
                  <div className="text-lg font-medium text-gray-800">${r.price.toFixed(2)}</div>
                  {r.savingsPercent && (
                    <div className="text-xs text-green-600">Save {r.savingsPercent}%</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* map */}
        {!loading && !error && results.length > 0 && viewMode === 'map' && (
          <div className="card" style={{ height: '70vh' }}>
            <ProcedureMap
              results={results}
              center={mapCenter ?? undefined}
              selectedMarker={selectedResult ?? undefined}
              onMarkerClick={setSelected}
            />
          </div>
        )}

        {/* pagination */}
        {!loading && !error && pagination.pages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-4">
            <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="icon-btn">
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</span>
            <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="icon-btn">
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

