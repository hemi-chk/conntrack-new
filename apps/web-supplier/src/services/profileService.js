import { BASE_URL } from './api';

export const getSupplierProfile = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/${id}`);
    if (!res.ok) throw new Error('Failed to fetch supplier profile');
    return await res.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};
