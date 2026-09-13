import { useState, useEffect, useCallback } from 'react';
import { getVehicles } from '../services/vehicleService';
import { useProfile } from './useProfile';

export const useVehicles = () => {
  const { profileData, isLoading: profileLoading, error: profileError } = useProfile();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVehiclesList = useCallback(async () => {
    // Wait for profile data if it's still loading to ensure we get the supplier_id
    if (profileLoading) return;

    // Profile finished loading but failed - stop waiting instead of
    // spinning forever, and surface why.
    if (!profileData) {
      setIsLoading(false);
      setError(profileError || 'Failed to load supplier profile');
      return;
    }

    try {
      setIsLoading(true);
      const supplierId = profileData.id || profileData.supplier_id;
      const data = await getVehicles(supplierId);
      const vehicleArray = Array.isArray(data) ? data : (data?.data || []);
      setVehicles(vehicleArray);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setIsLoading(false);
    }
  }, [profileData, profileLoading, profileError]);

  useEffect(() => {
    fetchVehiclesList();
  }, [fetchVehiclesList]);

  return { vehicles, isLoading, error, refreshVehicles: fetchVehiclesList };
};