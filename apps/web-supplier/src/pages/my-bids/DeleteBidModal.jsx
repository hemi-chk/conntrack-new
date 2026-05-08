import React from 'react';

export const DeleteBidModal = ({ isOpen, onClose, bid, onDeleteConfirm }) => {
  if (!isOpen || !bid) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Delete Bid?</h2>
          </div>
          <p className="text-gray-500 mb-8">
            Are you sure you want to remove your bid for <span className="font-semibold text-gray-700">#{bid.bidding_id}</span>? 
            This action cannot be undone and you will lose your spot in this bidding.
          </p>
          
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              No, Keep
            </button>
            <button 
              onClick={() => onDeleteConfirm(bid.bid_id)}
              className="flex-1 px-4 py-2.5 bg-error hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
