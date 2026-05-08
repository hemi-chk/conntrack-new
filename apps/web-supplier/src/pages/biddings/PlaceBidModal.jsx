import React, { useState } from 'react';
import { X, AlertTriangle, Send, DollarSign, MapPin, Truck, Calendar, Package } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { submitBid } from '../../services/biddingService';

const inputCls = "w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white";
const labelCls = "block mb-0.5 text-xs font-semibold text-gray-600";

export const PlaceBidModal = ({ isOpen, onClose, bid, onBidSuccess }) => {
  const { profileData } = useProfile();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !bid) return null;

  const order = bid.orders || {};

  const formatCurrency = (val) => {
    if (!val) return '';
    const num = val.replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    const numeric = val.replace(/\D/g, '');
    setAmount(numeric);
    setError('');
  };

  const handleSubmit = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid bid amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      const supplierId = profileData?.id || profileData?.supplier_id;
      
      const payload = {
        bidding_id: bid.bidding_id,
        order_id: bid.order_id,
        supplier_id: supplierId,
        bid_amount: parseInt(amount),
        eta: new Date().toISOString().split('T')[0]
      };

      await submitBid(payload);
      onBidSuccess();
      onClose();
      setAmount('');
    } catch (err) {
      setError(err.message || 'Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ReadOnlyField = ({ label, value, icon: Icon }) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700">
        {Icon && <Icon size={14} className="text-gray-400" />}
        <span className="truncate">{value || 'N/A'}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-gray-100 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-primary">Place Bid</h2>
              <div className="flex flex-col mt-0.5">
                <p className="text-xs text-primary/70 font-medium">Review order details and submit your price for Bidding #{bid.bidding_id}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-error">
                  <AlertTriangle size={12} />
                  <span>BID CLOSE AT: {bid.end_time ? new Date(bid.end_time).toLocaleString('en-GB') : 'N/A'}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            <ReadOnlyField label="Bidding ID" value={`#${bid.bidding_id}`} />
            <ReadOnlyField label="Vehicle Type" value={order.vehicle_type} icon={Truck} />
            <ReadOnlyField label="Order Type" value={order.order_type} icon={Package} />

            <ReadOnlyField label="Pickup Location" value={`${order.pickup_state}, ${order.pickup_country}`} icon={MapPin} />
            <ReadOnlyField label="Destination" value={`${order.destination_state}, ${order.destination_country}`} icon={MapPin} />
            <ReadOnlyField label="Cargo Type" value={order.cargo_type} />

            <ReadOnlyField label="Pickup Date" value={order.pickup_date ? new Date(order.pickup_date).toLocaleDateString('en-GB') : ''} icon={Calendar} />
            <ReadOnlyField label="Expected Arrival" value={order.expected_arrival ? new Date(order.expected_arrival).toLocaleDateString('en-GB') : ''} icon={Calendar} />
            <ReadOnlyField label="Cargo Weight" value={order.cargo_weight} />
          </div>

          {/* Bid Submission - Simple Design */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col items-center">
            <div className="w-full max-w-[240px]">
              <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-tight">Your Bid Amount (LKR)</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none group-focus-within:text-primary transition-colors">LKR</div>
                <input 
                  type="text"
                  placeholder="100 000"
                  value={formatCurrency(amount)}
                  onChange={handleAmountChange}
                  className="w-full border border-gray-300 rounded-lg pl-11 pr-3 py-2 text-lg font-black text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 font-medium leading-tight">Price must include all relevant taxes, fuel, and service charges.</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-2.5 bg-red-50 border border-red-100 text-error text-[10px] font-bold rounded-xl flex items-center gap-2 justify-center animate-shake">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !amount}
            className="px-8 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send size={14} />
            )}
            Submit
          </button>
        </div>

      </div>
    </div>
  );
};
