import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/supplierService';

export const useDashboard = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  return { stats };
};