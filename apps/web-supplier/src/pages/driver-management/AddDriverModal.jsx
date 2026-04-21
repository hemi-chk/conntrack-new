import React, { useState } from 'react';

export const AddDriverModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    driver_id: '',
    first_name: '',
    last_name: '',
    nic: '',
    license_expiry_date: '',
    availability_status: 'Available',
    contact_number: ''
  });

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleAdd = () => {
    // 1. Strict Validation
    if (!formData.driver_id || !formData.first_name || !formData.last_name || !formData.nic || !formData.license_expiry_date || !formData.contact_number) {
        setError("Please fill out all required details before adding the driver.");
        return;
    }

    // 2. Format Validation: DRI1234
    const driverIdRegex = /^DRI[0-9]{4}$/;
    if (!driverIdRegex.test(formData.driver_id)) {
        setError("Driver ID must be in 'DRI1234' format (DRI followed by 4 numbers).");
        return;
    }

    // 3. NIC Validation: 12 numbers
    const nicRegex = /^[0-9]{12}$/;
    if (!nicRegex.test(formData.nic)) {
        setError("NIC must be exactly 12 numbers.");
        return;
    }

    // 4. Contact Validation: 10 numbers, starts with 0
    const contactRegex = /^0[0-9]{9}$/;
    if (!contactRegex.test(formData.contact_number)) {
        setError("Contact Number must be 10 digits and start with 0.");
        return;
    }

    // 5. Future dates for license
    const selectedLicense = new Date(formData.license_expiry_date).setHours(0,0,0,0);
    const todayDate = new Date().setHours(0,0,0,0);

    if (selectedLicense < todayDate) {
        setError("License Expiry cannot be a past date.");
        return;
    }
    
    onAdd(formData);
    
    setFormData({
      driver_id: '',
      first_name: '',
      last_name: '',
      nic: '',
      license_expiry_date: '',
      availability_status: 'Available',
      contact_number: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        
        <div className="flex-1 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-dark">Add New Driver</h2>
            <p className="text-sm text-gray-500 mt-1">Enter driver details and documentation</p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver ID *</label>
                <input 
                  type="text" 
                  name="driver_id" 
                  placeholder="e.g., DRI1234"
                  value={formData.driver_id} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIC *</label>
                <input 
                  type="text" 
                  name="nic" 
                  placeholder="12 digit number"
                  value={formData.nic} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input 
                  type="text" 
                  name="first_name" 
                  value={formData.first_name} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input 
                  type="text" 
                  name="last_name" 
                  value={formData.last_name} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry *</label>
                <input 
                  type="date" 
                  name="license_expiry_date" 
                  min={today}
                  value={formData.license_expiry_date} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                <input 
                  type="text" 
                  name="contact_number" 
                  placeholder="0771234567"
                  value={formData.contact_number} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status *</label>
              <select 
                name="availability_status" 
                value={formData.availability_status} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer bg-white"
              >
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Off Duty">Off Duty</option>
              </select>
            </div>
            
            {error && (
               <div className="text-error text-sm font-medium bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2">
                 <span>⚠️</span> {error}
               </div>
            )}
            
          </div>
        </div>

        <div className="w-full md:w-[320px] bg-surface-light border-t md:border-t-0 md:border-l border-gray-200 p-8 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg text-primary mb-6 border-b border-gray-200 pb-3">Summary</h3>
            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Driver Name:</p>
                <p className={`font-medium ${formData.first_name || formData.last_name ? 'text-dark' : 'text-gray-400'}`}>
                  {formData.first_name || formData.last_name ? `${formData.first_name} ${formData.last_name}` : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Driver ID:</p>
                <p className={`font-medium ${formData.driver_id ? 'text-dark' : 'text-gray-400'}`}>
                  {formData.driver_id || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">NIC:</p>
                <p className={`font-medium ${formData.nic ? 'text-dark' : 'text-gray-400'}`}>
                  {formData.nic || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">License Exp:</p>
                <p className={`font-medium ${formData.license_expiry_date ? 'text-dark' : 'text-gray-400'}`}>
                  {formData.license_expiry_date ? new Date(formData.license_expiry_date).toLocaleDateString('en-GB') : 'Not set'}
                </p>
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
              onClick={handleAdd}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              Add Driver
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
