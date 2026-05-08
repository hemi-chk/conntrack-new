import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  FileText, 
  XCircle, 
  Star, 
  Inbox,
  AlertTriangle
} from 'lucide-react';
import { useBiddings } from '../../hooks/useBiddings';
import { useProfile } from '../../hooks/useProfile';
import { ViewBidModal } from './ViewBidModal';
import { EditBidModal } from './EditBidModal';
import { DeleteBidModal } from './DeleteBidModal';
import { updateBid, deleteBid } from '../../services/biddingService';

export const MyBids = () => {
  const { profileData } = useProfile();
  const { myBids, isLoading, error, refreshBiddings } = useBiddings(profileData);
  const [filterType, setFilterType] = useState('active'); // 'active' or 'history'
  const [selectedBid, setSelectedBid] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const formatCurrency = (val) => {
    if (!val) return '0';
    return val.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'accepted' || s === 'won') return 'bg-success/10 text-success';
    if (s === 'rejected' || s === 'lost') return 'bg-error/10 text-error';
    return 'bg-warning/10 text-warning';
  };

  const filteredBids = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return myBids.filter(bid => {
      const pickupStr = bid.bidding?.orders?.pickup_date;
      if (!pickupStr) return false;
      const pickupDate = new Date(pickupStr);
      pickupDate.setHours(0, 0, 0, 0);

      if (filterType === 'active') {
        return pickupDate > today;
      } else {
        return pickupDate < today;
      }
    });
  }, [myBids, filterType]);

  const stats = useMemo(() => {
    const total = myBids.length;
    const won = myBids.filter(b => b.bid_status?.toLowerCase() === 'accepted' || b.bid_status?.toLowerCase() === 'won').length;
    const pending = myBids.filter(b => !['accepted', 'won', 'rejected', 'lost'].includes(b.bid_status?.toLowerCase())).length;
    const lost = myBids.filter(b => b.bid_status?.toLowerCase() === 'rejected' || b.bid_status?.toLowerCase() === 'lost').length;
    const successRate = total > 0 ? Math.round((won / total) * 100) : 0;

    return [
      { title: 'Total Bids', value: String(total).padStart(2, '0'), icon: <BarChart3 className="w-6 h-6" />, label: 'All time submissions' },
      { title: 'Won', value: String(won).padStart(2, '0'), icon: <CheckCircle2 className="w-6 h-6" />, label: 'Bids accepted' },
      { title: 'Pending', value: String(pending).padStart(2, '0'), icon: <FileText className="w-6 h-6" />, label: 'Awaiting decision' },
      { title: 'Lost', value: String(lost).padStart(2, '0'), icon: <XCircle className="w-6 h-6" />, label: 'Bids rejected' },
      { title: 'Success Rate', value: `${successRate}%`, icon: <Star className="w-6 h-6" />, label: 'Performance score' },
    ];
  }, [myBids]);

  const handleViewDetails = (bid) => {
    setSelectedBid(bid);
    setIsViewModalOpen(true);
  };

  const handleActionFromView = (action, bid) => {
    setSelectedBid(bid);
    setIsViewModalOpen(false);
    if (action === 'edit') setIsEditModalOpen(true);
    if (action === 'delete') setIsDeleteModalOpen(true);
  };

  const handleUpdateBid = async (id, data) => {
    try {
      await updateBid(id, data);
      alert("Bid Updated Successfully!");
      setIsEditModalOpen(false);
      refreshBiddings();
    } catch (err) {
      alert("Error updating bid: " + err.message);
    }
  };

  const handleDeleteBid = async (id) => {
    try {
      await deleteBid(id);
      alert("Bid Deleted Successfully!");
      setIsDeleteModalOpen(false);
      refreshBiddings();
    } catch (err) {
      alert("Error deleting bid: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-dark animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <ViewBidModal 
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        bid={selectedBid}
        onActionSuccess={handleActionFromView}
        isReadOnly={filterType === 'history'}
      />

      <EditBidModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        bid={selectedBid}
        onUpdateConfirm={handleUpdateBid}
      />

      <DeleteBidModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        bid={selectedBid}
        onDeleteConfirm={handleDeleteBid}
      />

      {/* Header Title & Dropdown */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">My Bids</h1>
        <div className="flex gap-4 items-center">
          <select
            className="px-4 py-2 font-semibold bg-white rounded-xl border border-gray-200 shadow-sm outline-none text-dark focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all cursor-pointer text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="active">My Bids</option>
            <option value="history">Bid History</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((card, idx) => (
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

      {/* Table Container */}
      {error && (
        <div className="flex gap-3 items-center px-4 py-3 bg-blue-50 rounded-lg border border-primary text-primary">
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
                <th className="px-6 py-4">PICKUP DATE</th>
                <th className="px-6 py-4">AMOUNT LKR</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Loading your bids...
                  </td>
                </tr>
              ) : filteredBids.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Inbox size={40} className="text-gray-300" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-gray-500 font-bold text-lg tracking-tight">No records found</p>
                        <p className="text-gray-400 text-sm max-w-xs text-center">There are no bids matching your current filter.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBids.map((bid) => (
                  <tr key={bid.bid_id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-primary text-sm tracking-tight">
                      #{bid.bidding_id}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {bid.bidding?.orders?.pickup_date ? new Date(bid.bidding.orders.pickup_date).toLocaleDateString('en-GB') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-bold text-dark text-sm">
                      {formatCurrency(bid.bid_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusStyle(bid.bid_status || bid.status)}`}>
                        {bid.bid_status || bid.status || 'Pending'}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};