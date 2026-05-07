import React, { useState } from 'react';
import { AlertTriangle, Inbox, CheckCircle2 } from 'lucide-react';

export const Biddings = () => {
  const [sortBy, setSortBy] = useState('newest');
  
  // Empty array as requested since DB table doesn't exist yet
  const openBiddings = [];
  const isLoading = false;
  const error = null;

  return (
    <div className="flex flex-col gap-6 text-dark animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Open Biddings</h1>
      </div>

      {/* Action/Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sort by:</label>
          <select 
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-dark font-medium outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="urgent">Urgent</option>
          </select>
          
          <span className="text-sm text-gray-500 font-medium">
            Showing {openBiddings.length} of {openBiddings.length} biddings
          </span>
        </div>
      </div>



      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold uppercase text-gray-500">
                <th className="px-6 py-4">ORDER ID</th>
                <th className="px-6 py-4">ROUTE</th>
                <th className="px-6 py-4">VEHICLE TYPE</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {openBiddings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Inbox size={40} className="text-gray-300" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-gray-500 font-bold text-lg tracking-tight">No open biddings</p>
                        <p className="text-gray-400 text-sm max-w-xs">New logistics orders will appear here automatically when they are posted.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                openBiddings.map((bid) => (
                  <tr key={bid.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-dark">
                      <span className="font-bold text-primary text-sm tracking-tight">{bid.id}</span>
                    </td>
                    <td className="px-6 py-4 capitalize text-sm font-medium">{bid.route.replace('-', ' to ')}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{bid.vehicle_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{bid.date}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-800 transition-colors">
                        Place Bid
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