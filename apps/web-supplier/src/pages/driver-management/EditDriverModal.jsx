import React, { useState, useEffect } from 'react';

export const EditDriverModal = ({ isOpen, onClose, driver, onUpdate }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    nic: '',
    license_expiry_date: '',
    availability_status: 'Available',
    contact_number: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (driver) {
      setFormData({
        first_name: driver.first_name || '',
        last_name: driver.last_name || '',
        nic: driver.nic || '',
        license_expiry_date: driver.license_expiry_date ? new Date(driver.license_expiry_date).toISOString().split('T')[0] : '',
        availability_status: driver.availability_status || 'Available',
        contact_number: driver.contact_number || ''
      });
    }
  }, [driver, isOpen]);

  if (!isOpen || !driver) return null;

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleUpdate = () => {
    if (!formData.first_name || !formData.last_name || !formData.nic || !formData.license_expiry_date || !formData.contact_number) {
        setError("Please fill out all required details.");
        return;
    }

    const nicRegex = /^[0-9]{12}$/;
    if (!nicRegex.test(formData.nic)) {
        setError("NIC must be exactly 12 numbers.");
        return;
    }

    const contactRegex = /^0[0-9]{9}$/;
    if (!contactRegex.test(formData.contact_number)) {
        setError("Contact Number must be 10 digits and start with 0.");
        return;
    }

    onUpdate(driver.driver_id, formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        
        {/* Left side: Form Inputs */}
        <div className="flex-1 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-dark">Edit Driver</h2>
            <p className="text-sm text-primary font-medium mt-1">Updating ID: {driver.driver_id}</p>
          </div>

          <div className="space-y-5">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">NIC *</label>
                <input 
                  type="text" 
                  name="nic" 
                  value={formData.nic} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry *</label>
                <input 
                  type="date" 
                  name="license_expiry_date" 
                  value={formData.license_expiry_date} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                <input 
                  type="text" 
                  name="contact_number" 
                  value={formData.contact_number} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
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
            </div>
            
            {error && (
               <div className="text-error text-sm font-medium bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2">
                 <span>⚠️</span> {error}
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
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Original Name:</p>
                <p className="text-sm font-medium text-gray-600 mb-1">{driver.first_name} {driver.last_name}</p>
                <p className="text-[10px] text-primary uppercase tracking-wider font-bold">New Name:</p>
                <p className="text-sm font-bold text-dark">{formData.first_name} {formData.last_name}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Original Contact:</p>
                <p className="text-sm font-medium text-gray-600 mb-1">{driver.contact_number}</p>
                <p className="text-[10px] text-primary uppercase tracking-wider font-bold">New Contact:</p>
                <p className="text-sm font-bold text-dark">{formData.contact_number || '-'}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Original Status:</p>
                <p className="text-sm font-medium text-gray-600 mb-1">{driver.availability_status}</p>
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
              onClick={handleUpdate}
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
