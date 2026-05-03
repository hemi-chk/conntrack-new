import React from 'react';
import { X } from 'lucide-react';

export const DriverViewModal = ({ isOpen, onClose, driver, onEdit, onDelete }) => {
  if (!isOpen || !driver) return null;

  // Logic to determine license valid status automatically
  const isLicenseValid = driver.license_expiry_date ? new Date(driver.license_expiry_date) > new Date() : false;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="overflow-hidden w-full max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-2xl duration-200 animate-in fade-in zoom-in">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 text-white bg-primary">
          <div>
            <h2 className="text-xl font-bold">{driver.first_name} {driver.last_name}</h2>
            <p className="text-blue-100 text-xs mt-0.5">Driver Profile Overview</p>
          </div>
          <button onClick={onClose} className="transition-colors text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-8 md:grid-cols-2">

            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Driver ID</p>
                <p className="text-base font-bold text-dark">{driver.driver_id}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">NIC Number</p>
                <p className="text-sm font-medium text-dark">{driver.nic}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Experience</p>
                <p className="text-sm italic text-gray-500">Not specified</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">License Expiry</p>
                <p className="text-sm font-medium text-dark">
                  {driver.license_expiry_date ? new Date(driver.license_expiry_date).toLocaleDateString('en-GB') : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Contact Number</p>
                <p className="text-sm font-medium text-dark">{driver.contact_number}</p>
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
          <div className="grid grid-cols-3 gap-3 pt-6 mt-8 border-t border-gray-100">
            <div className="flex flex-col items-center p-3 rounded-lg border border-gray-100 bg-surface-light">
              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">License Status</p>
              <span className={`text-xs font-bold ${isLicenseValid ? 'text-success' : 'text-error'}`}>
                {isLicenseValid ? 'Valid' : 'Expired'}
              </span>
            </div>

            <div className="flex flex-col items-center p-3 rounded-lg border border-gray-100 bg-surface-light">
              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Current Status</p>
              <span className="text-xs font-bold text-primary">
                {driver.availability_status || 'Available'}
              </span>
            </div>

            <div className="flex flex-col items-center p-3 rounded-lg border border-gray-100 bg-surface-light">
              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Compliance</p>
              <span className="text-xs font-bold text-success">Passed</span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col gap-2 px-6 py-4 bg-gray-50 sm:flex-row">
          <button
            onClick={onClose}
            className="flex-1 order-3 px-4 py-2 text-sm font-semibold text-gray-700 bg-white rounded-lg border border-gray-300 transition-colors hover:bg-gray-50 sm:order-1"
          >
            Back
          </button>
          <div className="flex flex-[2] gap-2 order-1 sm:order-2">
            <button
              onClick={() => onEdit(driver)}
              className="flex-1 px-4 py-2 text-sm font-semibold bg-white rounded-lg border transition-colors border-primary text-primary hover:bg-blue-50"
            >
              Edit Driver
            </button>
            <button
              onClick={() => onDelete(driver)}
              className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-error/10 text-error hover:bg-error/20"
            >
              Remove Driver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
