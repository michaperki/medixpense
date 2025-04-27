// New file: apps/web/src/hooks/useLocationForm.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function useLocationForm(locationId) {
  const { token } = useAuth();
  const isEditMode = !!locationId;
  
  const [formData, setFormData] = useState({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    isActive: true
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      const fetchLocation = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/locations/${locationId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          const { location } = response.data;
          setFormData({
            name: location.name,
            address1: location.address1,
            address2: location.address2 || '',
            city: location.city,
            state: location.state,
            zipCode: location.zipCode,
            phone: location.phone || '',
            isActive: location.isActive
          });
          setError(null);
        } catch (err) {
          console.error('Error fetching location:', err);
          setError('Failed to load location details. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      fetchLocation();
    }
  }, [locationId, token, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Location name is required';
    if (!formData.address1.trim()) errors.address1 = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state) errors.state = 'State is required';
    
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(formData.zipCode)) errors.zipCode = 'Please enter a valid ZIP code (12345 or 12345-6789)';
    
    if (formData.phone) {
      const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      if (!phoneRegex.test(formData.phone)) errors.phone = 'Please enter a valid phone number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveLocation = async (navigate) => {
    if (!validateForm()) {
      return false;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (isEditMode) {
        await axios.put(`/api/locations/${locationId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post('/api/locations', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error saving location:', err);
      if (err.response?.data?.errors) {
        // Handle validation errors from server
        const serverErrors = {};
        err.response.data.errors.forEach(error => {
          serverErrors[error.param] = error.msg;
        });
        setValidationErrors(serverErrors);
      } else {
        setError('Failed to save location. Please try again.');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    loading,
    submitting,
    error,
    validationErrors,
    handleChange,
    saveLocation,
    isEditMode
  };
}
