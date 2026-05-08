import React, { useState, useEffect } from 'react';
import { X, MapPin, Truck, Calendar, Package, Send, Trash2, AlertTriangle } from 'lucide-react';

export const ViewBidModal = ({ isOpen, onClose, bid, onActionSuccess, isReadOnly }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (bid) {
      setAmount(String(bid.bid_amount || ''));
      setError('');
    }
  }, [bid, isOpen]);

  if (!isOpen || !bid) return null;

  const bidding = bid.bidding || {};
  const order = bidding.orders || {};
  const isExpired = bidding.end_time ? new Date(bidding.end_time) < new Date() : false;
  const disableActions = isExpired || isReadOnly;

  const formatCurrency = (val) => {
    if (!val) return '';
    const num = val.toString().replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const DetailItem = ({ label, value, icon: Icon }) => (
    <div className="flex flex-col">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5 text-sm font-medium text-dark">
        {Icon && <Icon size={14} className="text-gray-400" />}
        <span className="truncate">{value || 'N/A'}</span>
      </div>
    </div>
  );

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="overflow-hidden w-full max-w-4xl bg-white rounded-2xl border border-gray-100 shadow-2xl duration-200 animate-in fade-in zoom-in">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-2.5 text-white bg-primary">
          <div className="flex gap-3 items-center">
            <div className="flex overflow-hidden justify-center items-center w-10 h-10 rounded-full border-2 border-white/20 bg-white/10">
              <Package size={20} className="text-white opacity-80" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Bidding Details</h2>
              <p className="text-blue-100 text-[10px] opacity-80 uppercase font-bold tracking-widest">#{bid.bidding_id} • {order.order_type || 'N/A'}</p>
            </div>
          </div>
          <button onClick={onClose} className="transition-colors text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Status Message */}
          {(isExpired || isReadOnly) && (
            <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="text-gray-400" size={14} />
              <p className="text-[10px] text-gray-500 font-bold tracking-tight uppercase">
                {isReadOnly ? 'Viewing Bid History - Actions are disabled.' : 'Bidding period has ended.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-y-4 gap-x-8">
            <DetailItem label="Bidding ID" value={`#${bid.bidding_id}`} />
            <DetailItem label="Vehicle Type" value={order.vehicle_type} icon={Truck} />
            <DetailItem label="Order Type" value={order.order_type} icon={Package} />

            <DetailItem label="Pickup Location" value={`${order.pickup_state}, ${order.pickup_country}`} icon={MapPin} />
            <DetailItem label="Destination" value={`${order.destination_state}, ${order.destination_country}`} icon={MapPin} />
            <DetailItem label="Cargo Type" value={order.cargo_type} />

            <DetailItem label="Pickup Date" value={order.pickup_date ? new Date(order.pickup_date).toLocaleDateString('en-GB') : ''} icon={Calendar} />
            <DetailItem label="Expected Arrival" value={order.expected_arrival ? new Date(order.expected_arrival).toLocaleDateString('en-GB') : ''} icon={Calendar} />
            <DetailItem label="Cargo Weight" value={order.cargo_weight ? `${order.cargo_weight} kg` : 'N/A'} />
          </div>

          {/* Bid Amount Section - Compact */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col items-center">
            <div className="w-full max-w-[240px]">
              <label className="block mb-1 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Your Bid Amount (LKR)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold pointer-events-none">LKR</div>
                <div className="w-full border border-gray-100 bg-gray-50 rounded-xl pl-14 pr-4 py-2 text-xl font-black text-primary text-center">
                  {formatCurrency(bid.bid_amount)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 order-3 px-4 py-2 text-xs font-bold text-gray-700 bg-white rounded-xl border border-gray-200 shadow-sm transition-all sm:order-1 hover:bg-gray-50"
          >
            Back
          </button>
          
          <div className="flex-[2] order-1 sm:order-2 flex gap-2.5">
            <button
              onClick={() => onActionSuccess('edit', bid)}
              disabled={disableActions}
              className={`flex-1 px-4 py-2 text-xs font-bold rounded-xl border shadow-sm transition-all
                ${disableActions ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-primary border-primary/30 hover:bg-blue-50'}
              `}
            >
              Edit Bid
            </button>
            <button
              onClick={() => onActionSuccess('delete', bid)}
              disabled={disableActions}
              className={`flex-1 px-4 py-2 text-xs font-bold rounded-xl border shadow-sm transition-all
                ${disableActions ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-error/5 text-error border-error/20 hover:bg-error/10'}
              `}
            >
              Delete Bid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
