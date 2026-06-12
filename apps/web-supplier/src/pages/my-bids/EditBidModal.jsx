import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';

const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-3 text-lg font-black text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all bg-white shadow-sm";
const labelCls = "block mb-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center";

export const EditBidModal = ({ isOpen, onClose, bid, onUpdateConfirm }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (bid) {
      setAmount(String(bid.bid_amount || ''));
      setError('');
    }
  }, [bid, isOpen]);

  if (!isOpen || !bid) return null;

  const formatCurrency = (val) => {
    if (!val) return '';
    const num = val.toString().replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    const numeric = val.replace(/\D/g, '');
    setAmount(numeric);
    setError('');
  };

  const handleSave = () => {
    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid bid amount.');
      return;
    }
    onUpdateConfirm(bid.bid_id, { bid_amount: parseInt(amount) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-primary text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Edit Your Bid</h2>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">Bidding #{bid.bidding_id}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="flex flex-col items-center">
            <div className="w-full">
              <label className={labelCls}>Update Bid Amount (LKR)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold pointer-events-none group-focus-within:text-primary transition-colors">LKR</div>
                <input 
                  type="text"
                  placeholder="100 000"
                  value={formatCurrency(amount)}
                  onChange={handleAmountChange}
                  className={inputCls + " pl-14"}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-3 text-center font-medium leading-tight px-4">
                Enter your revised offer. This will replace your previous bid of <span className="font-bold text-gray-600">LKR {formatCurrency(bid.bid_amount)}</span>.
              </p>
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
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!amount || parseInt(amount) === bid.bid_amount}
            className="px-8 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={14} />
            Update Bid
          </button>
        </div>

      </div>
    </div>
  );
};
