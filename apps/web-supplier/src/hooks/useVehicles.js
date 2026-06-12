import { useState, useEffect, useCallback } from 'react';
import { getVehicles } from '../services/vehicleService';
import { useProfile } from './useProfile';

export const useVehicles = () => {
  const { profileData } = useProfile();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVehiclesList = useCallback(async () => {
    // Wait for profile data if it's still loading to ensure we get the supplier_id
    if (!profileData) return;

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
  }, [profileData]);

  useEffect(() => {
    fetchVehiclesList();
  }, [fetchVehiclesList]);

  return { vehicles, isLoading, error, refreshVehicles: fetchVehiclesList };
};