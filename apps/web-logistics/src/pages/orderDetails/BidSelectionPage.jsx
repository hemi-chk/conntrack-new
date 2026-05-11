import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Package, Map, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import BidsSection from "./BidsSection";
import OrderSummary from "./OrderSummary";
import api from "../../config/api";


export default function BidSelectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        setLoading(true);
        const response = await api.get(`/logistics/orders/${id}`);
        setOrder(response.data);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchOrderDetails();
  }, [id]);

  const handleSelectWinner = async (bid) => {
    setOrder(prev => ({
      ...prev,
      current_status: "bid_accepted",
      assigned_supplier: bid.company_name,
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

  const isAssigned = ["bid_accepted", "driver_assigned", "in_transit", "at_port", "completed"].includes(order.current_status);
  const orderAssignment = order.order_assignments?.[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* TOP NAV BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 shadow-sm sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={16} />
          Back
        </Button>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-3">
          <div className="bg-[#1E40AF] p-1.5 rounded-lg text-white">
            <Package size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {order.order_reference || `Order #${order.order_id}`}
            </p>
            <p className="text-xs text-slate-400">Bid Selection</p>
          </div>
        </div>
        <Badge variant="outline" className="capitalize bg-white ml-2">
          {order.order_type}
        </Badge>
        {isAssigned && (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto border-blue-200 text-[#1E40AF] hover:bg-blue-50"
            onClick={() => navigate(`/tracking/${order.order_id}`)}
          >
            <Map size={14} className="mr-1" /> Live Track
          </Button>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">

        {/* LEFT: Bids Section */}
        <div className="lg:col-span-2">
          <BidsSection
            orderId={order.order_id}
            disabled={isAssigned}
            currentStatus={order.current_status}
            onSelectWinner={handleSelectWinner}
          />
        </div>

        {/* RIGHT: Order Summary */}
        <div>
          <OrderSummary order={order} />
        </div>
      </div>

    </div>
  );
}
