// src/app/(public)/page.tsx
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <>

      {/* Hero Section */}
      <div className="hero">
        <div className="container">
          <div className="text-center">
            <h1 className="text-white text-4xl font-extrabold sm:text-5xl md:text-6xl">
              Find Healthcare Prices Near You
            </h1>
            <p className="mt-3 mx-auto text-base sm:text-lg md:text-xl text-primary-100">
              Compare medical procedure costs across providers in your area and make informed healthcare decisions.
            </p>
            <div className="mt-8 flex justify-center">
              <div className="search-box">
                <div className="mb-4">
                  <label htmlFor="procedure" className="block text-sm font-medium text-gray-800 text-left">Procedure</label>
                  <select
                    id="procedure"
                    name="procedure"
                    defaultValue=""
                    className="form-select w-full text-gray-800"
                    style={{ color: '#1f2937' }} /* Inline style as a fallback */
                  >
                    <option value="" disabled>
                      Select a procedure
                    </option>
                    <option value="MRI Brain without contrast">
                      MRI Brain without contrast
                    </option>
                    <option value="Colonoscopy screening">
                      Colonoscopy screening
                    </option>
                    <option value="CT Scan - Chest">
                      CT Scan - Chest
                    </option>
                    <option value="Physical Therapy - Initial evaluation">
                      Physical Therapy - Initial evaluation
                    </option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-800 text-left">Location</label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    placeholder="City, State or ZIP"
                    className="form-input w-full text-gray-800"
                    style={{ color: '#1f2937' }} /* Inline style as a fallback */
                  />
                </div>
                
                <Link
                  href="/search"
                  className="btn btn-primary w-full"
                >
                  Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>      

      {/* Procedure Categories */}
      <div className="container py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Browse by Category
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Diagnostic Imaging */}
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <Link href="/search?category=imaging" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                  Browse 48 procedures <span aria-hidden="true" className="ml-1">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Preventive Care */}
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Preventive Care</h3>
                  <p className="text-sm text-gray-500">Screenings, Vaccinations, Physicals</p>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/search?category=preventive" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                  Browse 36 procedures <span aria-hidden="true" className="ml-1">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Laboratory */}
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Laboratory</h3>
                  <p className="text-sm text-gray-500">Blood tests, Panels, Pathology</p>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/search?category=lab" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                  Browse 52 procedures <span aria-hidden="true" className="ml-1">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-primary-50 py-16">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              How Medixpense Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Bringing transparency to healthcare costs in three simple steps
            </p>
          </div>
          
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="card">
              <div className="p-6 text-center">
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Search</h3>
                <p className="mt-4 text-gray-600">
                  Find a procedure by name, category, or description. Specify your location for relevant results.
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="card">
              <div className="p-6 text-center">
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Compare</h3>
                <p className="mt-4 text-gray-600">
                  View and compare prices from different providers in your area with detailed information.
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="card">
              <div className="p-6 text-center">
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Choose</h3>
                <p className="mt-4 text-gray-600">
                  Make an informed decision based on price, location, and provider information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Registration CTA */}
      <div className="bg-white py-12 border-t border-gray-200">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <p className="text-lg text-gray-700 mb-4 md:mb-0">
              Join our network and reach more patients.
            </p>
            <div className="flex gap-4">
              <Link href="/register" className="btn btn-primary">
                Register Now
              </Link>
              <Link href="/about" className="btn btn-outline">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
