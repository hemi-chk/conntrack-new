import React from 'react';

export const DeleteVehicleModal = ({ isOpen, onClose, vehicle, onDeleteConfirm }) => {
  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-error px-6 py-4 text-white">
          <h2 className="text-lg font-bold">Delete Vehicle</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-dark text-base leading-relaxed">
            Are you sure you want to delete vehicle <span className="font-bold">{vehicle.vehicle_number}</span>?
          </p>
          <p className="text-gray-500 text-sm mt-3 bg-red-50 p-3 rounded-lg border border-red-100 italic">
            This action cannot be undone. All history associated with this vehicle will be removed.
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onDeleteConfirm(vehicle.vehicle_number)}
            className="flex-1 px-4 py-2.5 bg-error hover:bg-red-800 text-white rounded-lg font-semibold transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
};
