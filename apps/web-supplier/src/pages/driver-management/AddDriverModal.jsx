import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { uploadFile } from '../../services/api';
const inputCls = "w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white";
const labelCls = "block mb-0.5 text-xs font-semibold text-gray-600";

const emptyForm = {
  emp_id: '', first_name: '', last_name: '', national_id: '',
  date_of_birth: '', gender: 'male', license_number: '',
  license_expiry: '', license_class: 'light', contact_number: '',
  contact_email: '', residential_address: '', availability_status: 'available'
};

export const AddDriverModal = ({ isOpen, onClose, onAdd }) => {
  const { profileData } = useProfile();
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [licenseFile, setLicenseFile] = useState(null);
  const [policeReportFile, setPoliceReportFile] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

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

    if (emp_id.length < 3) {
      return 'Employee ID must be at least 3 characters.';
    }

    if (!/^[0-9]{9}[Vv]$/.test(national_id) && !/^[0-9]{12}$/.test(national_id)) {
      return "NIC must be old format (9 digits + V) or new format (12 digits).";
    }

    if (date_of_birth > maxDob) {
      return 'Driver must be at least 18 years old.';
    }

    if (license_expiry < today) {
      return 'License Expiry must be a future or current date.';
    }

    if (!/^0[0-9]{9}$/.test(contact_number)) {
      return 'Contact Number must be 10 digits and start with 0.';
    }

    return null;
  };

  const handleAdd = async () => {
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

      const [licenseUrl, policeReportUrl] = await Promise.all([
        tryUpload('driver-document', licenseFile, 'licenses'),
        tryUpload('driver-document', policeReportFile, 'police-reports')
      ]);

      await onAdd({
        ...formData,
        supplier_id: profileData?.id || profileData?.supplier_id,
        license_copy_url: licenseUrl,
        police_report_url: policeReportUrl
      });

      setFormData(emptyForm);
      setLicenseFile(null);
      setPoliceReportFile(null);
    } catch (err) {
      setError(err.message || 'Failed to add driver');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-gray-100 shadow-2xl duration-200 animate-in fade-in zoom-in overflow-hidden">

        {/* Header */}
        <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
          <div>
            <h2 className="text-lg font-bold leading-tight">Add New Driver</h2>
            <p className="text-blue-100 text-[10px] opacity-80 mt-0.5">All fields are required. Enter driver details and documentation.</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-y-3 gap-x-4">
            {/* Row 1: Identity */}
            <div>
              <label className={labelCls}>Employee ID *</label>
              <input type="text" name="emp_id" placeholder="DRI1234" value={formData.emp_id} onChange={handleChange} className={inputCls} />
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
              <label className={labelCls}>Initial Status *</label>
              <select name="availability_status" value={formData.availability_status} onChange={handleChange} className={inputCls}>
                <option value="available">available</option>
                <option value="on_trip">on_trip</option>
                <option value="unavailable">unavailable</option>
              </select>
            </div>

            {/* Row 5: Address */}
            <div className="col-span-3">
              <label className={labelCls}>Address *</label>
              <input type="text" name="residential_address" value={formData.residential_address} onChange={handleChange} className={inputCls} />
            </div>

            {/* Row 6: Document Uploads */}
            <div>
              <label className={labelCls}>License Copy (PDF/Image)</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setLicenseFile(e.target.files[0])}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Police Report (PDF/Image)</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setPoliceReportFile(e.target.files[0])}
                className={inputCls}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex gap-2 items-center px-3 py-2 mt-3 text-xs font-medium text-red-600 bg-red-50 rounded-lg border border-red-100">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-3 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white rounded-lg border border-gray-300 transition-colors hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={isUploading}
            className="flex gap-2 items-center px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors bg-primary hover:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUploading && <Loader2 size={16} className="animate-spin" />}
            {isUploading ? 'Uploading...' : 'Add Driver'}
          </button>
        </div>

      </div>
    </div>
  );
};
