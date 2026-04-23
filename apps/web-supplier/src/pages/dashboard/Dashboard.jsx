import React from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { 
  ClipboardList, 
  Truck, 
  Users, 
  FileText, 
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Package,
  Inbox
} from 'lucide-react';

export const Dashboard = () => {
  const { stats } = useDashboard();

  const statCards = [
    {
      title: 'Active Jobs',
      value: stats?.activeJobs || 0,
      icon: <ClipboardList className="w-6 h-6 text-primary" />,
      label: 'Currently ongoing',
    },
    {
      title: 'Vehicles',
      value: `${stats?.availableVehicles || 0}/${stats?.totalVehicles || 0}`,
      icon: <Truck className="w-6 h-6 text-primary" />,
      label: 'Available for work',
    },
    {
      title: 'Drivers',
      value: `${stats?.availableDrivers || 0}/${stats?.totalDrivers || 0}`,
      icon: <Users className="w-6 h-6 text-primary" />,
      label: 'Active on duty',
    },
    {
      title: 'Bids Submitted',
      value: String(stats?.bidsSubmitted || 0).padStart(2, '0'),
      icon: <FileText className="w-6 h-6 text-primary" />,
      label: 'Pending approval',
    },
  ];

  return (
    <div className="flex flex-col gap-6 text-dark animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        <p className="text-gray-500 font-medium mt-1">Welcome back, Hayleys. Here's what's happening today.</p>
      </div>

      {/* Supabase Status Messages */}
      <div className="flex flex-col gap-3">
        <div className="bg-blue-50 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3">
          <CheckCircle2 size={18} />
          <span className="font-medium text-sm text-primary">Supabase Status: Found {stats?.totalDrivers || 0} drivers</span>
        </div>
        {(!stats?.totalDrivers || stats?.totalDrivers === 0) && (
          <div className="bg-blue-50 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertTriangle size={18} />
            <span className="font-medium text-sm text-primary">No data in drivers table</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div 
            key={idx} 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="bg-blue-50 p-3 rounded-lg text-primary">
                {card.icon}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{card.title}</span>
              <span className="text-2xl font-bold text-dark">{card.value}</span>
              <span className="text-xs text-gray-400 mt-1 font-medium">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-primary">Recent Activity</h2>
          </div>
          <button className="text-primary hover:text-blue-800 font-bold text-sm flex items-center gap-1 group transition-colors">
            View All 
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold uppercase text-gray-500">
                <th className="px-6 py-4">ORDER ID</th>
                <th className="px-6 py-4">TYPE</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4">TIME</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats?.recentActivity?.length > 0 ? (
                stats.recentActivity.map((activity, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-primary text-sm tracking-tight">
                        {activity.order_id || `ORD-${1000 + idx}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package size={16} className="text-gray-400" />
                        <span className="capitalize">{activity.type || 'Import'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={activity.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {new Date(activity.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-primary hover:underline font-bold text-sm">View Details</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Inbox size={40} className="text-gray-300" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-gray-500 font-bold text-lg tracking-tight">No recent activity</p>
                        <p className="text-gray-400 text-sm">Recent orders and status changes will appear here.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    'Accepted': 'bg-green-50 text-green-700 border-green-200',
    'Pending': 'bg-orange-50 text-orange-700 border-orange-200',
    'In Transit': 'bg-blue-50 text-blue-700 border-blue-200',
    'Completed': 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const currentStyle = styles[status] || 'bg-gray-50 text-gray-600 border-gray-200';
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentStyle}`}>
      {status || 'Unknown'}
    </span>
  );
};