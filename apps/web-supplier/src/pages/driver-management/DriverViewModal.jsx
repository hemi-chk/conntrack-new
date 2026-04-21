import React from 'react';
import { X } from 'lucide-react';

export const DriverViewModal = ({ isOpen, onClose, driver, onEdit, onDelete }) => {
  if (!isOpen || !driver) return null;

  // Logic to determine license valid status automatically
  const isLicenseValid = driver.license_expiry_date ? new Date(driver.license_expiry_date) > new Date() : false;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-primary px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{driver.first_name} {driver.last_name}</h2>
            <p className="text-blue-100 text-xs mt-0.5">Driver Profile Overview</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Driver ID</p>
                <p className="text-dark font-bold text-base">{driver.driver_id}</p>
              </div>
              
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">NIC Number</p>
                <p className="text-dark font-medium text-sm">{driver.nic}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Experience</p>
                <p className="text-gray-500 italic text-sm">Not specified</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">License Expiry</p>
                <p className="text-dark font-medium text-sm">
                  {driver.license_expiry_date ? new Date(driver.license_expiry_date).toLocaleDateString('en-GB') : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Contact Number</p>
                <p className="text-dark font-medium text-sm">{driver.contact_number}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Status</p>
                <span 
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                    ${driver.availability_status?.toLowerCase() === 'available' ? 'bg-success/10 text-success' : 
                      driver.availability_status?.toLowerCase() === 'off duty' ? 'bg-error/10 text-error' : 
                      'bg-warning/10 text-warning'}
                  `}
                >
                  {driver.availability_status}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Status Badges Row (Bottom Tiles) */}
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-gray-100 pt-6">
            <div className="bg-surface-light p-3 rounded-lg border border-gray-100 flex flex-col items-center">
              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">License Status</p>
              <span className={`text-xs font-bold ${isLicenseValid ? 'text-success' : 'text-error'}`}>
                {isLicenseValid ? 'Valid' : 'Expired'}
              </span>
            </div>
            
            <div className="bg-surface-light p-3 rounded-lg border border-gray-100 flex flex-col items-center">
              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Current Status</p>
              <span className="text-xs font-bold text-primary">
                {driver.availability_status || 'Available'}
              </span>
            </div>

            <div className="bg-surface-light p-3 rounded-lg border border-gray-100 flex flex-col items-center">
              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Compliance</p>
              <span className="text-xs font-bold text-success">Passed</span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-2">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition-colors text-sm order-3 sm:order-1"
          >
            Back
          </button>
          <div className="flex flex-[2] gap-2 order-1 sm:order-2">
            <button 
              onClick={() => onEdit(driver)}
              className="flex-1 px-4 py-2 bg-white border border-primary text-primary hover:bg-blue-50 rounded-lg font-semibold transition-colors text-sm"
            >
              Edit Driver
            </button>
            <button 
              onClick={() => onDelete(driver)}
              className="flex-1 px-4 py-2 bg-error/10 text-error hover:bg-error/20 rounded-lg font-semibold transition-colors text-sm"
            >
              Delete Driver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
