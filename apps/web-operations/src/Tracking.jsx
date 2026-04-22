import { useState } from "react";
import {
  Search,
  Truck,
  CheckCircle,
  Ship,
  PackageOpen,
  CalendarDays,
} from "lucide-react";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Fix Leaflet marker icon issue */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

function Tracking() {
  const [search, setSearch] = useState("");

  const orders = [
    {
      orderId: "EXP-1023",
      type: "EXPORT",
      pickup: "Colombo Port",
      destination: "Dubai - Jebel Ali",
      containerNo: "MSCU4567891",
      vehicleNo: "CB-7532",
      supplier: "Prime Freight",
      driver: "Peter Silva",
    },
    {
      orderId: "IMP-2044",
      type: "IMPORT",
      pickup: "Qatar Port",
      destination: "Colombo Port",
      containerNo: "TGHU9081723",
      vehicleNo: "WP-AB-4567",
      supplier: "OceanLink",
      driver: "Nimal Perera",
    },
    {
      orderId: "EXP-3301",
      type: "EXPORT",
      pickup: "Brazil Port",
      destination: "Hamburg",
      containerNo: "MAEU3344556",
      vehicleNo: "CP-CD-8910",
      supplier: "Global Trans",
      driver: "Ruwan Fernando",
    },
    {
      orderId: "IMP-5542",
      type: "IMPORT",
      pickup: "Singapore",
      destination: "Colombo Warehouse",
      containerNo: "OOLU7788990",
      vehicleNo: "SP-EF-2222",
      supplier: "SkyCargo",
      driver: "Saman Wijesinghe",
    },
  ];

  const filteredOrders = orders.filter((order) =>
    order.orderId.toLowerCase().includes(search.toLowerCase())
  );

  const steps = [
    { id: 1, label: "Pending Pickup" },
    { id: 2, label: "Awaiting Clearance" },
    { id: 3, label: "In Transit", time: "25 Feb 2026 10:45 AM" },
    { id: 4, label: "Delivered" },
  ];

  return (
    <div className="bg-[#EFF6FF] p-6 h-full overflow-auto space-y-6">
      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search by Order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none text-sm text-[#1E293B] placeholder:text-slate-400"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#EFF6FF] text-[#1E293B] text-sm font-medium border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 text-left">Order ID</th>
              <th className="px-4 text-left">Type</th>
              <th className="px-4 text-left">Pickup</th>
              <th className="px-4 text-left">Destination</th>
              <th className="px-4 text-left">Container No</th>
              <th className="px-4 text-left">Vehicle No</th>
              <th className="px-4 text-left">Supplier</th>
              <th className="px-4 text-left">Driver</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-[#1E293B]">{order.orderId}</td>
                  <td className="px-4 text-[#1E293B]">{order.type}</td>
                  <td className="px-4 text-[#1E293B]">{order.pickup}</td>
                  <td className="px-4 text-[#1E293B]">{order.destination}</td>
                  <td className="px-4 text-[#1E293B]">{order.containerNo}</td>
                  <td className="px-4 text-[#1E293B]">{order.vehicleNo}</td>
                  <td className="px-4 text-[#1E293B]">{order.supplier}</td>
                  <td className="px-4 text-[#1E293B]">{order.driver}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-6 text-slate-500">
                  No matching order found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* STATUS */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between mb-6">
          <h3 className="font-semibold text-lg text-[#1E293B]">
            Status <span className="text-[#16A34A] text-sm">22 Days Remaining</span>
          </h3>
          <span className="text-sm text-slate-500 flex items-center gap-1">
            <CalendarDays size={16} />
            Expected Day: 28 Feb 2026
          </span>
        </div>

        <div className="flex items-center justify-between relative">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 text-center relative">
              {index !== steps.length - 1 && (
                <div className="absolute top-4 left-1/2 w-full h-1 bg-slate-200 z-0">
                  <div className="h-1 bg-[#16A34A] w-full" />
                </div>
              )}
              <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm bg-[#16A34A] text-white relative z-10">
                {step.id}
              </div>
              <p className="text-sm mt-2 font-medium text-[#1E293B]">{step.label}</p>
              {step.time && (
                <p className="text-xs text-slate-500">{step.time}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MAP */}
      <div className="bg-white rounded-xl shadow p-4">
        <MapContainer
          center={[6.9271, 79.8612]}
          zoom={5}
          className="h-72 rounded-lg"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={[6.9271, 79.8612]}>
            <Popup>Colombo Port</Popup>
          </Marker>

          <Marker position={[25.2048, 55.2708]}>
            <Popup>Dubai - Jebel Ali</Popup>
          </Marker>

          <Polyline
            positions={[
              [6.9271, 79.8612],
              [15, 65],
              [25.2048, 55.2708],
            ]}
            color="#1E40AF"
          />
        </MapContainer>
      </div>

      {/* SHIPMENT HISTORY */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h3 className="text-lg font-semibold text-[#1E293B]">Shipment History</h3>
        </div>

        <div className="space-y-6 text-sm">
          <div className="flex items-start gap-4">
            <Truck size={18} className="text-[#16A34A] mt-1" />
            <div>
              <p className="font-medium text-[#1E293B]">En Route</p>
              <p className="text-slate-500">
                26 Feb 2026 - Container in transit - Arabian Sea
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Ship size={18} className="text-[#EA580C] mt-1" />
            <div>
              <p className="font-medium text-[#1E293B]">Customs Clearance</p>
              <p className="text-slate-500">
                25 Feb 2026 - Colombo Port
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <PackageOpen size={18} className="text-[#1E40AF] mt-1" />
            <div>
              <p className="font-medium text-[#1E293B]">Picked Up</p>
              <p className="text-slate-500">
                25 Feb 2026 - Peter Silva - Colombo Port
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <CheckCircle size={18} className="text-slate-400 mt-1" />
            <div>
              <p className="font-medium text-[#1E293B]">Order Created</p>
              <p className="text-slate-500">
                24 Feb 2026 - Colombo Port
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tracking;