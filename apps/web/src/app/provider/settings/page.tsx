
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { getLogger, LogContext } from "@/lib/logger";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import SettingsForm from "@/components/settings/SettingsForm";
import { settingsApi } from "@/services/settingsService";
import { useToast } from "@/hooks/useToast";
import { handleApiError } from "@/lib/api/handleApiError";  // <-- Import handleApiError for consistent error handling

// Create a settings-specific logger
const settingsLogger = getLogger(LogContext.RENDER);

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // Log page initialization
  useEffect(() => {
    settingsLogger.info('Settings page initialized');
    
    return () => {
      settingsLogger.debug('Settings page unmounted');
    };
  }, []);

  // Handle authentication and load settings
  useEffect(() => {
    settingsLogger.debug('Auth state changed', { 
      isLoading: authLoading, 
      isAuthenticated: !!user,
      userId: user?.id
    });

    if (authLoading) return;
    
    if (!user) {
      settingsLogger.info('Unauthenticated user, redirecting to login', {
        redirectTarget: '/provider/settings'
      });
      router.push("/login?redirect=/provider/settings");
      return;
    }
    
    loadSettings();
  }, [user, authLoading, router]);

  // Load settings data with logger
  const loadSettings = async () => {
    settingsLogger.info('Loading provider settings');
    
    try {
      setLoading(true);
      
      // Use time tracking for performance monitoring
      const data = await settingsLogger.time('Fetch provider settings', async () => {
        return settingsApi.getProviderSettings();
      });
      
      settingsLogger.debug('Settings loaded successfully', {
        settingsKeys: Object.keys(data),
        hasData: Object.keys(data).length > 0
      });
      
      setSettings(data);
      setError(null);
    } catch (err) {
      handleApiError(err, 'loadSettings');  // Centralized error handling
      setError(err.message || "Failed to load settings data");
      showToast({
        type: "error",
        message: "Failed to load settings data",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle settings update with logger
  const handleSubmit = async (formData) => {
    settingsLogger.info('Submitting settings update', { 
      settingsType: activeTab,
      formFields: Object.keys(formData)
    });
    
    try {
      setLoading(true);
      
      // Track performance of settings update
      const updatedSettings = await settingsLogger.time('Update provider settings', async () => {
        return settingsApi.updateProviderSettings({
          ...formData,
          settingsType: activeTab
        });
      });
      
      settingsLogger.debug('Settings updated successfully', {
        settingsType: activeTab,
        updatedKeys: Object.keys(updatedSettings)
      });
      
      setSettings(updatedSettings);
      showToast({
        type: "success",
        message: "Settings updated successfully",
      });
    } catch (err) {
      handleApiError(err, 'handleSubmit');  // Centralized error handling
      setError(err.message || "Failed to update settings");
      showToast({
        type: "error",
        message: "Failed to update settings",
      });
    } finally {
      setLoading(false);
    }
  };

  // Log tab change
  const handleTabChange = (tab) => {
    settingsLogger.debug('Changed active settings tab', { 
      previousTab: activeTab, 
      newTab: tab 
    });
    
    setActiveTab(tab);
  };

  // Log rendering state
  useEffect(() => {
    if (!authLoading) {
      settingsLogger.debug('Settings page render state', {
        isLoading: loading,
        hasError: !!error,
        activeTab,
        hasSettings: Object.keys(settings).length > 0
      });
    }
  }, [loading, error, settings, activeTab, authLoading]);
  
  if (authLoading || loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Account Settings</h1>
        
        {error && <ErrorAlert message={error} className="mt-4" />}
        
        <div className="mt-6">
          <nav className="flex space-x-4 border-b border-gray-200 pb-4">
            {['general', 'notifications', 'security', 'billing'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-3 py-2 font-medium text-sm rounded-md ${
                  activeTab === tab
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
          
          <div className="mt-6">
            <SettingsForm 
              initialData={settings} 
              activeTab={activeTab}
              onSubmit={handleSubmit} 
              isLoading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

