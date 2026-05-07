import React from 'react';
import { X, AlertTriangle, Shield, Calendar, Truck, Activity } from 'lucide-react';

export const VehicleViewModal = ({ isOpen, onClose, vehicle, onEdit, onDelete }) => {
  if (!isOpen || !vehicle) return null;

  const today = new Date();
  const isInsuranceValid = vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry) > today : false;
  const isPortPassValid = vehicle.port_pass_expiry ? new Date(vehicle.port_pass_expiry) > today : false;

  const DetailItem = ({ label, value, mono = false }) => (
    <div className="flex flex-col">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-dark truncate ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-gray-300 italic">Not set</span>}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-gray-100 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-primary px-6 py-3 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center">
              <Truck size={24} className="text-white opacity-80" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">{vehicle.vehicle_number}</h2>
              <p className="text-blue-100 text-[10px] opacity-80">TYPE: {vehicle.type || vehicle.vehicle_type || 'N/A'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Status Alert if anything is expired */}
          {(!isInsuranceValid || !isPortPassValid) && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="text-error mt-0.5" size={16} />
              <div>
                <p className="text-[10px] font-black text-error uppercase tracking-tight">Maintenance Alert</p>
                <p className="text-xs text-red-700">
                  {!isInsuranceValid && !isPortPassValid ? 'Both Insurance and Port Pass have expired.' : 
                   !isInsuranceValid ? 'Insurance coverage has expired.' : 'Port Pass has expired.'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-x-12 gap-y-6">
            
            {/* Identity Details */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase border-b border-gray-50 pb-0.5 flex items-center gap-1.5">
                <Truck size={10} /> Identity
              </h3>
              <DetailItem label="Vehicle Number" value={vehicle.vehicle_number} mono />
              <DetailItem label="Vehicle Type" value={vehicle.type || vehicle.vehicle_type} />
            </div>

            {/* Operational Details */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase border-b border-gray-50 pb-0.5 flex items-center gap-1.5">
                <Activity size={10} /> Operations
              </h3>
              <DetailItem label="Condition Status" value={vehicle.condition_status?.toUpperCase()} />
              <DetailItem label="Availability Status" value={vehicle.availability_status?.toUpperCase()} />
            </div>

            {/* Documentation Details */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase border-b border-gray-50 pb-0.5 flex items-center gap-1.5">
                <Calendar size={10} /> Documentation
              </h3>
              <DetailItem 
                label="Insurance Expiry" 
                value={vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString('en-GB') : ''} 
              />
              <DetailItem 
                label="Port Pass Expiry" 
                value={vehicle.port_pass_expiry ? new Date(vehicle.port_pass_expiry).toLocaleDateString('en-GB') : ''} 
              />
            </div>

          </div>

          {/* Footer Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-5 mt-6 border-t border-gray-100">
            <div className={`flex flex-col items-center p-2 rounded-xl border border-gray-100 shadow-sm ${isInsuranceValid ? 'bg-success/10' : 'bg-error/10'}`}>
              <p className="text-[8px] text-gray-400 uppercase font-black mb-0.5">Insurance Status</p>
              <span className={`text-xs font-black ${isInsuranceValid ? 'text-success' : 'text-error'}`}>
                {isInsuranceValid ? 'VALID' : 'EXPIRED'}
              </span>
            </div>

            <div className={`flex flex-col items-center p-2 rounded-xl border border-gray-100 shadow-sm ${isPortPassValid ? 'bg-success/10' : 'bg-error/10'}`}>
              <p className="text-[8px] text-gray-400 uppercase font-black mb-0.5">Port Pass Status</p>
              <span className={`text-xs font-black ${isPortPassValid ? 'text-success' : 'text-error'}`}>
                {isPortPassValid ? 'VALID' : 'EXPIRED'}
              </span>
            </div>

            <div className={`flex flex-col items-center p-2 rounded-xl border border-gray-100 shadow-sm ${
              (vehicle.availability_status || vehicle.status)?.toLowerCase() === 'available' ? 'bg-success/10' :
              (vehicle.availability_status || vehicle.status)?.toLowerCase() === 'on_trip' ? 'bg-warning/10' :
              'bg-error/10'
            }`}>
              <p className="text-[8px] text-gray-400 uppercase font-black mb-0.5">Current Status</p>
              <span className={`text-xs font-black ${
                (vehicle.availability_status || vehicle.status)?.toLowerCase() === 'available' ? 'text-success' :
                (vehicle.availability_status || vehicle.status)?.toLowerCase() === 'on_trip' ? 'text-warning' :
                'text-error'
              }`}>
                {(vehicle.availability_status || 'available').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2.5">
          <button 
            onClick={onClose}
            className="flex-1 order-3 sm:order-1 px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            Back
          </button>
          <div className="flex-[2] order-1 sm:order-2 flex gap-2.5">
            <button 
              onClick={() => onEdit(vehicle)}
              className="flex-1 px-4 py-2 text-xs font-bold text-primary bg-white border border-primary/30 rounded-xl hover:bg-blue-50 transition-all shadow-sm"
            >
              Edit Vehicle
            </button>
            <button 
              onClick={() => onDelete(vehicle)}
              className="flex-1 px-4 py-2 text-xs font-bold text-error bg-error/5 border border-error/20 rounded-xl hover:bg-error/10 transition-all shadow-sm"
            >
              Remove Vehicle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
