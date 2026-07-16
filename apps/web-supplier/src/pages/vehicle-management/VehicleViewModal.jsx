import React from 'react';
import { X, AlertTriangle, Shield, Calendar, Truck, Activity, ExternalLink, Download, FileText } from 'lucide-react';

export const VehicleViewModal = ({ isOpen, onClose, vehicle, onEdit, onDelete }) => {
  const [previewUrl, setPreviewUrl] = React.useState(null);

  if (!isOpen || !vehicle) return null;

  const today = new Date();
  const isInsuranceValid = vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry) > today : false;
  const isPortPassValid = vehicle.port_pass_expiry ? new Date(vehicle.port_pass_expiry) > today : false;

  const DetailItem = ({ label, value, mono = false }) => (
    <div className="flex flex-col">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-dark truncate ${mono ? 'font-mono' : ''}`}>
        {value || <span className="italic text-gray-300">Not set</span>}
      </p>
    </div>
  );

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="overflow-hidden w-full max-w-4xl bg-white rounded-2xl border border-gray-100 shadow-2xl duration-200 animate-in fade-in zoom-in">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-3 text-white bg-primary">
          <div className="flex gap-3 items-center">
            <div className="flex overflow-hidden justify-center items-center w-12 h-12 rounded-full border-2 border-white/20 bg-white/10">
              <Truck size={24} className="text-white opacity-80" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">{vehicle.vehicle_number}</h2>
              <p className="text-blue-100 text-[10px] opacity-80">TYPE: {vehicle.type || vehicle.vehicle_type || 'N/A'}</p>
            </div>
          </div>
          <button onClick={onClose} className="transition-colors text-white/80 hover:text-white">
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

          <div className="grid grid-cols-3 gap-y-6 gap-x-12">

            {/* Identity Details */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase border-b border-gray-50 pb-0.5 flex items-center gap-1.5">
                <Truck size={10} /> Identity
              </h3>
              <DetailItem label="Vehicle Number" value={vehicle.vehicle_number} />
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
              {vehicle.Vehicle_Insurance_Copy && (
                <div className="flex flex-col">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Insurance Copy</p>
                  <button onClick={() => setPreviewUrl(vehicle.Vehicle_Insurance_Copy)} className="text-left text-xs font-medium text-primary hover:underline truncate">View Document</button>
                </div>
              )}
              {vehicle.Vehicle_Port_Pass_Copy && (
                <div className="flex flex-col">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Port Pass Copy</p>
                  <button onClick={() => setPreviewUrl(vehicle.Vehicle_Port_Pass_Copy)} className="text-left text-xs font-medium text-primary hover:underline truncate">View Document</button>
                </div>
              )}
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

            <div className={`flex flex-col items-center p-2 rounded-xl border border-gray-100 shadow-sm ${(vehicle.availability_status || vehicle.status)?.toLowerCase() === 'available' ? 'bg-success/10' :
              (vehicle.availability_status || vehicle.status)?.toLowerCase() === 'on_trip' ? 'bg-warning/10' :
                'bg-error/10'
              }`}>
              <p className="text-[8px] text-gray-400 uppercase font-black mb-0.5">Current Status</p>
              <span className={`text-xs font-black ${(vehicle.availability_status || vehicle.status)?.toLowerCase() === 'available' ? 'text-success' :
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
            className="flex-1 order-3 px-4 py-2 text-xs font-bold text-gray-600 bg-white rounded-xl border border-gray-200 shadow-sm transition-all sm:order-1 hover:bg-gray-50"
          >
            Back
          </button>
          <div className="flex-[2] order-1 sm:order-2 flex gap-2.5">
            <button
              onClick={() => onEdit(vehicle)}
              className="flex-1 px-4 py-2 text-xs font-bold bg-white rounded-xl border shadow-sm transition-all text-primary border-primary/30 hover:bg-blue-50"
            >
              Edit Vehicle
            </button>
            <button
              onClick={() => onDelete(vehicle)}
              className="flex-1 px-4 py-2 text-xs font-bold rounded-xl border shadow-sm transition-all text-error bg-error/5 border-error/20 hover:bg-error/10"
            >
              Remove Vehicle
            </button>
          </div>
        </div>
        
        {/* Internal Document Preview Overlay */}
        {previewUrl && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-12 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full h-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/20">
              
              {/* Preview Header */}
              <div className="flex justify-between items-center px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-dark uppercase tracking-widest text-[10px]">Document Preview</h3>
                    <p className="text-[9px] text-gray-400 font-medium truncate max-w-[200px] sm:max-w-md">{previewUrl}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewUrl(null)} 
                  className="p-2 hover:bg-gray-200 text-gray-500 hover:text-dark rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Preview Content */}
              <div className="flex-1 bg-gray-50 relative overflow-hidden">
                {previewUrl.toLowerCase().includes('.pdf') ? (
                  <iframe 
                    src={`${previewUrl}#toolbar=0`} 
                    className="w-full h-full border-none" 
                    title="PDF Preview"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4 sm:p-10 select-none">
                    <img 
                      src={previewUrl} 
                      alt="Document Preview" 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-gray-100" 
                    />
                  </div>
                )}
              </div>

              {/* Preview Footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3 justify-center">
                <button 
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-primary bg-white border border-primary/20 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm group"
                >
                  OPEN IN NEW TAB
                  <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
                
                <a 
                  href={previewUrl}
                  download={`document_${Date.now()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-success bg-white border border-success/20 rounded-xl hover:bg-success hover:text-white transition-all shadow-sm group"
                >
                  DOWNLOAD DOCUMENT
                  <Download size={12} className="group-hover:translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
