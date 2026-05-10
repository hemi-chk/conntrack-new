import React from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useBiddings } from '../../hooks/useBiddings';
import { useVehicles } from '../../hooks/useVehicles';
import { useDrivers } from '../../hooks/useDrivers';
import {
  ClipboardList,
  Truck,
  Users,
  FileText,
  MapPin,
  Inbox
} from 'lucide-react';

export const Dashboard = () => {
  const { profileData } = useProfile();
  const { myBids, isLoading: loadingBids } = useBiddings(profileData);
  const { vehicles, isLoading: loadingVehicles } = useVehicles();
  const { drivers, isLoading: loadingDrivers } = useDrivers();

  // Active Jobs (Tracking logic: accepted & pickup date is today)
  const activeJobsData = myBids.filter(bid => {
    const status = (bid.bid_status || bid.status || '').toLowerCase();
    if (status !== 'accepted') return false;

    const bidding = Array.isArray(bid.bidding) ? bid.bidding[0] : (bid.bidding || {});
    const order = Array.isArray(bidding.orders) ? bidding.orders[0] : (bidding.orders || {});
    const pickupStr = order.pickup_date || bid.bidding?.orders?.pickup_date;

    if (!pickupStr) return false;

    const pickupDate = new Date(pickupStr);
    pickupDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return pickupDate.getTime() === today.getTime();
  });

  // Under Review Bids
  const bidsSubmittedCount = myBids.filter(bid =>
    (bid.bid_status || bid.status || '').toLowerCase() === 'under_review'
  ).length;

  // Vehicles Stats
  const totalVehicles = vehicles.length;
  const availableVehiclesCount = vehicles.filter(v => (v.availability_status || v.status)?.toLowerCase() !== 'unavailable').length;

  // Drivers Stats
  const totalDrivers = drivers.length;
  const availableDriversCount = drivers.filter(d => (d.availability_status || d.status)?.toLowerCase() !== 'unavailable').length;

  const statCards = [
    {
      title: 'Active Jobs',
      value: activeJobsData.length,
      icon: <ClipboardList className="w-6 h-6 text-primary" />,
      label: 'Currently ongoing',
    },
    {
      title: 'Vehicles',
      value: `${availableVehiclesCount}/${totalVehicles}`,
      icon: <Truck className="w-6 h-6 text-primary" />,
      label: 'Available for work',
    },
    {
      title: 'Drivers',
      value: `${availableDriversCount}/${totalDrivers}`,
      icon: <Users className="w-6 h-6 text-primary" />,
      label: 'Active on duty',
    },
    {
      title: 'Bids Submitted',
      value: bidsSubmittedCount,
      icon: <FileText className="w-6 h-6 text-primary" />,
      label: 'Pending approval',
    },
  ];

  const isLoading = loadingBids || loadingVehicles || loadingDrivers;
  const todayStr = new Date().toLocaleDateString('en-GB');

  return (
    <div className="flex flex-col gap-6 duration-500 text-dark animate-in fade-in slide-in-from-bottom-4">

      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div className="p-3 bg-blue-50 rounded-lg text-primary">
                {card.icon}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wider text-gray-500 uppercase">{card.title}</span>
              <span className="text-2xl font-bold text-dark">{card.value}</span>
              <span className="mt-1 text-xs font-medium text-gray-400">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Table (Tracking Style) */}
      <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <div className="flex gap-2 items-center">
            <h2 className="text-xl font-bold text-primary">Recent Activity</h2>
          </div>
        </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                    <div className="flex flex-col gap-2 items-center">
                      <div className="w-6 h-6 rounded-full border-2 animate-spin border-primary border-t-transparent"></div>
                      <p className="text-sm font-medium">Loading activity data...</p>
                    </div>
                  </td>
                </tr>
              ) : activeJobsData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                    <div className="flex flex-col gap-3 items-center">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Inbox size={40} className="text-gray-300" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col gap-1 items-center">
                        <p className="text-lg font-bold tracking-tight text-gray-500">No shipments for today</p>
                        <p className="max-w-xs text-sm text-center text-gray-400">Only jobs scheduled for pickup today ({todayStr}) will appear here.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                activeJobsData.map((bid) => {
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