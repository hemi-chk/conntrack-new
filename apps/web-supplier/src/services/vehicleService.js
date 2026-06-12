import { BASE_URL } from './api';

export const getVehicles = async (supplierId) => {
  try {
    const url = supplierId 
      ? `${BASE_URL}/supplier/vehicles?supplier_id=${supplierId}`
      : `${BASE_URL}/supplier/vehicles`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Failed to fetch vehicles');
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    throw error;
  }
};

export const addVehicle = async (vehicleData) => {
  try {
    console.log("Service: Attempting to add vehicle...", vehicleData);
    console.log("Service: Target URL:", `${BASE_URL}/supplier/vehicles`);
    
    const res = await fetch(`${BASE_URL}/supplier/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData)
    });
    
    console.log("Service: Response status:", res.status);
    
    if (!res.ok) {
      const err = await res.json();
      console.error("Service: Error response from backend:", err);
      throw new Error(err.error || 'Failed to add vehicle');
    }
    
    const result = await res.json();
    console.log("Service: Success result:", result);
    return result;
  } catch (error) {
    console.error("Service: Fetch exception:", error);
    throw error;
  }
};

export const updateVehicle = async (id, vehicleData) => {
  try {
    console.log(`Service: Updating vehicle ${id}...`, vehicleData);
    const res = await fetch(`${BASE_URL}/supplier/vehicles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData)
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update vehicle');
    }
    
    return await res.json();
  } catch (error) {
    console.error("Service: Update exception:", error);
    throw error;
  }
};

export const deleteVehicle = async (id, supplierId) => {
  try {
    console.log(`Service: Deleting vehicle ${id}...`);
    const url = supplierId 
      ? `${BASE_URL}/supplier/vehicles/${id}?supplier_id=${supplierId}`
      : `${BASE_URL}/supplier/vehicles/${id}`;
    const res = await fetch(url, {
      method: 'DELETE',
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete vehicle');
    }
    
    return await res.json();
  } catch (error) {
    console.error("Service: Delete exception:", error);
    throw error;
  }
};