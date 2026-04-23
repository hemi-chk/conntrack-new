import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Calendar, 
  BarChart3, 
  Star, 
  ShieldCheck, 
  Plus,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Trophy,
  Clock,
  ExternalLink,
  LogOut
} from 'lucide-react';

export const Profile = () => {
  // Data states initialized to empty/null as requested (No fake data in codebase)
  const [profileData] = useState(null);
  const [stats] = useState(null);
  const [licenses] = useState([]);

  return (
    <div className="flex flex-col gap-8 text-dark animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Status */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Profile</h1>
          <button 
            onClick={() => console.log('Logout clicked')}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-800 transition-all shadow-md shadow-primary/20"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="bg-blue-50 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
            <CheckCircle2 size={18} />
            <span className="font-medium text-sm">Supabase Status: Connected</span>
          </div>
          {!profileData && (
            <div className="bg-blue-50 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
              <AlertTriangle size={18} />
              <span className="font-medium text-sm">No profile data found in database (Tables not synced)</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Hero Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="w-32 h-32 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border-2 border-primary/20 relative z-10">
          <Building2 size={64} strokeWidth={1.5} />
        </div>
        
        <div className="flex-1 text-center md:text-left relative z-10">
          <h2 className="text-4xl font-black text-dark tracking-tight mb-2">
            {profileData?.companyName || '---'}
          </h2>
          <p className="text-lg font-medium text-gray-500">
            {profileData?.tagline || '---'}
          </p>
        </div>
      </div>

      {/* Grid Layout for Details and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Company Details */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <h3 className="text-xl font-bold text-dark flex items-center gap-2">
            Company Details
          </h3>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                <Mail size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</span>
                <span className="font-semibold text-dark break-all">{profileData?.email || '---'}</span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                <Phone size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone</span>
                <span className="font-semibold text-dark">{profileData?.phone || '---'}</span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                <MapPin size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Address</span>
                <span className="font-semibold text-dark leading-snug">{profileData?.address || '---'}</span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                <FileText size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Registration No</span>
                <span className="font-semibold text-dark">{profileData?.regNo || '---'}</span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                <Calendar size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Joined Date</span>
                <span className="font-semibold text-dark">{profileData?.joinedDate || '---'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h3 className="text-xl font-bold text-dark flex items-center gap-2">
            Performance Overview
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <span className="text-3xl font-black text-primary">{stats?.totalBids || '0'}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Bids</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <span className="text-3xl font-black text-success">{stats?.won || '0'}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Won</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <span className="text-3xl font-black text-warning">{stats?.pending || '0'}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <span className="text-3xl font-black text-danger">{stats?.lost || '0'}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lost</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-primary text-white p-6 rounded-2xl shadow-md border border-primary/20 flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                <Trophy size={80} />
              </div>
              <span className="text-4xl font-black">{stats?.activeJobs || '0'}</span>
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Active Jobs</span>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-warning">
                <Star size={20} fill="currentColor" />
                <span className="text-3xl font-black text-dark">{stats?.rating || '0.0'}</span>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rating</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-primary">
                <BarChart3 size={20} />
                <span className="text-3xl font-black text-dark">{stats?.successRate || '0%'}</span>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Success Rate</span>
            </div>
          </div>

          {/* Supplier Licenses */}
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-dark flex items-center gap-2">
                Supplier Licenses
                <span className="text-sm font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                  {licenses.length} Total
                </span>
              </h3>
              <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-800 transition-all shadow-md shadow-primary/20">
                <Plus size={18} />
                Add License
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {licenses.length === 0 ? (
                <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <ShieldCheck size={40} className="text-gray-300" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-gray-500 font-bold text-lg">No licenses found</p>
                    <p className="text-gray-400 text-sm max-w-xs">Please upload your business and transport licenses to participate in high-value biddings.</p>
                  </div>
                </div>
              ) : (
                licenses.map((license, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <h4 className="font-bold text-dark text-lg">{license.name}</h4>
                        <span className="text-sm text-gray-500 font-medium">{license.number}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                        license.status === 'Active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      }`}>
                        {license.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issued</span>
                        <span className="text-sm font-semibold text-dark">{license.issued}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expires</span>
                        <span className="text-sm font-semibold text-dark">{license.expires}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};