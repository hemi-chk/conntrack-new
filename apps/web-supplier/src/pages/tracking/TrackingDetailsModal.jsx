import React from 'react';
import { X, Truck, User, MapPin, AlertTriangle } from 'lucide-react';

export const TrackingDetailsModal = ({ isOpen, onClose, bid }) => {
  if (!isOpen || !bid) return null;

  const driver = Array.isArray(bid.drivers) ? bid.drivers[0] : (bid.drivers || {});
  const vehicle = Array.isArray(bid.vehicles) ? bid.vehicles[0] : (bid.vehicles || {});

  const DetailItem = ({ label, value, mono = false }) => (
    <div className="flex flex-col">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-dark truncate ${mono ? 'font-mono' : ''}`}>
        {value || <span className="italic text-gray-300">Not set</span>}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-primary px-6 py-3 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="flex overflow-hidden justify-center items-center w-12 h-12 rounded-full border-2 border-white/20 bg-white/10">
              <MapPin size={24} className="text-white opacity-80" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Tracking Details</h2>
              <p className="text-blue-100 text-[10px] opacity-80 uppercase tracking-wider">BIDDING ID: #{bid.bidding_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Driver Details */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase border-b border-gray-50 pb-0.5 flex items-center gap-1.5">
                <User size={10} /> Driver Information
              </h3>
              <div className="space-y-3">
                <DetailItem label="Full Name" value={driver.first_name ? `${driver.first_name} ${driver.last_name}` : ''} />
                <DetailItem label="Employee ID" value={driver.emp_id} mono />
                <DetailItem label="Contact Number" value={driver.contact_number} />
                <DetailItem label="License Class" value={driver.license_class} />
                <DetailItem label="License EXP" value={driver.license_expiry ? new Date(driver.license_expiry).toLocaleDateString('en-GB') : ''} />
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase border-b border-gray-50 pb-0.5 flex items-center gap-1.5">
                <Truck size={10} /> Vehicle Information
              </h3>
              <div className="space-y-3">
                <DetailItem label="Vehicle Number" value={vehicle.vehicle_number} mono />
                <DetailItem label="Vehicle Type" value={vehicle.vehicle_type || vehicle.type} />
                <DetailItem label="Condition" value={vehicle.condition_status?.toUpperCase()} />
                <DetailItem label="Insurance EXP" value={vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString('en-GB') : ''} />
                <DetailItem label="Port Pass EXP" value={vehicle.port_pass_expiry ? new Date(vehicle.port_pass_expiry).toLocaleDateString('en-GB') : ''} />
              </div>
            </div>

          </div>

          <div className="mt-6 p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <AlertTriangle size={14} className="text-primary" />
            </div>
            <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
              Tracking data is updated live based on the container tracking system. Contact the driver directly for immediate status updates.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-all hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
