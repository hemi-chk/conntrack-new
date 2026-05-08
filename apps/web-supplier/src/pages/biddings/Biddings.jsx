import React, { useState } from 'react';
import { AlertTriangle, Inbox, Clock, MapPin, Truck, CheckCircle2 } from 'lucide-react';
import { useBiddings } from '../../hooks/useBiddings';
import { useProfile } from '../../hooks/useProfile';
import { PlaceBidModal } from './PlaceBidModal';

export const Biddings = () => {
  const { profileData } = useProfile();
  const { biddings, myBids, isLoading, error, refreshBiddings } = useBiddings(profileData);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedBid, setSelectedBid] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sorting logic
  const sortedBiddings = [...biddings].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'urgent') return new Date(a.end_time) - new Date(b.end_time);
    return 0;
  });

  const hasAlreadyBidded = (biddingId) => {
    return myBids.some(bid => bid.bidding_id === biddingId);
  };

  const handleOpenModal = (bid) => {
    setSelectedBid(bid);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 duration-500 text-dark animate-in fade-in slide-in-from-bottom-4">

      <PlaceBidModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bid={selectedBid}
        onBidSuccess={refreshBiddings}
      />

      {/* Header Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Open Biddings</h1>
          <p className="mt-1 text-sm text-gray-500">Place your bids on available logistics orders</p>
        </div>
        <button
          onClick={refreshBiddings}
          className="p-2 text-gray-500 rounded-lg transition-colors hover:bg-gray-100"
          title="Refresh List"
        >
          <Clock size={20} />
        </button>
      </div>

      {/* Action/Filter Row */}
      <div className="flex flex-col gap-4 justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm sm:flex-row sm:items-center">

        <div className="flex gap-4 items-center">
          <label className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Sort by:</label>
          <select
            className="px-4 py-2 font-medium bg-white rounded-lg border border-gray-300 transition-all cursor-pointer outline-none text-dark focus:ring-2 focus:ring-primary"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="urgent">Ending Soon</option>
          </select>

          <span className="text-sm font-medium text-gray-500">
            {sortedBiddings.length} active biddings
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
      <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4">BIDDING ID</th>
                <th className="px-6 py-4">PICKUP</th>
                <th className="px-6 py-4">DESTINATION</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">VEHICLE TYPE</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col gap-2 items-center">
                      <div className="w-6 h-6 rounded-full border-2 animate-spin border-primary border-t-transparent"></div>
                      <p className="text-sm font-medium">Loading biddings...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedBiddings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col gap-3 items-center">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Inbox size={40} className="text-gray-300" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col gap-1 items-center">
                        <p className="text-lg font-bold tracking-tight text-gray-500">No open biddings</p>
                        <p className="max-w-xs text-sm text-gray-400">New logistics orders will appear here automatically when they are posted.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedBiddings.map((bid) => {
                  const order = bid.orders || {};
                  const alreadyBidded = hasAlreadyBidded(bid.bidding_id);
                  return (
                    <tr key={bid.bidding_id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold tracking-tight text-primary">#{bid.bidding_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 items-center">
                          <MapPin size={14} className="text-success" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-dark">{order.pickup_state}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">{order.pickup_country}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 items-center">
                          <MapPin size={14} className="text-error" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-dark">{order.destination_state}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">{order.destination_country}</span>
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
                        <div className="flex gap-2 items-center">
                          <Truck size={14} className="text-gray-400" />
                          <span className="text-sm font-semibold text-gray-600">{order.vehicle_type || 'Any'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {alreadyBidded ? (
                          <div className="flex items-center justify-center gap-1.5 py-2 px-4 bg-gray-50 rounded-lg border border-gray-200">
                            <CheckCircle2 size={14} className="text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Already Bidded</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenModal(bid)}
                            className="px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all bg-primary hover:bg-blue-800 hover:shadow-md active:scale-95"
                          >
                            PLACE BID
                          </button>
                        )}
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