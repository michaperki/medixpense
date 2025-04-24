import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';

const SettingsForm = ({ initialData, activeTab, onSubmit, isLoading }) => {
  const { user } = useAuth();
  // Initialize with empty object to avoid null values
  const [formData, setFormData] = useState({});
  
  // Set up form data based on active tab
  useEffect(() => {
    const defaultValues = {
      general: {
        language: 'en',
        timeZone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 30,
      },
      billing: {
        subscriptionPlan: user?.provider?.subscriptionTier || 'FREE',
        autoRenew: true,
      }
    };
    
    if (initialData && initialData[activeTab]) {
      // Use initialData if available, but make sure we have defaults for missing properties
      setFormData({
        ...defaultValues[activeTab],
        ...initialData[activeTab]
      });
    } else {
      // Use defaults if no data is available
      setFormData(defaultValues[activeTab] || {});
    }
  }, [activeTab, initialData, user]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, settingsType: activeTab });
  };
  
  // Safe access to form values - return empty string for undefined/null values
  const getValue = (field, defaultValue = '') => {
    return formData[field] !== undefined && formData[field] !== null 
      ? formData[field] 
      : defaultValue;
  };
  
  // Safe access to checkbox values
  const getChecked = (field, defaultValue = false) => {
    return formData[field] !== undefined && formData[field] !== null 
      ? formData[field] 
      : defaultValue;
  };
  
  // Render different forms based on active tab
  const renderForm = () => {
    switch (activeTab) {
      case 'general':
        return (
          <>
            <div className="space-y-6">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={getValue('language', 'en')}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700">
                  Time Zone
                </label>
                <select
                  id="timeZone"
                  name="timeZone"
                  value={getValue('timeZone', 'UTC')}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time (ET)</option>
                  <option value="CST">Central Time (CT)</option>
                  <option value="MST">Mountain Time (MT)</option>
                  <option value="PST">Pacific Time (PT)</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700">
                  Date Format
                </label>
                <select
                  id="dateFormat"
                  name="dateFormat"
                  value={getValue('dateFormat', 'MM/DD/YYYY')}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </>
        );
        
      case 'notifications':
        return (
          <>
            <div className="space-y-6">
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="emailNotifications"
                    name="emailNotifications"
                    type="checkbox"
                    checked={getChecked('emailNotifications', true)}
                    onChange={handleChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                    Email Notifications
                  </label>
                  <p className="text-gray-500">Receive email notifications for important updates.</p>
                </div>
              </div>
              
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="smsNotifications"
                    name="smsNotifications"
                    type="checkbox"
                    checked={getChecked('smsNotifications', false)}
                    onChange={handleChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="smsNotifications" className="font-medium text-gray-700">
                    SMS Notifications
                  </label>
                  <p className="text-gray-500">Receive text message notifications.</p>
                </div>
              </div>
              
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="marketingEmails"
                    name="marketingEmails"
                    type="checkbox"
                    checked={getChecked('marketingEmails', false)}
                    onChange={handleChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="marketingEmails" className="font-medium text-gray-700">
                    Marketing Emails
                  </label>
                  <p className="text-gray-500">Receive updates on new features and offerings.</p>
                </div>
              </div>
            </div>
          </>
        );
        
      case 'security':
        return (
          <>
            <div className="space-y-6">
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="twoFactorEnabled"
                    name="twoFactorEnabled"
                    type="checkbox"
                    checked={getChecked('twoFactorEnabled', false)}
                    onChange={handleChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="twoFactorEnabled" className="font-medium text-gray-700">
                    Two-Factor Authentication
                  </label>
                  <p className="text-gray-500">Add an extra layer of security to your account.</p>
                </div>
              </div>
              
              <div>
                <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
                  Session Timeout (minutes)
                </label>
                <select
                  id="sessionTimeout"
                  name="sessionTimeout"
                  value={getValue('sessionTimeout', '30')}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      value={getValue('currentPassword', '')}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      value={getValue('newPassword', '')}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      value={getValue('confirmPassword', '')}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        );
        
      case 'billing':
        return (
          <>
            <div className="space-y-6">
              <div>
                <label htmlFor="subscriptionPlan" className="block text-sm font-medium text-gray-700">
                  Current Plan
                </label>
                <select
                  id="subscriptionPlan"
                  name="subscriptionPlan"
                  value={getValue('subscriptionPlan', 'FREE')}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  disabled={true} // Can't change plan directly here
                >
                  <option value="FREE">Free</option>
                  <option value="BASIC">Basic</option>
                  <option value="PRO">Professional</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  To upgrade your plan, visit the billing portal.
                </p>
              </div>
              
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="autoRenew"
                    name="autoRenew"
                    type="checkbox"
                    checked={getChecked('autoRenew', true)}
                    onChange={handleChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="autoRenew" className="font-medium text-gray-700">
                    Auto-renew Subscription
                  </label>
                  <p className="text-gray-500">
                    Automatically renew your subscription at the end of the billing period.
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your payment methods in the billing portal.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Billing Portal
                  </button>
                </div>
              </div>
            </div>
          </>
        );
        
      default:
        return <p>Select a tab to view settings</p>;
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {renderForm()}
      
      <div className="pt-5 border-t border-gray-200">
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SettingsForm;
