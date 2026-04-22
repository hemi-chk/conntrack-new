import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Truck, 
  User, 
  AlertTriangle, 
  Inbox,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

export const AssignedJobs = () => {
  const [jobType, setJobType] = useState('Upcoming Jobs');
  
  // Empty array as requested since DB table doesn't exist yet
  const assignedJobs = [];
  const isLoading = false;
  const error = null;

  return (
    <div className="flex flex-col gap-6 text-dark animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Title & Dropdown */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Assigned Jobs</h1>
        
        <div className="relative inline-block w-full sm:w-64">
          <select 
            className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 font-bold text-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer hover:border-gray-300 transition-all"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
          >
            <option value="Upcoming Jobs">Upcoming Jobs</option>
            <option value="Job History">Job History</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {/* Messages - Supabase Status */}
      <div className="flex flex-col gap-3">
        <div className="bg-blue-50 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3">
          <CheckCircle2 size={18} />
          <span className="font-medium text-sm text-primary">Supabase Status: Found 0 drivers</span>
        </div>
        {!isLoading && assignedJobs.length === 0 && !error && (
          <div className="bg-blue-50 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertTriangle size={18} />
            <span className="font-medium text-sm text-primary">No data in drivers table (Supabase Status: Connected)</span>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold uppercase text-gray-500">
                <th className="px-6 py-4">Order No</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Order date</th>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignedJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Inbox size={40} className="text-gray-300" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-gray-500 font-bold text-lg tracking-tight">No jobs found</p>
                        <p className="text-gray-400 text-sm max-w-xs text-center">
                          {jobType === 'Upcoming Jobs' 
                            ? 'Once you win a bid and assign a driver/vehicle, they will appear here.' 
                            : 'Completed jobs will appear in your history.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                assignedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-bold text-primary">{job.orderNo}</td>
                    <td className="px-6 py-4 font-medium text-dark">{job.route}</td>
                    <td className="px-6 py-4 text-gray-600">{job.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-full text-gray-500">
                          <User size={14} />
                        </div>
                        <span className="font-medium">{job.driver}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-full text-gray-500">
                          <Truck size={14} />
                        </div>
                        <span className="font-medium">{job.vehicle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-primary hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-2 mx-auto">
                        View Details
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};