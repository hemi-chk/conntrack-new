import React from 'react';
import { useProfile } from '../../hooks/useProfile';
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Building2,
  AlertTriangle,
  User,
  BadgeCheck,
  Briefcase,
  Banknote,
  Globe,
  LogOut,
  Info
} from 'lucide-react';

export const Profile = () => {
  const { profileData, isLoading, error } = useProfile();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 duration-500 text-dark animate-in fade-in slide-in-from-bottom-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Supplier Profile</h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 rounded-full border-t-2 border-b-2 animate-spin border-primary"></div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col gap-6 duration-500 text-dark animate-in fade-in slide-in-from-bottom-4">

      {/* Header Title */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Supplier Profile</h1>
        <button
          onClick={() => console.log('Logout clicked')}
          className="bg-primary hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow flex items-center gap-2"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex gap-3 items-center px-4 py-3 text-red-600 bg-red-50 rounded-lg border border-red-200 shadow-sm">
          <AlertTriangle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {!error && profileData && (
        <div className="flex flex-col gap-6">
          {/* Main Info Card */}
          <div className="flex flex-col gap-6 items-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm sm:flex-row sm:items-start">
            <div className="flex justify-center items-center w-24 h-24 bg-blue-50 rounded-xl border border-blue-100 text-primary shrink-0">
              <Building2 size={40} />
            </div>
            <div className="flex flex-col flex-1 gap-2 items-center sm:items-start">
              <div className="flex gap-3 items-center">
                <h2 className="text-2xl font-bold text-dark">
                  {profileData?.company_name || 'No Company Name'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                  ${profileData?.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                `}>
                  {profileData?.status || 'Unknown'}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 justify-center items-center text-sm font-medium text-gray-500 sm:justify-start">
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  <span>{profileData?.address || 'Location Not Set'}</span>
                </div>
                <div className="hidden w-1 h-1 bg-gray-300 rounded-full sm:block"></div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  <span>Joined {formatDate(profileData?.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Company Information */}
            <section className="flex flex-col gap-5 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex gap-2 items-center pb-3 border-b border-gray-100">
                <FileText size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-dark">Company Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailItem label="Registration No" value={profileData?.registration_number} />
                <DetailItem label="TIN" value={profileData?.tin_number} />
                <DetailItem label="VAT" value={profileData?.vat_number} />
                <DetailItem label="Email Address" value={profileData?.email} icon={<Mail size={14} />} />
                <DetailItem label="Business Phone" value={profileData?.contact_number} icon={<Phone size={14} />} />
              </div>
            </section>

            {/* Contact Person Details */}
            <section className="flex flex-col gap-5 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex gap-2 items-center pb-3 border-b border-gray-100">
                <User size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-dark">Contact Person</h3>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailItem label="Full Name" value={profileData?.contact_person} />
                <DetailItem label="Position" value={profileData?.contact_position || 'Manager'} icon={<Briefcase size={14} />} />
                <DetailItem label="Direct Email" value={profileData?.email} icon={<Mail size={14} />} />
                <DetailItem label="Direct Phone" value={profileData?.contact_number} icon={<Phone size={14} />} />
              </div>
            </section>

            {/* Director Details */}
            <section className="flex flex-col gap-5 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex gap-2 items-center pb-3 border-b border-gray-100">
                <BadgeCheck size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-dark">Director Details</h3>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailItem label="Director Name" value={profileData?.director_name} />
                <DetailItem label="NIC Number" value={profileData?.director_nic} />
                <DetailItem
                  label="Personal Address"
                  value={profileData?.director_address}
                  className="sm:col-span-2"
                  icon={<MapPin size={14} />}
                />
              </div>
            </section>

            {/* Bank Information */}
            <section className="flex flex-col gap-5 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex gap-2 items-center pb-3 border-b border-gray-100">
                <Banknote size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-dark">Bank Details</h3>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailItem label="Account Name" value={profileData?.account_name} />
                <DetailItem label="Bank Name" value={profileData?.bank_name} icon={<Globe size={14} />} />
                <DetailItem
                  label="Account Number"
                  value={profileData?.account_number}
                />
              </div>
            </section>

            {/* Business Overview */}
            <section className="flex flex-col gap-5 p-6 bg-white rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
              <div className="flex gap-2 items-center pb-3 border-b border-gray-100">
                <Info size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-dark">Business Overview</h3>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <DetailItem label="Experience (Years)" value={profileData?.experience_years} />
                <DetailItem label="Services" value={profileData?.services} className="sm:col-span-2" />
                <DetailItem label="Company Overview" value={profileData?.company_overview} className="sm:col-span-3" />
              </div>
            </section>

          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value, icon, className = "", valueClassName = "" }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
      {label}
    </span>
    <div className="flex gap-2 items-center">
      {icon && <span className="text-gray-400">{icon}</span>}
      <span className={`font-medium break-words text-dark ${valueClassName}`}>
        {value || '---'}
      </span>
    </div>
  </div>
);
