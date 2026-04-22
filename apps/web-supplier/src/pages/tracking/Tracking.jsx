import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Truck, 
  User, 
  Phone, 
  Eye, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export const Tracking = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Empty array as requested since DB table doesn't exist/sync yet
  const trackingData = [];

  const filteredData = trackingData.filter(item => 
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vehicle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 text-dark animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Tracking View</h1>
      </div>

      {/* Search Bar Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-1/2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            placeholder="Search by Order ID, Driver, Vehicle, Destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            Showing {filteredData.length} of {trackingData.length} orders
          </span>
        </div>
      </div>

      {/* Status Messages - No Emojis */}
      <div className="flex flex-col gap-3">
        <div className="bg-blue-50 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
          <CheckCircle2 size={18} />
          <span className="font-medium text-sm">Supabase Status: Found 0 drivers</span>
        </div>
        {trackingData.length === 0 && (
          <div className="bg-blue-50 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
            <AlertTriangle size={18} />
            <span className="font-medium text-sm">No data in drivers table (Supabase Status: Connected)</span>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase text-gray-500 tracking-wider">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4">Last Update</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <MapPin size={40} className="text-gray-300" strokeWidth={1.5} />
                      </div>
                      <p className="text-gray-500 font-bold text-lg tracking-tight">No active tracking found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-primary text-sm tracking-tight">{item.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg text-primary">
                          <User size={14} />
                        </div>
                        <span className="font-semibold text-sm text-dark">{item.driver}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone size={14} />
                        <span className="text-sm font-medium">{item.contact}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-dark font-medium">
                        <Truck size={14} className="text-gray-400" />
                        <span className="text-sm">{item.vehicle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 font-medium">{item.destination}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {item.lastUpdate}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="inline-flex items-center gap-1.5 text-primary hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg transition-all border border-blue-100 hover:border-primary">
                        <Eye size={16} />
                        View
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