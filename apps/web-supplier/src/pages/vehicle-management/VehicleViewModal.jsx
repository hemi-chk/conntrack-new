import React from 'react';
import { X } from 'lucide-react';

export const VehicleViewModal = ({ isOpen, onClose, vehicle, onEdit, onDelete }) => {
  if (!isOpen || !vehicle) return null;

  // Logic to determine insurance valid status automatically
  const isInsuranceValid = vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry) > new Date() : false;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="overflow-hidden w-full max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-2xl duration-200 animate-in fade-in zoom-in">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 text-white bg-primary">
          <div>
            <h2 className="text-xl font-bold">{vehicle.vehicle_number}</h2>
            <p className="text-blue-100 text-xs mt-0.5">Vehicle Details Overview</p>
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
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Vehicle Number</p>
                <p className="text-base font-bold text-dark">{vehicle.vehicle_number}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Vehicle Type</p>
                <p className="text-sm font-medium capitalize text-dark">{vehicle.vehicle_type || vehicle.type || 'N/A'}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Model</p>
                <p className="text-sm italic text-gray-500">Not specified</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Insurance Expiry</p>
                <p className="text-sm font-medium text-dark">
                  {vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString('en-GB') : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Port Pass</p>
                <p className="text-sm font-medium text-dark">
                  {vehicle.port_pass_expiry ? new Date(vehicle.port_pass_expiry).toLocaleDateString('en-GB') : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Status</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                  ${(vehicle.availability_status || vehicle.status)?.toLowerCase() === 'active' ? 'bg-success/10 text-success' :
                    (vehicle.availability_status || vehicle.status)?.toLowerCase() === 'repair' ? 'bg-error/10 text-error' :
                      'bg-warning/10 text-warning'}
                `}>
                  {vehicle.availability_status || vehicle.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Status Badges Row */}
          <div className="grid grid-cols-3 gap-3 pt-6 mt-8 border-t border-gray-100">
            <div className="flex flex-col items-center p-3 rounded-lg border border-gray-100 bg-surface-light">
              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Insurance Status</p>
              <span className={`text-xs font-bold ${isInsuranceValid ? 'text-success' : 'text-error'}`}>
                {isInsuranceValid ? 'Valid' : 'Expired'}
              </span>
            </div>

            <div className="flex flex-col items-center p-3 rounded-lg border border-gray-100 bg-surface-light">
              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Current Status</p>
              <span className="text-xs font-bold text-primary">
                {vehicle.availability_status || 'Active'}
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
              onClick={() => onEdit(vehicle)}
              className="flex-1 px-4 py-2 text-sm font-semibold bg-white rounded-lg border transition-colors border-primary text-primary hover:bg-blue-50"
            >
              Edit Vehicle
            </button>
            <button
              onClick={() => onDelete(vehicle)}
              className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-error/10 text-error hover:bg-error/20"
            >
              Remove Vehicle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
