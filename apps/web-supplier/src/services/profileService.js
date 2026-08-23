import { BASE_URL } from './api';

export const getSupplierProfile = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/${id}`);
    if (!res.ok) throw new Error('Unable to load supplier profile details.');
    return await res.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const updateSupplierLogo = async (id, file) => {
  try {
    const formData = new FormData();
    formData.append('logo', file);

    const res = await fetch(`${BASE_URL}/supplier/${id}/logo`, {
      method: 'PATCH',
      body: formData
    });
    if (!res.ok) throw new Error('Unable to update supplier logo.');
    return await res.json();
  } catch (error) {
    console.error('Error updating supplier logo:', error);
    throw error;
  }
};
