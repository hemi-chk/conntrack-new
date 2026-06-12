import { BASE_URL } from './api';

export const getDashboardStats = async () => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/dashboard-stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};