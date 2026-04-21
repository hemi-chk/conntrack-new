import { useState, useEffect, useCallback } from 'react';
import { getVehicles } from '../services/vehicleService';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVehiclesList = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getVehicles();
      const vehicleArray = Array.isArray(data) ? data : (data?.data || []);
      setVehicles(vehicleArray);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehiclesList();
  }, [fetchVehiclesList]);

  return { vehicles, isLoading, error, refreshVehicles: fetchVehiclesList };
};