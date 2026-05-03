import { useState, useEffect, useCallback } from 'react';
import { getSupplierProfile } from '../services/profileService';

export const useProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // NOTE: TO CHANGE THE LOGGED-IN SUPPLIER ID FOR TESTING:
  // Change the value of 'CURRENT_SUPPLIER_ID' below.
  const CURRENT_SUPPLIER_ID = 1;

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSupplierProfile(CURRENT_SUPPLIER_ID);
      setProfileData(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profileData, isLoading, error, refreshProfile: fetchProfile };
};