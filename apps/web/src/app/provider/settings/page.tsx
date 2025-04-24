"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import SettingsForm from "@/components/settings/SettingsForm";
import { settingsApi } from "@/services/settingsService";
import { useToast } from "@/hooks/useToast";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});

  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push("/login?redirect=/provider/settings");
      return;
    }
    
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await settingsApi.getProviderSettings();
        setSettings(data);
      } catch (err) {
        console.error("Error loading settings:", err);
        setError(err.message || "Failed to load settings data");
        showToast({
          type: "error",
          message: "Failed to load settings data",
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadSettings();
  }, [user, authLoading, router, showToast]);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      const updatedSettings = await settingsApi.updateProviderSettings({
        ...formData,
        settingsType: activeTab
      });
      setSettings(updatedSettings);
      showToast({
        type: "success",
        message: "Settings updated successfully",
      });
    } catch (err) {
      console.error("Error updating settings:", err);
      setError(err.message || "Failed to update settings");
      showToast({
        type: "error",
        message: "Failed to update settings",
      });
    } finally {
      setLoading(false);
    }
  };

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
                onClick={() => setActiveTab(tab)}
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
