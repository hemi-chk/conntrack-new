import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export const EditVehicleModal = ({ isOpen, onClose, vehicle, onUpdate }) => {
  const [formData, setFormData] = useState({
    vehicle_number: '',
    type: 'container',
    availability_status: 'Active',
    insurance_expiry: '',
    port_pass_expiry: ''
  });

  const [error, setError] = useState('');

  // Pre-fill form when vehicle changes or modal opens
  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicle_number: vehicle.vehicle_number || '',
        type: vehicle.vehicle_type || vehicle.type || 'container',
        availability_status: vehicle.availability_status || vehicle.status || 'Active',
        insurance_expiry: vehicle.insurance_expiry || '',
        port_pass_expiry: vehicle.port_pass_expiry || ''
      });
    }
  }, [vehicle, isOpen]);

  if (!isOpen || !vehicle) return null;

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSave = () => {
    // 1. Strict Validation: Ensure no field is empty
    if (!formData.vehicle_number || !formData.type || !formData.availability_status || !formData.insurance_expiry || !formData.port_pass_expiry) {
        setError("Please fill out all required details before saving.");
        return;
    }

    // 2. Format Validation: ABC-1234
    const vehicleNoRegex = /^[A-Z]{3}-[0-9]{4}$/;
    if (!vehicleNoRegex.test(formData.vehicle_number)) {
        setError("Vehicle Number must be in 'CAB-1234' format (3 capital letters, dash, 4 numbers).");
        return;
    }

    // 3. Strict Validation: Future dates only
    const selectedInsurance = new Date(formData.insurance_expiry).setHours(0,0,0,0);
    const selectedPortPass = new Date(formData.port_pass_expiry).setHours(0,0,0,0);
    const todayDate = new Date().setHours(0,0,0,0);

    if (selectedInsurance < todayDate) {
        setError("Insurance Expiry cannot be a past date.");
        return;
    }

    if (selectedPortPass < todayDate) {
        setError("Port Pass Expiry cannot be a past date.");
        return;
    }
    
    onUpdate(vehicle.vehicle_number, formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        
        {/* Left side: Form Inputs */}
        <div className="flex-1 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-dark">Edit Vehicle</h2>
            <p className="text-sm text-primary font-medium mt-1">Updating: {vehicle.vehicle_number}</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
              <input 
                type="text" 
                name="vehicle_number" 
                value={formData.vehicle_number} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type *</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer bg-white"
                >
                  <option value="container">Container Truck</option>
                  <option value="flatbed">Flatbed Truck</option>
                  <option value="refrigerated">Refrigerated Truck</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select 
                  name="availability_status" 
                  value={formData.availability_status} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Service">Service</option>
                  <option value="Repair">Repair</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry *</label>
                <input 
                  type="date" 
                  name="insurance_expiry" 
                  min={today}
                  value={formData.insurance_expiry} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-700"
                />
                <p className="text-xs text-warning mt-1.5 font-medium">Valid Insurance only</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port Pass *</label>
                <input 
                  type="date" 
                  name="port_pass_expiry" 
                  min={today}
                  value={formData.port_pass_expiry} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-700"
                />
                <p className="text-xs text-warning mt-1.5 font-medium">Valid Port Pass only</p>
              </div>
            </div>
            
            {error && (
               <div className="text-error text-sm font-medium bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2">
                 <AlertTriangle size={16} /> {error}
               </div>
            )}
            
          </div>
        </div>

        {/* Right side: Changes Preview Panel */}
        <div className="w-full md:w-[320px] bg-surface-light border-t md:border-t-0 md:border-l border-gray-200 p-8 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg text-primary mb-6 border-b border-gray-200 pb-3">Changes Preview</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Original Number:</p>
                <p className="text-sm font-medium text-gray-600 mb-1">{vehicle.vehicle_number}</p>
                <p className="text-[10px] text-primary uppercase tracking-wider font-bold">New Number:</p>
                <p className="text-sm font-bold text-dark">{formData.vehicle_number || '-'}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Original Insurance:</p>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString('en-GB') : '-'}
                </p>
                <p className="text-[10px] text-primary uppercase tracking-wider font-bold">New Insurance:</p>
                <p className="text-sm font-bold text-dark">
                  {formData.insurance_expiry ? new Date(formData.insurance_expiry).toLocaleDateString('en-GB') : '-'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Original Status:</p>
                <p className="text-sm font-medium text-gray-600 mb-1">{vehicle.availability_status || vehicle.status}</p>
                <p className="text-[10px] text-primary uppercase tracking-wider font-bold">New Status:</p>
                <p className="text-sm font-bold text-dark">{formData.availability_status}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-10">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
