import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';

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

  const today = new Date().toISOString().split('T')[0];

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

  const handleAdd = () => {
    const err = validate();
    if (err) { setError(err); return; }

    onAdd({ ...formData, supplier_id: profileData?.id || profileData?.supplier_id });
    setFormData(emptyForm);
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={handleAdd}>Add Driver</Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Driver"
      subtitle="All fields are required. Enter driver details and documentation."
      footer={footer}
    >
      <div className="grid grid-cols-3 gap-x-4 gap-y-3">
        {/* Row 1: Identity */}
        <Input label="Employee ID *" name="emp_id" placeholder="DRI1234" value={formData.emp_id} onChange={handleChange} />
        <Input label="First Name *" name="first_name" value={formData.first_name} onChange={handleChange} />
        <Input label="Last Name *" name="last_name" value={formData.last_name} onChange={handleChange} />

        {/* Row 2: Personal */}
        <Input label="NIC *" name="national_id" value={formData.national_id} onChange={handleChange} />
        <Input label="Date of Birth *" type="date" name="date_of_birth" max={maxDob} value={formData.date_of_birth} onChange={handleChange} />
        <Select label="Gender *" name="gender" value={formData.gender} onChange={handleChange}>
          <option value="male">male</option>
          <option value="female">female</option>
        </Select>

        {/* Row 3: License */}
        <Input label="License No *" name="license_number" value={formData.license_number} onChange={handleChange} />
        <Input label="License Expiry *" type="date" name="license_expiry" min={today} value={formData.license_expiry} onChange={handleChange} />
        <Select label="License Type *" name="license_class" value={formData.license_class} onChange={handleChange}>
          <option value="light">Light Vehicle</option>
          <option value="heavy">Heavy Vehicle</option>
          <option value="articulated">Articulated Vehicle</option>
        </Select>

        {/* Row 4: Contact */}
        <Input label="Contact Number *" name="contact_number" placeholder="0771234567" value={formData.contact_number} onChange={handleChange} />
        <Input label="E-mail Address *" type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} />
        <Select label="Initial Status *" name="availability_status" value={formData.availability_status} onChange={handleChange}>
          <option value="available">available</option>
          <option value="on_trip">on_trip</option>
          <option value="unavailable">unavailable</option>
        </Select>

        {/* Row 5: Address */}
        <div className="col-span-3">
          <Input label="Address *" name="residential_address" value={formData.residential_address} onChange={handleChange} />
        </div>
      </div>

      {error && (
        <div className="mt-4 text-red-600 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}
    </Modal>
  );
};
