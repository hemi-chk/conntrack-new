import React from 'react';
import { X, ExternalLink, AlertCircle, FileText, Shield, User, Download } from 'lucide-react';

export const DriverViewModal = ({ isOpen, onClose, driver, onEdit, onDelete }) => {
  if (!isOpen || !driver) return null;

  // Logic to determine license valid status automatically
  const isLicenseValid = driver.license_expiry ? new Date(driver.license_expiry) > new Date() : false;
  const [previewUrl, setPreviewUrl] = React.useState(null);

  // Dynamic Compliance Status Logic
  let complianceStatus = { text: 'Passed', color: 'text-success', bg: 'bg-success/10' };
  if (!driver.user_id) {
    complianceStatus = { text: 'Pending', color: 'text-warning', bg: 'bg-warning/10' };
  } else if (driver.removal_reason) {
    complianceStatus = { text: 'Removed', color: 'text-error', bg: 'bg-error/10' };
  } else if (driver.deactivation_reason) {
    complianceStatus = { text: 'Deactivated', color: 'text-error', bg: 'bg-error/10' };
  }

  const reason = driver.removal_reason || driver.deactivation_reason;

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
              {driver.profile_photo_url ? (
                <img src={driver.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <img 
                  src={`https://ui-avatars.com/api/?name=${driver.first_name}+${driver.last_name}&background=0052CC&color=fff&bold=true`} 
                  alt="Dummy" 
                  className="w-full h-full object-cover opacity-80" 
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">{driver.first_name} {driver.last_name}</h2>
              <p className="text-blue-100 text-[10px] opacity-80">EMP ID: {driver.emp_id || driver.driver_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Reason Alert Message */}
          {reason && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="text-error mt-0.5" size={16} />
              <div>
                <p className="text-[10px] font-black text-error uppercase tracking-tight">
                  {driver.removal_reason ? 'Removal Reason' : 'Deactivation Reason'}
                </p>
                <p className="text-xs text-red-700">{reason}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            
            {/* Personal Details */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-gray-400 uppercase border-b border-gray-50 pb-0.5">Personal</h3>
              <DetailItem label="NIC Number" value={driver.national_id || driver.nic} mono />
              <DetailItem label="Date of Birth" value={driver.date_of_birth ? new Date(driver.date_of_birth).toLocaleDateString('en-GB') : ''} />
              <DetailItem label="Gender" value={driver.gender} />
              <DetailItem label="Blood Group" value={driver.blood_group} />
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-gray-400 uppercase border-b border-gray-50 pb-0.5">Contact</h3>
              <DetailItem label="Phone Number" value={driver.contact_number} />
              <DetailItem label="Email Address" value={driver.contact_email} />
              <DetailItem label="Emergency Contact" value={driver.emergency_contact} />
              <DetailItem label="Address" value={driver.residential_address} />
            </div>

            {/* License Details */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-gray-400 uppercase border-b border-gray-50 pb-0.5">License</h3>
              <DetailItem label="License No" value={driver.license_number} mono />
              <DetailItem label="License Class" value={driver.license_class?.toUpperCase()} />
              <DetailItem label="Expiry Date" value={driver.license_expiry ? new Date(driver.license_expiry).toLocaleDateString('en-GB') : ''} />
            </div>
          </div>

          {/* Footer Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-5 mt-6 border-t border-gray-100">
            <div className="flex flex-col items-center p-2 rounded-xl border border-gray-100 bg-surface-light shadow-sm">
              <p className="text-[8px] text-gray-400 uppercase font-black mb-0.5">License Status</p>
              <span className={`text-xs font-black ${isLicenseValid ? 'text-success' : 'text-error'}`}>
                {isLicenseValid ? 'VALID' : 'EXPIRED'}
              </span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl border border-gray-100 bg-surface-light shadow-sm">
              <p className="text-[8px] text-gray-400 uppercase font-black mb-0.5">Current Status</p>
              <span className="text-xs font-black text-primary">
                {(driver.availability_status || 'available').toUpperCase()}
              </span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl border border-gray-100 bg-surface-light shadow-sm">
              <p className="text-[8px] text-gray-400 uppercase font-black mb-0.5">Compliance Status</p>
              <span className={`text-xs font-black ${complianceStatus.color}`}>
                {complianceStatus.text.toUpperCase()}
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
              onClick={() => onEdit(driver)}
              className="flex-1 px-4 py-2 text-xs font-bold text-primary bg-white border border-primary/30 rounded-xl hover:bg-blue-50 transition-all shadow-sm"
            >
              Edit Driver
            </button>
            <button 
              onClick={() => onDelete(driver)}
              className="flex-1 px-4 py-2 text-xs font-bold text-error bg-error/5 border border-error/20 rounded-xl hover:bg-error/10 transition-all shadow-sm"
            >
              Remove Driver
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



