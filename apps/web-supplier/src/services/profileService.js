import { BASE_URL } from './api';

// This path segment is ignored by the backend (resolveSupplierId
// middleware derives the caller's own supplier_id from their auth token),
// but the route is still shaped as /supplier/:id/... so something has to
// go there.
const SELF = 'me';

export const getSupplierProfile = async () => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/${SELF}`);
    if (!res.ok) throw new Error('Unable to load supplier profile details.');
    return await res.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const updateSupplierLogo = async (file) => {
  try {
    const formData = new FormData();
    formData.append('logo', file);

    const res = await fetch(`${BASE_URL}/supplier/${SELF}/logo`, {
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

