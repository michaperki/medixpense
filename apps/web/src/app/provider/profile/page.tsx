
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { getLogger, LogContext } from "@/lib/logger";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import ProfileForm from "@/components/profile/ProfileForm";
import { profileApi } from "@/services/profileService";
import { useToast } from "@/hooks/useToast";
import { handleApiError } from "@/lib/api/handleApiError"; // Import centralized error handler

// Create a profile-specific logger
const profileLogger = getLogger(LogContext.RENDER);

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  // Log page initialization
  useEffect(() => {
    profileLogger.info('Profile page initialized');
    
    return () => {
      profileLogger.debug('Profile page unmounted');
    };
  }, []);

  // Handle authentication and load profile
  useEffect(() => {
    profileLogger.debug('Auth state changed', { 
      isLoading: authLoading, 
      isAuthenticated: !!user,
      userId: user?.id
    });

    if (authLoading) return;
    
    if (!user) {
      profileLogger.info('Unauthenticated user, redirecting to login', {
        redirectTarget: '/provider/profile'
      });
      router.push("/login?redirect=/provider/profile");
      return;
    }
    
    loadProfile();
  }, [user, authLoading, router]);

  // Load profile data with logger
  const loadProfile = async () => {
    profileLogger.info('Loading provider profile');
    
    try {
      setLoading(true);
      
      // Use time tracking for performance monitoring
      const data = await profileLogger.time('Fetch provider profile', async () => {
        return profileApi.getProviderProfile();
      });
      
      profileLogger.debug('Profile loaded successfully', {
        profileFields: Object.keys(data || {}),
        hasProfileData: !!data
      });
      
      setProfile(data);
      setError(null);
    } catch (err) {
      handleApiError(err, 'loadProfile'); // Centralized error handling
      setError(err.message || "Failed to load profile data");
      showToast({
        type: "error",
        message: "Failed to load profile data",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle profile update with logger
  const handleSubmit = async (formData) => {
    profileLogger.info('Submitting profile update', { 
      formFields: Object.keys(formData)
    });
    
    try {
      setLoading(true);
      
      // Track performance of profile update
      const updatedProfile = await profileLogger.time('Update provider profile', async () => {
        return profileApi.updateProviderProfile(formData);
      });
      
      profileLogger.debug('Profile updated successfully', {
        updatedFields: Object.keys(updatedProfile || {})
      });
      
      setProfile(updatedProfile);
      showToast({
        type: "success",
        message: "Profile updated successfully",
      });
    } catch (err) {
      handleApiError(err, 'handleSubmit'); // Centralized error handling
      setError(err.message || "Failed to update profile");
      showToast({
        type: "error",
        message: "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  // Log rendering state
  useEffect(() => {
    if (!authLoading) {
      profileLogger.debug('Profile page render state', {
        isLoading: loading,
        hasError: !!error,
        hasProfileData: !!profile
      });
    }
  }, [loading, error, profile, authLoading]);
  
  if (authLoading || loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Provider Profile</h1>
        
        {error && <ErrorAlert message={error} className="mt-4" />}
        
        <div className="mt-6">
          <ProfileForm 
            initialData={profile} 
            onSubmit={handleSubmit} 
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  );
}

