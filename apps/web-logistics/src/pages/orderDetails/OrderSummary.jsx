import { Package, Map, Info, Truck, Weight, Calendar, ShieldCheck, Briefcase } from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/ui";
import { useNavigate } from "react-router-dom";

export default function OrderSummary({ order }) {
  const navigate = useNavigate();
  if (!order) return null;

  const isAssigned = ['bid_accepted', 'driver_assigned', 'in_transit', 'at_port', 'completed'].includes(order.current_status);
  const orderAssignment = order.order_assignments?.[0];

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-[#1E40AF] p-2.5 rounded-xl text-white shadow-md">
            <Package size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">
                {order.order_reference || `Order #${order.order_id}`}
              </h1>
              <Badge variant="outline" className="capitalize bg-blue-50/50 text-blue-700 border-blue-200">
                {order.order_type}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mt-1">
              {order.customers?.customer_name || "Internal Order"}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {isAssigned && (
            <Button
              variant="outline"
              className="border-blue-200 text-[#1E40AF] hover:bg-blue-50 shadow-sm"
              onClick={() => navigate(`/tracking/${order.order_id}`)}
            >
              <Map size={18} className="mr-2" />
              Live Track
            </Button>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <div className="bg-slate-50/75 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-xs uppercase tracking-wider">
            <Info size={14} className="text-[#1E40AF]" />
            Logistics Summary
          </h3>
          <Badge className="font-semibold border px-2.5 py-0.5 rounded-full capitalize text-xs bg-blue-50 text-blue-700 border-blue-200">
            {order.current_status?.replace(/_/g, " ")}
          </Badge>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

            {/* Left Section: Route timeline (5 cols) */}
            <div className="md:col-span-5 space-y-6 md:border-r border-slate-100 pr-0 md:pr-8">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Route Details</h4>

              <div className="relative pl-6 space-y-8 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {/* Origin */}
                <div className="relative">
                  <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Origin</p>
                  <p className="font-semibold text-sm text-slate-800 mt-0.5">
                    {order.pickup_state}, {order.pickup_country}
                  </p>
                </div>

                {/* Destination */}
                <div className="relative">
                  <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Destination</p>
                  <p className="font-semibold text-sm text-slate-800 mt-0.5">
                    {order.destination_state}, {order.destination_country}
                  </p>
                </div>
              </div>

              {/* Pickup dates summary block */}
              <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-100 space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-2"><Calendar size={14} /> Pickup Date</span>
                  <span className="font-semibold text-slate-700">{order.pickup_date || "TBD"}</span>
                </div>
              </div>
            </div>

            {/* Right Section: Details Metadata Grid (7 cols) */}
            <div className="md:col-span-7 space-y-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cargo & Assignment Info</h4>

              <div className="grid grid-cols-2 gap-y-6 gap-x-8">

                {/* Weight */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Weight size={13} className="text-slate-400" />
                    Weight
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {order.cargo_weight ? `${order.cargo_weight.toLocaleString()} kg` : "N/A"}
                  </p>
                </div>

                {/* Vehicle */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Truck size={13} className="text-slate-400" />
                    Vehicle Type
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {order.vehicle_type || "N/A"}
                  </p>
                </div>

                {/* Container No */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Package size={13} className="text-slate-400" />
                    Container No
                  </p>
                  <p className="text-sm font-mono font-semibold text-blue-700 bg-blue-50/50 w-fit px-2 py-0.5 rounded border border-blue-100">
                    {order.container_no || "N/A"}
                  </p>
                </div>

                {/* Supplier */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Briefcase size={13} className="text-slate-400" />
                    Supplier
                  </p>
                  <p className={`text-sm font-semibold ${orderAssignment?.suppliers?.company_name ? "text-slate-800" : "text-amber-600 font-medium"}`}>
                    {orderAssignment?.suppliers?.company_name || "Pending Selection"}
                  </p>
                </div>

                {/* Driver */}
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    Assigned Driver
                  </p>
                  <p className={`text-sm font-semibold ${orderAssignment?.drivers ? "text-slate-800" : "text-amber-600 font-medium"}`}>
                    {orderAssignment?.drivers
                      ? `${orderAssignment.drivers.first_name} ${orderAssignment.drivers.last_name}`
                      : "Pending Selection"}
                  </p>
                </div>

              </div>

            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
