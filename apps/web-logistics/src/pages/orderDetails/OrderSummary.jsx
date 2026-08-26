import {
  Calendar,
  CheckCircle2,
  Container,
  Info,
  Map,
  Package,
  Truck,
  User,
  Weight
} from "lucide-react";

import { Badge, Button, Card, CardContent } from "@conntrack/ui/shadcn";
import { useNavigate } from "react-router-dom";

export default function OrderSummary({ order }) {
  const navigate = useNavigate();

  if (!order) return null;

  const isAssigned = [
    "bid_accepted",
    "driver_assigned",
    "in_transit",
    "at_port",
    "completed",
  ].includes(order.current_status);

  const orderAssignment = order.order_assignments?.[0];

  const supplierName =
    orderAssignment?.suppliers?.company_name || "Pending Selection";

  const driverName = orderAssignment?.drivers
    ? `${orderAssignment.drivers.first_name} ${orderAssignment.drivers.last_name}`
    : "Pending Selection";

  const formatStatus = (status) => {
    if (!status) return "Pending";

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const statusStyles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    bidding_open: "bg-blue-50 text-blue-700 border-blue-200",
    bid_accepted: "bg-indigo-50 text-indigo-700 border-indigo-200",
    driver_assigned: "bg-purple-50 text-purple-700 border-purple-200",
    in_transit: "bg-cyan-50 text-cyan-700 border-cyan-200",
    at_port: "bg-orange-50 text-orange-700 border-orange-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const currentStatusStyle =
    statusStyles[order.current_status] ||
    "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="space-y-5">
      {/* ===================================================== */}
      {/* SUMMARY HEADER */}
      {/* ===================================================== */}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#052659] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Package size={21} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-extrabold text-slate-900 truncate">
                    {order.order_reference ||
                      `Order #${order.order_id}`}
                  </h2>

                  <Badge
                    variant="outline"
                    className="capitalize text-[10px] font-bold border-slate-200"
                  >
                    {order.order_type}
                  </Badge>
                </div>

                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  {order.customers?.customer_name ||
                    "Internal Order"}
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`shrink-0 text-[10px] font-bold rounded-full px-2.5 py-1 ${currentStatusStyle}`}
            >
              {formatStatus(order.current_status)}
            </Badge>
          </div>

          {/* Live Tracking */}

          {isAssigned && (
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/tracking/${order.order_id}`)
              }
              className="
                w-full mt-4
                h-10
                rounded-xl
                border-blue-200
                text-[#052659]
                hover:bg-blue-50
                hover:border-blue-300
                font-bold text-xs
              "
            >
              <Map size={15} className="mr-2" />
              View Live Tracking
            </Button>
          )}
        </div>
      </div>

      {/* ===================================================== */}
      {/* LOGISTICS SUMMARY */}
      {/* ===================================================== */}

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        {/* Header */}

        <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <Info size={14} className="text-[#1E40AF]" />
            </div>

            <div>
              <p className="text-xs font-extrabold text-slate-800">
                Logistics Summary
              </p>

              <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400">
                Shipment Information
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-5 space-y-5">
          {/* ================================================= */}
          {/* ROUTE */}
          {/* ================================================= */}

          <div className="relative">
            <div className="flex gap-3">
              {/* Origin */}

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1E40AF]" />
                </div>

                <div className="w-px h-10 bg-slate-200" />
              </div>

              <div className="flex-1 pb-3">
                <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400">
                  Origin
                </p>

                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {order.pickup_state || "N/A"}
                  {order.pickup_country
                    ? `, ${order.pickup_country}`
                    : ""}
                </p>
              </div>
            </div>

            {/* Destination */}

            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2
                    size={15}
                    className="text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400">
                  Destination
                </p>

                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {order.destination_state || "N/A"}
                  {order.destination_country
                    ? `, ${order.destination_country}`
                    : ""}
                </p>
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* CARGO INFORMATION */}
          {/* ================================================= */}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Weight
                  size={13}
                  className="text-slate-400"
                />

                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                  Weight
                </span>
              </div>

              <p className="text-sm font-extrabold text-slate-800">
                {order.cargo_weight
                  ? `${order.cargo_weight} kg`
                  : "N/A"}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Truck
                  size={13}
                  className="text-slate-400"
                />

                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                  Vehicle
                </span>
              </div>

              <p className="text-sm font-extrabold text-slate-800 truncate">
                {order.vehicle_type || "N/A"}
              </p>
            </div>
          </div>

          {/* ================================================= */}
          {/* ASSIGNMENT */}
          {/* ================================================= */}

          <div className="border-t border-slate-100 pt-5 space-y-3">
            <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400">
              Assignment
            </p>

            {/* Supplier */}

            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <BriefcaseIcon />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase font-bold text-slate-400">
                  Supplier
                </p>

                <p className="text-xs font-bold text-slate-800 truncate">
                  {supplierName}
                </p>
              </div>

              {orderAssignment?.suppliers?.company_name && (
                <CheckCircle2
                  size={15}
                  className="text-emerald-500 shrink-0"
                />
              )}
            </div>

            {/* Driver */}

            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <User
                  size={16}
                  className="text-purple-600"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase font-bold text-slate-400">
                  Driver
                </p>

                <p className="text-xs font-bold text-slate-800 truncate">
                  {driverName}
                </p>
              </div>

              {orderAssignment?.drivers && (
                <CheckCircle2
                  size={15}
                  className="text-emerald-500 shrink-0"
                />
              )}
            </div>
          </div>

          {/* ================================================= */}
          {/* CONTAINER */}
          {/* ================================================= */}

          <div className="bg-[#052659]/5 border border-blue-100 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-blue-100 flex items-center justify-center">
                <Container
                  size={16}
                  className="text-[#052659]"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase font-bold text-slate-400">
                  Container Number
                </p>

                <p className="font-mono text-sm font-extrabold text-[#052659] truncate">
                  {order.container_no || "Not Assigned"}
                </p>
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* PICKUP DATE */}
          {/* ================================================= */}

          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Calendar
                size={15}
                className="text-[#1E40AF]"
              />

              <span className="text-xs font-semibold text-slate-500">
                Pickup Date
              </span>
            </div>

            <span className="text-xs font-extrabold text-slate-800">
              {order.pickup_date || "TBD"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================================================= */
/* SMALL ICON HELPER */
/* ========================================================= */

function BriefcaseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-blue-600"
    >
      <rect
        width="20"
        height="14"
        x="2"
        y="7"
        rx="2"
        ry="2"
      />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M2 12h20" />
    </svg>
  );
}