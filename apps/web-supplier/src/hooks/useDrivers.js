import { useState, useEffect, useCallback } from 'react';
import { getDrivers } from '../services/driverService';
import { CURRENT_SUPPLIER_ID } from './useProfile';

export const useDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDriversList = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getDrivers(CURRENT_SUPPLIER_ID);
      const driverArray = Array.isArray(data) ? data : (data?.data || []);
      setDrivers(driverArray);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load drivers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDriversList();
  }, [fetchDriversList]);

  return { drivers, isLoading, error, refreshDrivers: fetchDriversList };
};