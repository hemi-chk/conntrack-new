import React, { useState, useEffect } from 'react';
import { X, MapPin, Truck, Calendar, Package, User, AlertTriangle, Save, CheckCircle2 } from 'lucide-react';
import { useDrivers } from '../../hooks/useDrivers';
import { useVehicles } from '../../hooks/useVehicles';
import { updateBid } from '../../services/biddingService';

export const JobDetailsModal = ({ isOpen, onClose, bid, isReadOnly, onUpdateSuccess }) => {
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (bid && isOpen) {
      setSelectedDriver(bid.driver_id || '');
      setSelectedVehicle(bid.vehicle_id || '');
    }
  }, [bid, isOpen]);

  if (!isOpen || !bid) return null;

  const bidding = bid.bidding || {};
  const order = bidding.orders || {};

  const handleAssign = async () => {
    try {
      setIsUpdating(true);
      await updateBid(bid.bid_id, {
        driver_id: selectedDriver || null,
        vehicle_id: selectedVehicle || null
      });
      alert('Assignment updated successfully!');
      if (onUpdateSuccess) onUpdateSuccess();
      onClose();
    } catch (err) {
      alert('Failed to update assignment: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter drivers for the supplier and with PASSED compliance status
  // System logic for "PASSED": Has user_id AND no removal/deactivation reasons
  const filteredDrivers = drivers.filter(d => {
    const hasUserId = d.user_id !== null && d.user_id !== undefined && d.user_id !== '';
    const isNotRemoved = !d.removal_reason;
    const isNotDeactivated = !d.deactivation_reason;
    
    // As per user: "show drivers work under login supplier and not null user_id"
    // AND "Compliance Status as PASSED"
    return hasUserId && isNotRemoved && isNotDeactivated;
  });

  const ReadOnlyField = ({ label, value, icon: Icon, fullWidth }) => (
    <div className={fullWidth ? 'col-span-4' : ''}>
      <label className="block mb-0.5 text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</label>
      <div className={`flex items-center gap-2 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-dark ${fullWidth ? 'min-h-[32px]' : ''}`}>
        {Icon && <Icon size={12} className="text-gray-400" />}
        <span className={fullWidth ? 'whitespace-pre-wrap leading-tight' : 'truncate'}>{value || 'N/A'}</span>
      </div>
    </div>
  );

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-gray-900/40">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-gray-100 shadow-2xl duration-200 animate-in fade-in zoom-in">
        
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-primary leading-none">Job Details</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[10px] text-primary/70 font-bold uppercase tracking-wider">Bidding ID: #{bid.bidding_id}</p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-success uppercase">
                <CheckCircle2 size={10} />
                <span>Accepted</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-4 gap-y-2.5 gap-x-4">
            <ReadOnlyField label="Bidding ID" value={`#${bid.bidding_id}`} />
            <ReadOnlyField label="Vehicle Type" value={order.vehicle_type} icon={Truck} />
            <ReadOnlyField label="Order Type" value={order.order_type} icon={Package} />
            <ReadOnlyField label="Pickup Date" value={order.pickup_date ? new Date(order.pickup_date).toLocaleDateString('en-GB') : ''} icon={Calendar} />

            <ReadOnlyField label="Pickup Location" value={`${order.pickup_state}, ${order.pickup_country}`} icon={MapPin} />
            <ReadOnlyField label="Destination" value={`${order.destination_state}, ${order.destination_country}`} icon={MapPin} />
            <ReadOnlyField label="Cargo Type" value={order.cargo_type} />
            <ReadOnlyField label="Expected Arrival" value={order.expected_arrival ? new Date(order.expected_arrival).toLocaleDateString('en-GB') : ''} icon={Calendar} />

            <ReadOnlyField label="Cargo Weight" value={order.cargo_weight ? `${order.cargo_weight} kg` : 'N/A'} />
            <ReadOnlyField label="Container No" value={order.container_no} />
            <ReadOnlyField label="Bid Amount" value={bid.bid_amount?.toLocaleString('en-LK')} />
            <div></div>

            <ReadOnlyField label="Special Instructions" value={order.special_instructions} fullWidth={true} />
          </div>

          {/* Assignment Section */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2.5">
              <User size={14} className="text-primary" />
              <h3 className="text-[11px] font-black text-dark uppercase tracking-wider">Resource Assignment</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Assign Driver</label>
                <select
                  disabled={isReadOnly || isUpdating}
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  <option value="">Select Driver (Empty)</option>
                  {filteredDrivers.map(d => (
                    <option key={d.driver_id} value={d.driver_id}>
                      {d.first_name} {d.last_name} ({d.emp_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Assign Vehicle</label>
                <select
                  disabled={isReadOnly || isUpdating}
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  <option value="">Select Vehicle (Empty)</option>
                  {vehicles.map(v => (
                    <option key={v.vehicle_number} value={v.id || v.vehicle_id || v.vehicle_number}>
                      {v.vehicle_number} ({v.vehicle_type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isReadOnly && (
              <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-500" />
                <p className="text-[10px] text-gray-500 font-medium italic">History mode: Assignments cannot be modified.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all"
          >
            Close
          </button>
          {!isReadOnly && (
            <button
              onClick={handleAssign}
              disabled={isUpdating}
              className="px-6 py-1.5 text-xs font-bold text-white bg-primary hover:bg-blue-800 rounded-lg transition-all shadow-md flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isUpdating ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save size={14} />
              )}
              {isUpdating ? 'Saving...' : 'Save Assignment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
