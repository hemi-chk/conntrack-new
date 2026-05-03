import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package, Map, ShieldCheck, Info, Truck,
  Calendar, Anchor, Weight, Briefcase, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BidsSection from "./BidsSection";
import { supabase } from "@/config/supabase"; // Ensure you have this export

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        setLoading(true);
        // We fetch order details and join the supplier name from the order_assignments 
        // or just check the current_status
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            customers (customer_name),
            order_assignments (
              suppliers (company_name)
            )
          `)
          .eq("order_id", id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchOrderDetails();
  }, [id]);

  const handleSelectWinner = async (bid) => {
    // Logic to update Supabase status to 'bid_accepted'
    // This would typically involve calling your backend or supabase directly
    // and then refreshing the local state
    setOrder(prev => ({
      ...prev,
      current_status: 'bid_accepted',
      assigned_supplier: bid.company_name
    }));
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  if (error || !order) return (
    <div className="p-20 text-center">
      <h2 className="text-xl font-bold text-red-600">Order not found</h2>
      <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  const isAssigned = ['bid_accepted', 'driver_assigned', 'in_transit', 'at_port', 'completed'].includes(order.current_status);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">

      {/* Header */}
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
          <Button variant="ghost" onClick={() => navigate(-1)}>Close</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: Bidding Workflow */}
        <div className="lg:col-span-2 space-y-6">
          <BidsSection
            orderId={order.order_id}
            disabled={isAssigned}
            currentStatus={order.current_status}
            onSelectWinner={handleSelectWinner}
          />
        </div>

        {/* RIGHT: Logistics Summary Card */}
        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm rounded-xl sticky top-24 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
              <h3 className="font-bold text-[#334155] flex items-center gap-2 text-xs uppercase tracking-widest">
                <Info size={14} className="text-[#1E40AF]" />
                Logistics Summary
              </h3>
            </div>
            <CardContent className="p-6 space-y-6">

              {/* Route Details */}
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

              {/* Cargo Specs */}
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

              {/* Assignments */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Supplier</span>
                  <span className="font-bold text-[#1E293B]">
                    {order.order_assignments?.[0]?.suppliers?.company_name || "Pending Selection"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Container No</span>
                  <span className="font-mono text-[#1E40AF] font-bold">
                    {order.container_no || "N/A"}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-blue-50/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={14} /> <span>Pickup Date</span>
                  </div>
                  <span className="font-semibold">{order.pickup_date || "TBD"}</span>
                </div>
              </div>

              {/* Tracking Status */}
              <div className="pt-2">
                {isAssigned ? (
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex gap-3">
                    <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
                    <p className="text-[11px] text-emerald-700 leading-tight">
                      Order is locked. Supplier <b>{order.order_assignments?.[0]?.suppliers?.company_name}</b> has been officially assigned to this trip.
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3">
                    <Briefcase className="text-amber-600 shrink-0" size={18} />
                    <p className="text-[11px] text-amber-700 leading-tight">
                      Waiting for supplier bidding to conclude before tracking becomes active.
                    </p>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}