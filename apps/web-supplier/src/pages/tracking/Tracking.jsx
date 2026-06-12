import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Truck,
  User,
  Phone,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Inbox
} from 'lucide-react';
import { useBiddings } from '../../hooks/useBiddings';
import { useProfile } from '../../hooks/useProfile';
import { TrackingDetailsModal } from './TrackingDetailsModal';

export const Tracking = () => {
  const { profileData } = useProfile();
  const { myBids, isLoading, error, refreshBiddings } = useBiddings(profileData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBid, setSelectedBid] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter: Accepted bids where pickup_date is TODAY
  const trackingData = useMemo(() => {
    return myBids.filter(bid => {
      const status = (bid.bid_status || bid.status || '').toLowerCase();
      if (status !== 'accepted') return false;

      const pickupStr = bid.bidding?.orders?.pickup_date;
      if (!pickupStr) return false;

      const pickupDate = new Date(pickupStr);
      pickupDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return pickupDate.getTime() === today.getTime();
    });
  }, [myBids]);

  const filteredData = trackingData.filter(bid => {
    const order = bid.bidding?.orders || {};
    const driver = bid.drivers ? `${bid.drivers.first_name} ${bid.drivers.last_name}` : '';
    const vehicle = bid.vehicles?.vehicle_number || '';
    const id = bid.bidding_id?.toString() || '';
    const destination = order.destination_state || '';

    const term = searchTerm.toLowerCase();
    return (
      id.includes(term) ||
      driver.toLowerCase().includes(term) ||
      vehicle.toLowerCase().includes(term) ||
      destination.toLowerCase().includes(term)
    );
  });

  const handleOpenDetails = (bid) => {
    setSelectedBid(bid);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 duration-500 text-dark animate-in fade-in slide-in-from-bottom-4">

      {/* Header Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Tracking View</h1>
          <p className="mt-1 text-sm text-gray-500">Live monitoring of jobs scheduled for today</p>
        </div>
        <button
          onClick={refreshBiddings}
          className="p-2 text-gray-500 bg-white rounded-lg border border-gray-200 transition-colors hover:bg-gray-100"
          title="Refresh List"
        >
          <Clock size={20} />
        </button>
      </div>

      {/* Search Bar Row */}
      <div className="flex flex-col gap-4 justify-between items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm md:flex-row">
        <div className="relative w-full md:w-1/2">
          <span className="flex absolute inset-y-0 left-0 items-center pl-3 text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            placeholder="Search by Bidding ID, Driver, Vehicle, Destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 uppercase tracking-tighter">
            {filteredData.length} Live Shipments
          </span>
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
      <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                <th className="px-6 py-3">BIDDING ID</th>
                <th className="px-6 py-3">PICKUP</th>
                <th className="px-6 py-3">DESTINATION</th>
                <th className="px-6 py-3">DRIVER</th>
                <th className="px-6 py-3">VEHICLE</th>
                <th className="px-6 py-3">LAST UPDATE</th>
                <th className="px-6 py-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-400">
                    <div className="flex flex-col gap-2 items-center">
                      <div className="w-6 h-6 rounded-full border-2 animate-spin border-primary border-t-transparent"></div>
                      <p className="text-sm font-medium">Fetching tracking data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-400">
                    <div className="flex flex-col gap-3 items-center">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Inbox size={40} className="text-gray-300" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col gap-1 items-center">
                        <p className="text-lg font-bold tracking-tight text-gray-500">No shipments for today</p>
                        <p className="max-w-xs text-sm text-center text-gray-400">Only jobs scheduled for pickup today ({new Date().toLocaleDateString('en-GB')}) will appear here.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((bid) => {
                  const bidding = Array.isArray(bid.bidding) ? bid.bidding[0] : (bid.bidding || {});
                  const order = Array.isArray(bidding.orders) ? bidding.orders[0] : (bidding.orders || {});
                  const driver = Array.isArray(bid.drivers) ? bid.drivers[0] : (bid.drivers || {});
                  const vehicle = Array.isArray(bid.vehicles) ? bid.vehicles[0] : (bid.vehicles || {});

                  const driverName = driver.first_name ? `${driver.first_name} ${driver.last_name}` : "Not Assigned";
                  const vehicleNum = vehicle.vehicle_number || "Not Assigned";
                  
                  const lastUpdate = order.container_tracking?.[0]?.current_location || "In Transit";

                  return (
                    <tr key={bid.bid_id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-2.5">
                        <span className="text-sm font-bold tracking-tight text-primary">#{bid.bidding_id}</span>
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="flex gap-2 items-center">
                          <MapPin size={14} className="text-success" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold leading-tight text-dark">{order.pickup_state || 'N/A'}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">{order.pickup_country || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="flex gap-2 items-center">
                          <MapPin size={14} className="text-error" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold leading-tight text-dark">{order.destination_state || 'N/A'}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">{order.destination_country || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2.5">
                        <span className="text-sm font-bold text-dark">{driverName}</span>
                      </td>
                      <td className="px-6 py-2.5">
                        <span className="text-sm font-bold text-dark">{vehicleNum}</span>
                      </td>
                      <td className="px-6 py-2.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-tight">
                          {lastUpdate}
                        </span>
                      </td>
                      <td className="px-6 py-2.5 text-center">
                        <button
                          onClick={() => handleOpenDetails(bid)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBid && (
        <TrackingDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          bid={selectedBid}
        />
      )}
    </div>
  );
};