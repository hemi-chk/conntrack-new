import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Truck,
  User,
  Inbox,
  ArrowRight,
  ChevronDown,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useBiddings } from '../../hooks/useBiddings';
import { useProfile } from '../../hooks/useProfile';
import { JobDetailsModal } from './JobDetailsModal';

export const AssignedJobs = () => {
  const { profileData } = useProfile();
  const { myBids, isLoading, error, refreshBiddings } = useBiddings(profileData);
  const [jobType, setJobType] = useState('Upcoming Jobs');
  const [selectedBid, setSelectedBid] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Filter only "accepted" bids for the logged-in supplier
  const assignedJobs = useMemo(() => {
    return myBids.filter(bid => {
      const status = (bid.bid_status || bid.status || '').toLowerCase();
      if (status !== 'accepted') return false;

      const pickupStr = bid.bidding?.orders?.pickup_date;
      if (!pickupStr) return jobType === 'Upcoming Jobs'; // If no date, assume upcoming for now

      const pickupDate = new Date(pickupStr);
      pickupDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (jobType === 'Upcoming Jobs') {
        return pickupDate >= today; // today or future
      } else {
        return pickupDate < today; // past
      }
    });
  }, [myBids, jobType]);

  const handleViewDetails = (bid) => {
    setSelectedBid(bid);
    setIsViewModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 duration-500 text-dark animate-in fade-in slide-in-from-bottom-4">

      <JobDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        bid={selectedBid}
        isReadOnly={jobType === 'Job History'}
        onUpdateSuccess={refreshBiddings}
      />

      {/* Header Title & Dropdown */}
      <div className="flex flex-col gap-4 justify-between items-start sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Assigned Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your won bids and logistics tasks</p>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={refreshBiddings}
            className="p-2 text-gray-500 bg-white rounded-lg border border-gray-200 transition-colors hover:bg-gray-100"
            title="Refresh List"
          >
            <Clock size={20} />
          </button>
          <div className="inline-block relative w-full sm:w-56">
            <select
              className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 font-bold text-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer hover:border-gray-300 transition-all text-sm"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              <option value="Upcoming Jobs">Upcoming Jobs</option>
              <option value="Job History">Job History</option>
            </select>
            <div className="flex absolute inset-y-0 right-0 items-center px-3 text-gray-500 pointer-events-none">
              <ChevronDown size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex gap-3 items-center px-4 py-3 text-red-700 bg-red-50 rounded-xl border border-red-200">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm font-semibold tracking-wider text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4">BIDDING ID</th>
                <th className="px-6 py-4">PICKUP</th>
                <th className="px-6 py-4">DESTINATION</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">DRIVER</th>
                <th className="px-6 py-4">VEHICLE</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col gap-2 items-center">
                      <div className="w-6 h-6 rounded-full border-2 animate-spin border-primary border-t-transparent"></div>
                      <p className="text-sm font-medium">Loading assigned jobs...</p>
                    </div>
                  </td>
                </tr>
              ) : assignedJobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col gap-3 items-center">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Inbox size={40} className="text-gray-300" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col gap-1 items-center">
                        <p className="text-lg font-bold tracking-tight text-gray-500">No jobs found</p>
                        <p className="max-w-xs text-sm text-center text-gray-400">
                          {jobType === 'Upcoming Jobs'
                            ? 'Once your bids are accepted, they will appear here as assigned jobs.'
                            : 'Completed jobs will appear in your history.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                assignedJobs.map((bid) => {
                  const order = bid.bidding?.orders || {};
                  const driverName = bid.drivers ? `${bid.drivers.first_name} ${bid.drivers.last_name}` : "Assign driver";
                  const vehicleNum = bid.vehicles?.vehicle_number || "Assign Vehicle";

                  return (
                    <tr key={bid.bid_id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold tracking-tight text-primary">#{bid.bidding_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 items-center">
                          <MapPin size={14} className="text-success" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-dark">{order.pickup_state || 'N/A'}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">{order.pickup_country || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 items-center">
                          <MapPin size={14} className="text-error" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-dark">{order.destination_state || 'N/A'}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">{order.destination_country || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600">
                          {order.pickup_date ? new Date(order.pickup_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${bid.drivers ? 'text-dark' : 'text-gray-400'}`}>
                          {driverName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${bid.vehicles ? 'text-dark' : 'text-gray-400'}`}>
                          {vehicleNum}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewDetails(bid)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};