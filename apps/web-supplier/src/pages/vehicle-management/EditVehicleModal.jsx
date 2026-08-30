import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { uploadFile } from '../../services/api';

const inputCls = "w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white";
const labelCls = "block mb-0.5 text-xs font-semibold text-gray-600";

export const EditVehicleModal = ({ isOpen, onClose, vehicle, onUpdate }) => {
  const { profileData } = useProfile();
  const [formData, setFormData] = useState({
    vehicle_number: '',
    type: 'LCV',
    condition_status: 'good',
    availability_status: 'available',
    condition_status: 'good',
    insurance_expiry: '',
    port_pass_expiry: '',
    insurance_file: null,
    port_pass_file: null
  });
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [portPassFile, setPortPassFile] = useState(null);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicle_number: vehicle.vehicle_number || '',
        type: vehicle.vehicle_type || vehicle.type || 'LCV',
        condition_status: vehicle.condition_status || 'good',
        availability_status: vehicle.availability_status || vehicle.status || 'available',
        condition_status: vehicle.condition_status || 'good',
        insurance_expiry: vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toISOString().split('T')[0] : '',
        port_pass_expiry: vehicle.port_pass_expiry ? new Date(vehicle.port_pass_expiry).toISOString().split('T')[0] : '',
        insurance_file: null,
        port_pass_file: null
      });
      setInsuranceFile(null);
      setPortPassFile(null);
    }
  }, [vehicle, isOpen]);

  if (!isOpen || !vehicle) return null;

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = () => {
    const { vehicle_number, type, condition_status, availability_status, insurance_expiry, port_pass_expiry } = formData;

    if (!vehicle_number || !type || !condition_status || !availability_status || !insurance_expiry || !port_pass_expiry) {
      return 'All fields are required. Please fill in every field.';
    }

    const vehicleNoRegex = /^[A-Z]{3}-[0-9]{4}$/;
    if (!vehicleNoRegex.test(vehicle_number)) {
      return "Vehicle Number must be in 'CAB-1234' format (3 capital letters, dash, 4 numbers).";
    }

    if (insurance_expiry < today) {
      return "Insurance Expiry cannot be a past date.";
    }

    if (port_pass_expiry < today) {
      return "Port Pass Expiry cannot be a past date.";
    }

    return null;
  };

  const handleUpdate = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    try {
      setIsUploading(true);

      const tryUpload = async (file, folder) => {
        if (!(file instanceof File)) return null;
        return uploadFile('vehicle-documents', file, folder);
      };

      const [insuranceUrl, portPassUrl] = await Promise.all([
        tryUpload(insuranceFile, 'insurance'),
        tryUpload(portPassFile, 'port-passes')
      ]);

      await onUpdate(vehicle.vehicle_number, {
        ...formData,
        supplier_id: profileData?.id || profileData?.supplier_id,
        Vehicle_Insurance_Copy: insuranceUrl || vehicle.Vehicle_Insurance_Copy,
        Vehicle_Port_Pass_Copy: portPassUrl || vehicle.Vehicle_Port_Pass_Copy
      });
    } catch (err) {
      setError(err.message || 'Failed to update vehicle');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-gray-100 shadow-2xl duration-200 animate-in fade-in zoom-in overflow-hidden">

        {/* Header */}
        <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
          <div>
            <h2 className="text-lg font-bold leading-tight">Edit Vehicle</h2>
            <p className="text-blue-100 text-[10px] opacity-80 mt-0.5">All fields are required. Updating: {vehicle.vehicle_number}</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-y-3 gap-x-4">

            {/* Row 1: Identity & Type */}
            <div>
              <label className={labelCls}>Vehicle Number *</label>
              <input type="text" name="vehicle_number" value={formData.vehicle_number} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Vehicle Type *</label>
              <select name="type" value={formData.type} onChange={handleChange} className={inputCls}>
                <option value="LCV">LCV</option>
                <option value="HCV">HCV</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Condition Status *</label>
              <select name="condition_status" value={formData.condition_status} onChange={handleChange} className={inputCls}>
                <option value="good">good</option>
                <option value="maintenance">maintenance</option>
                <option value="out_of_service">out_of_service</option>
              </select>
            </div>

            {/* Row 2: Status & Documents */}
            <div>
              <label className={labelCls}>Availability Status *</label>
              <select name="availability_status" value={formData.availability_status} onChange={handleChange} className={inputCls}>
                <option value="available">available</option>
                <option value="on_trip">on_trip</option>
                <option value="unavailable">unavailable</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Insurance Expiry *</label>
              <input type="date" name="insurance_expiry" min={today} value={formData.insurance_expiry} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Port Pass Expiry *</label>
              <input type="date" name="port_pass_expiry" min={today} value={formData.port_pass_expiry} onChange={handleChange} className={inputCls} />
            </div>

            {/* Row 3: File Uploads */}
            <div>
              <label className={labelCls}>Insurance Copy</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setInsuranceFile(e.target.files[0])}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Port Pass Copy</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setPortPassFile(e.target.files[0])}
                className={inputCls}
              />
            </div>

          </div>

          {/* Error */}
          {error && (
            <div className="flex gap-2 items-center px-3 py-2 mt-3 text-xs font-medium text-red-600 bg-red-50 rounded-lg border border-red-100">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-3 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white rounded-lg border border-gray-300 transition-colors hover:bg-gray-50">
            Cancel
          </button>
          <button 
            onClick={handleUpdate}
            disabled={isUploading}
            className="flex gap-2 items-center px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors bg-primary hover:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUploading && <Loader2 size={16} className="animate-spin" />}
            {isUploading ? 'Uploading...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};
