import { Package, Map, Info, Truck, Weight, Calendar, ShieldCheck, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function OrderSummary({ order }) {
  const navigate = useNavigate();
  if (!order) return null;

  const isAssigned = ['bid_accepted', 'driver_assigned', 'in_transit', 'at_port', 'completed'].includes(order.current_status);
  const orderAssignment = order.order_assignments?.[0];

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-[#1E40AF] p-2.5 rounded-xl text-white shadow-lg">
            <Package size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#1E293B]">
                {order.order_reference || `Order #${order.order_id}`}
              </h1>
              <Badge variant="outline" className="capitalize bg-white">
                {order.order_type}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">
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
      <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
          <h3 className="font-bold text-[#334155] flex items-center gap-2 text-xs uppercase tracking-widest">
            <Info size={14} className="text-[#1E40AF]" />
            Logistics Summary
          </h3>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="relative pl-6 space-y-8 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            <div className="relative">
              <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-blue-500 bg-white" />
              <p className="text-[10px] uppercase font-bold text-slate-400">Origin</p>
              <p className="font-semibold text-sm text-[#1E293B]">
                {order.pickup_state}, {order.pickup_country}
              </p>
            </div>
            <div className="relative">
              <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-emerald-500 bg-white" />
              <p className="text-[10px] uppercase font-bold text-slate-400">Destination</p>
              <p className="font-semibold text-sm text-[#1E293B]">
                {order.destination_state}, {order.destination_country}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Weight size={14} />
                <span className="text-[10px] uppercase font-bold">Weight</span>
              </div>
              <p className="text-sm font-semibold">{order.cargo_weight} kg</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Truck size={14} />
                <span className="text-[10px] uppercase font-bold">Vehicle</span>
              </div>
              <p className="text-sm font-semibold">{order.vehicle_type}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Supplier</span>
              <span className="font-bold text-[#1E293B]">
                {orderAssignment?.suppliers?.company_name || "Pending Selection"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Driver</span>
              <span className="font-bold text-[#1E293B]">
                {orderAssignment?.drivers
                  ? `${orderAssignment.drivers.first_name} ${orderAssignment.drivers.last_name}`
                  : "Pending Selection"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Container No</span>
              <span className="font-mono text-[#1E40AF] font-bold">
                {order.container_no || "N/A"}
              </span>
            </div>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar size={14} /> <span>Pickup Date</span>
              </div>
              <span className="font-semibold">{order.pickup_date || "TBD"}</span>
            </div>
          </div>


        </CardContent>
      </Card>
    </div>
  );
}
