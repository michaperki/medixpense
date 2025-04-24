"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import ProfileForm from "@/components/profile/ProfileForm";
import { profileApi } from "@/services/profileService";
import { useToast } from "@/hooks/useToast";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push("/login?redirect=/provider/profile");
      return;
    }
    
    async function loadProfile() {
      try {
        setLoading(true);
        const data = await profileApi.getProviderProfile();
        setProfile(data);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError(err.message || "Failed to load profile data");
        showToast({
          type: "error",
          message: "Failed to load profile data",
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [user, authLoading, router, showToast]);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      const updatedProfile = await profileApi.updateProviderProfile(formData);
      setProfile(updatedProfile);
      showToast({
        type: "success",
        message: "Profile updated successfully",
      });
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
      showToast({
        type: "error",
        message: "Failed to update profile",
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
