import { BASE_URL } from './api';

export const getDrivers = async (supplierId) => {
  try {
    const url = supplierId ? `${BASE_URL}/supplier/drivers?supplier_id=${supplierId}` : `${BASE_URL}/supplier/drivers`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Failed to fetch drivers');
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching drivers:", error);
    throw error;
  }
};

export const addDriver = async (driverData) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(driverData)
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add driver');
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error adding driver:", error);
    throw error;
  }
};

export const updateDriver = async (id, driverData) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/drivers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(driverData)
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update driver');
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error updating driver:", error);
    throw error;
  }
};

export const deleteDriver = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/drivers/${id}`, {
      method: 'DELETE',
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete driver');
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error deleting driver:", error);
    throw error;
  }
};