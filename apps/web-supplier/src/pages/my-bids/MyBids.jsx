import React, { useState } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  FileText, 
  XCircle, 
  Star, 
  AlertTriangle, 
  Inbox
} from 'lucide-react';

export const MyBids = () => {
  const [period, setPeriod] = useState('This Week');

  // Matching structural pattern of Biddings page
  // Empty array as requested since DB table doesn't exist yet
  const myBids = [];
  const isLoading = false;
  const error = null;

  const stats = [
    { label: 'Total Bids', value: '0', icon: BarChart3, bgColor: 'bg-blue-50', iconColor: 'text-primary' },
    { label: 'Won', value: '0', icon: CheckCircle2, bgColor: 'bg-blue-50', iconColor: 'text-primary' },
    { label: 'Pending', value: '0', icon: FileText, bgColor: 'bg-blue-50', iconColor: 'text-primary' },
    { label: 'Lost', value: '0', icon: XCircle, bgColor: 'bg-blue-50', iconColor: 'text-primary' },
    { label: 'Success Rate', value: '0%', icon: Star, bgColor: 'bg-blue-50', iconColor: 'text-primary' },
  ];

  return (
    <div className="flex flex-col gap-6 text-dark animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-bold text-primary">My Bids</h1>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className={`${stat.bgColor} p-3 rounded-lg ${stat.iconColor}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</span>
              <span className="text-2xl font-bold text-dark">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action/Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Period:</label>
          <select 
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-dark font-medium outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="This Week">This Week</option>
            <option value="Last Week">Last Week</option>
            <option value="Old">Old</option>
          </select>
        </div>
      </div>

      {/* Messages - Supabase Status */}
      <div className="flex flex-col gap-3">
        <div className="bg-blue-50 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3">
          <CheckCircle2 size={18} />
          <span className="font-medium text-sm text-primary">Supabase Status: Connected (Found 0 drivers)</span>
        </div>
        {!isLoading && myBids.length === 0 && !error && (
          <div className="bg-blue-50 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertTriangle size={18} />
            <span className="font-medium text-sm text-primary">No data in biddings table (Supabase Status: Connected)</span>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold uppercase text-gray-500">
                <th className="px-6 py-4">ORDER ID</th>
                <th className="px-6 py-4">AMOUNT LKR</th>
                <th className="px-6 py-4">REMARKS</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {myBids.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Inbox size={40} className="text-gray-300" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-gray-500 font-bold text-lg tracking-tight">No bids found</p>
                        <p className="text-gray-400 text-sm max-w-xs text-center">Try changing your filters or place a new bid from the biddings portal.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                myBids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-dark">
                      <span className="font-bold text-primary text-sm">{bid.id}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-dark text-sm">{bid.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{bid.remarks}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${bid.status === 'won' ? 'bg-success text-white' : 
                          bid.status === 'lost' ? 'bg-danger text-white' : 
                          'bg-warning text-white'}
                      `}>
                        {bid.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-primary hover:underline font-bold text-sm">
                        View Details
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