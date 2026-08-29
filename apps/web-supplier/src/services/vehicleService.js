import { BASE_URL } from './api';

const hasFiles = (vehicleData) => Boolean(vehicleData.insurance_file || vehicleData.port_pass_file);

const buildVehicleFormData = (vehicleData) => {
  const formData = new FormData();
  Object.entries(vehicleData).forEach(([key, value]) => {
    if (key === 'insurance_file' || key === 'port_pass_file') return;
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  if (vehicleData.insurance_file) formData.append('insurance', vehicleData.insurance_file);
  if (vehicleData.port_pass_file) formData.append('port_pass', vehicleData.port_pass_file);
  return formData;
};

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
    const res = await fetch(`${BASE_URL}/supplier/vehicles`, {
      method: 'POST',
      ...(hasFiles(vehicleData)
        ? { body: buildVehicleFormData(vehicleData) }
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vehicleData) })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add vehicle');
    }

    return await res.json();
  } catch (error) {
    console.error("Service: Fetch exception:", error);
    throw error;
  }
};

export const updateVehicle = async (id, vehicleData) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/vehicles/${id}`, {
      method: 'PUT',
      ...(hasFiles(vehicleData)
        ? { body: buildVehicleFormData(vehicleData) }
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vehicleData) })
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