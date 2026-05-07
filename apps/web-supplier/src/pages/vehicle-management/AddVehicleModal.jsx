import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';

const inputCls = "w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white";
const labelCls = "block mb-0.5 text-xs font-semibold text-gray-600";

const emptyForm = {
  vehicle_number: '',
  type: 'LCV',
  availability_status: 'available',
  condition_status: 'good',
  insurance_expiry: '',
  port_pass_expiry: ''
};

export const AddVehicleModal = ({ isOpen, onClose, onAdd }) => {
  const { profileData } = useProfile();
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = () => {
    const { vehicle_number, type, availability_status, condition_status, insurance_expiry, port_pass_expiry } = formData;

    if (!vehicle_number || !type || !availability_status || !condition_status || !insurance_expiry || !port_pass_expiry) {
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

  const handleAdd = () => {
    const err = validate();
    if (err) { setError(err); return; }

    onAdd({ 
      ...formData, 
      supplier_id: profileData?.id || profileData?.supplier_id 
    });
    setFormData(emptyForm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-gray-100 shadow-2xl animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-xl font-bold text-primary">Add New Vehicle</h2>
          <p className="text-xs text-primary/70 mt-0.5">All fields are required. Enter vehicle details and document expiry dates.</p>
        </div>

        {/* Form Body */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">

            {/* Row 1: Identity & Type */}
            <div>
              <label className={labelCls}>Vehicle Number *</label>
              <input type="text" name="vehicle_number" placeholder="ABC-1234" value={formData.vehicle_number} onChange={handleChange} className={inputCls} />
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

          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 text-red-600 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-100 flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition-colors">
            Cancel
          </button>
          <button onClick={handleAdd} className="px-5 py-2 text-sm bg-primary hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors shadow-sm">
            Add Vehicle
          </button>
        </div>

      </div>
    </div>
  );
};
