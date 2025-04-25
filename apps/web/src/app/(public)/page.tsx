// src/app/(public)/page.tsx – instrumented with logger v2

'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getLogger, LogContext } from '@/lib/logger';

const renderLogger = getLogger(LogContext.RENDER);
const uiLogger = getLogger('UI');

export default function HomePage() {
  const router = useRouter();
  const [procedure, setProcedure] = useState('');
  const [location, setLocation] = useState('');

  // src/app/(public)/page.tsx
  const didLog = useRef(false);
  useEffect(() => {
    if (didLog.current) return;
    didLog.current = true;
    renderLogger.info('HomePage mounted');
    return () => renderLogger.info('HomePage unmounted');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Build URL with search parameters
    const params = new URLSearchParams();
    if (procedure) params.set('query', procedure);
    if (location) params.set('location', location);
    params.set('page', '1');

    uiLogger.info('Search submit', { procedure, location });

    // Navigate to search page with parameters
    router.push(`/search?${params.toString()}`);
  };

  return (
    <>
      {/* Hero Section */}
      <div className="hero">
        <div className="container">
          <div className="text-center">
            <h1 className="text-white text-4xl font-extrabold sm:text-5xl md:text-6xl">
              Find Healthcare Prices Near You
            </h1>
            <p
              className="mt-3 mx-auto text-base sm:text-lg md:mt-5 md:text-xl"
              style={{ color: 'var(--color-primary-100)' }}
            >
              Compare medical procedure costs across providers in your area and make informed healthcare decisions.
            </p>
            <div className="mt-8 sm:flex sm:justify-center">
              <div className="search-box">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <label
                      htmlFor="procedure"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Procedure
                    </label>
                    <div className="mt-1">
                      <select
                        id="procedure"
                        name="procedure"
                        value={procedure}
                        onChange={(e) => setProcedure(e.target.value)}
                        className="form-select"
                      >
                        <option value="" disabled>
                          Select a procedure
                        </option>
                        <option value="MRI Brain without contrast">MRI Brain without contrast</option>
                        <option value="Colonoscopy screening">Colonoscopy screening</option>
                        <option value="CT Scan - Chest">CT Scan - Chest</option>
                        <option value="Physical Therapy - Initial evaluation">Physical Therapy - Initial evaluation</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Location
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="location"
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, State or ZIP"
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="btn btn-primary">
                      Search
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Procedure Categories */}
      <div className="container py-12">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Browse by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Diagnostic Imaging */}
          <div className="category-card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="category-icon">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Diagnostic Imaging</h3>
                  <p className="text-sm text-gray-500">MRI, CT, X-ray, Ultrasound</p>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/search?category=imaging" className="category-link">
                  Browse 48 procedures <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Preventive Care */}
          <div className="category-card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="category-icon">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-primary">Preventive Care</h3>
                  <p className="text-sm text-secondary">Screenings, Vaccinations, Physicals</p>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/search?category=preventive" className="category-link">
                  Browse 36 procedures <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Laboratory */}
          <div className="category-card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="category-icon">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-primary">Laboratory</h3>
                  <p className="text-sm text-secondary">Blood tests, Panels, Pathology</p>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/search?category=lab" className="category-link">
                  Browse 52 procedures <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <Link href="/search" className="btn btn-outline bg-primary-light text-primary-600">
            View all categories <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-light">
        <div className="container py-16">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-primary">
              How Medixpense Works
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-primary mx-auto">
              Bringing transparency to healthcare costs in three simple steps
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="card shadow-lg">
              <div className="p-6 text-center">
                <span className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mx-auto">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <h3 className="mt-4 text-lg font-medium text-primary">Search</h3>
                <p className="mt-2 text-base text-secondary">
                  Find a procedure by name, category, or description. Specify your location for relevant results.
                </p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="card shadow-lg">
              <div className="p-6 text-center">
                <span className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mx-auto">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </span>
                <h3 className="mt-4 text-lg font-medium text-primary">Compare</h3>
                <p className="mt-2 text-base text-secondary">
                  View and compare prices from different providers in your area with detailed information.
                </p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="card shadow-lg">
              <div className="p-6 text-center">
                <span className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mx-auto">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <h3 className="mt-4 text-lg font-medium text-primary">Choose</h3>
                <p className="mt-2 text-base text-secondary">
                  Make an informed decision based on price, location, and provider information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Registration CTA */}
      <div className="bg-primary">
        <div className="container py-12 lg:flex lg:items-center lg:justify-between">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Are you a healthcare provider?
            </h2>
            <p className="mt-2 text-lg" style={{ color: 'var(--color-primary-200)' }}>
              Join our network and reach more patients.
            </p>
          </div>
          <div className="mt-8 flex justify-center lg:mt-0 lg:flex-shrink-0">
            <Link href="/register" className="btn btn-secondary">
              Register Now
            </Link>
            <Link href="/about" className="ml-3 btn btn-outline text-white" style={{ borderColor: 'var(--color-primary-800)', backgroundColor: 'var(--color-primary-800)' }}>
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
