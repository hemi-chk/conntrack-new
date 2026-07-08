import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { uploadFile } from '../../services/api';

const inputCls = "w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white";
const labelCls = "block mb-0.5 text-xs font-semibold text-gray-600";

export const EditDriverModal = ({ isOpen, onClose, driver, onUpdate }) => {
  const { profileData } = useProfile();
  const [formData, setFormData] = useState({
    emp_id: '', first_name: '', last_name: '', national_id: '',
    date_of_birth: '', gender: 'male', license_number: '',
    license_expiry: '', license_class: 'light', contact_number: '',
    contact_email: '', residential_address: '', availability_status: 'available'
  });
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [licenseFile, setLicenseFile] = useState(null);
  const [policeReportFile, setPoliceReportFile] = useState(null);

  useEffect(() => {
    if (driver) {
      setFormData({
        emp_id: driver.emp_id || driver.driver_id || '',
        first_name: driver.first_name || '',
        last_name: driver.last_name || '',
        national_id: driver.national_id || driver.nic || '',
        date_of_birth: driver.date_of_birth
          ? new Date(driver.date_of_birth).toISOString().split('T')[0] : '',
        gender: driver.gender || 'male',
        license_number: driver.license_number || '',
        license_expiry: (driver.license_expiry || driver.license_expiry_date)
          ? new Date(driver.license_expiry || driver.license_expiry_date).toISOString().split('T')[0] : '',
        license_class: driver.license_class || 'light',
        contact_number: driver.contact_number || '',
        contact_email: driver.contact_email || '',
        residential_address: driver.residential_address || '',
        availability_status: driver.availability_status || 'available'
      });
    }
  }, [driver, isOpen]);

  if (!isOpen || !driver) return null;

  const today = new Date().toISOString().split('T')[0];

  // Max DOB = 18 years ago
  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = () => {
    const { emp_id, first_name, last_name, national_id, date_of_birth, gender,
      license_number, license_expiry, license_class, contact_number,
      contact_email, residential_address, availability_status } = formData;

    if (!emp_id || !first_name || !last_name || !national_id || !date_of_birth ||
      !gender || !license_number || !license_expiry || !license_class ||
      !contact_number || !contact_email || !residential_address || !availability_status) {
      return 'All fields are required. Please fill in every field.';
    }

    if (emp_id.length < 3) return 'Employee ID must be at least 3 characters.';
    if (!/^[0-9]{9}[Vv]$/.test(national_id) && !/^[0-9]{12}$/.test(national_id)) {
      return "NIC must be old format (9 digits + V, e.g. 123456789V) or new format (12 digits).";
    }
    if (date_of_birth > maxDob) return 'Driver must be at least 18 years old.';
    if (license_expiry < today) return 'License Expiry must be a future or current date.';
    if (!/^0[0-9]{9}$/.test(contact_number)) return 'Contact Number must be 10 digits and start with 0 (e.g. 0771234567).';

    return null;
  };

  const handleUpdate = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    try {
      setIsUploading(true);

      const tryUpload = async (bucket, file, folder) => {
        if (!(file instanceof File)) return null;
        try {
          const url = await uploadFile(bucket, file, folder);
          if (!url) throw new Error("No URL returned from storage");
          return url;
        } catch (err) {
          throw err;
        }
      };

      const [newLicenseUrl, newPoliceReportUrl] = await Promise.all([
        tryUpload('driver-document', licenseFile, 'licenses'),
        tryUpload('driver-document', policeReportFile, 'police-reports')
      ]);

      onUpdate(driver.driver_id || driver.id, {
        ...formData,
        supplier_id: profileData?.id || profileData?.supplier_id,
        license_copy_url: newLicenseUrl || driver.license_copy_url,
        police_report_url: newPoliceReportUrl || driver.police_report_url
      });

      setLicenseFile(null);
      setPoliceReportFile(null);
    } catch (err) {
      setError(err.message || 'Failed to update driver');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-gray-100 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">

        {/* Header */}
        <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
          <div>
            <h2 className="text-lg font-bold leading-tight">Edit Driver</h2>
            <p className="text-blue-100 text-[10px] opacity-80 mt-0.5">All fields are required. Updating: {driver.emp_id || driver.driver_id}</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">

            {/* Row 1: Identity */}
            <div>
              <label className={labelCls}>Employee ID *</label>
              <input type="text" name="emp_id" value={formData.emp_id} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>First Name *</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Last Name *</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={inputCls} />
            </div>

            {/* Row 2: Personal */}
            <div>
              <label className={labelCls}>NIC *</label>
              <input type="text" name="national_id" value={formData.national_id} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date of Birth *</label>
              <input type="date" name="date_of_birth" max={maxDob} value={formData.date_of_birth} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={inputCls}>
                <option value="male">male</option>
                <option value="female">female</option>
              </select>
            </div>

            {/* Row 3: License */}
            <div>
              <label className={labelCls}>License No *</label>
              <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>License Expiry *</label>
              <input type="date" name="license_expiry" min={today} value={formData.license_expiry} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>License Type *</label>
              <select name="license_class" value={formData.license_class} onChange={handleChange} className={inputCls}>
                <option value="light">Light Vehicle</option>
                <option value="heavy">Heavy Vehicle</option>
                <option value="articulated">Articulated Vehicle</option>
              </select>
            </div>

            {/* Row 4: Contact */}
            <div>
              <label className={labelCls}>Contact Number *</label>
              <input type="text" name="contact_number" placeholder="0771234567" value={formData.contact_number} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>E-mail Address *</label>
              <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status *</label>
              <select name="availability_status" value={formData.availability_status} onChange={handleChange} className={inputCls}>
                <option value="available">available</option>
                <option value="on_trip">on_trip</option>
                <option value="unavailable">unavailable</option>
              </select>
            </div>

            {/* Row 5: Address – full width */}
            <div className="col-span-3">
              <label className={labelCls}>Address *</label>
              <input type="text" name="residential_address" value={formData.residential_address} onChange={handleChange} className={inputCls} />
            </div>

            {/* Row 6: Document Uploads */}
            <div>
              <label className={labelCls}>Update License (PDF/Image)</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setLicenseFile(e.target.files[0])}
                className={inputCls}
              />
              {driver.license_copy_url && (
                <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                  Existing document available
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>Update Police Report (PDF/Image)</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setPoliceReportFile(e.target.files[0])}
                className={inputCls}
              />
              {driver.police_report_url && (
                <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                  Existing document available
                </p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 text-red-600 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-100 flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUploading}
            className="px-5 py-2 text-sm bg-primary hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading && <Loader2 size={16} className="animate-spin" />}
            {isUploading ? 'Uploading...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};
