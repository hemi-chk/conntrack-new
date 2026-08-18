import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Package, Map, ShieldCheck, Info, Truck,
  Calendar, Anchor, Weight, Briefcase, Loader2,
  CheckCircle2, FileText
} from "lucide-react";
import { Button, Card, CardContent, Badge } from "@/ui";
import OrderSummary from "./OrderSummary";
import TrackingMeter from "./TrackingMeter";
import api from "../../config/api";


export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6 max-w-7xl mx-auto">

      {/* Reusable Order Summary Component */}
      <OrderSummary order={order} />

      {/* Tracking Meter Component */}
      <TrackingMeter orderId={order.order_id} orderType={order.order_type} />

      {/* Action Buttons */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-4 flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">Quick Actions</p>

        <Button
          variant="outline"
          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm gap-2 h-10 px-4 rounded-lg font-semibold transition-all"
          onClick={() => navigate(`/orders/${order.order_id}/bids`)}
        >
          <CheckCircle2 size={16} className="text-emerald-600" />
          Bid Selection
        </Button>

        <Button
          variant="outline"
          className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm gap-2 h-10 px-4 rounded-lg font-semibold transition-all"
          onClick={() => navigate(`/orders/${order.order_id}/documents`)}
        >
          <FileText size={16} className="text-blue-600" />
          Documents
        </Button>
      </div>


    </div>
  );
}
