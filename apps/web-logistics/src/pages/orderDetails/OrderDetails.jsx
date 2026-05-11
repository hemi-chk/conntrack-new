import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Package, Map, ShieldCheck, Info, Truck,
  Calendar, Anchor, Weight, Briefcase, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OrderSummary from "./OrderSummary";
import api from "../../config/api";
import { FiFileText, FiCheckCircle } from "react-icons/fi";

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

      {/* Navigation to Individual Pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* Bid Selection Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-100 bg-white" onClick={() => navigate(`/orders/${order.order_id}/bids`)}>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-[#1E40AF] rounded-xl">
                <FiCheckCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Bid Selection</h3>
                <p className="text-sm text-slate-500">Manage and finalize carrier bids</p>
              </div>
            </div>
            <Button variant="ghost">Manage</Button>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 bg-white" onClick={() => navigate(`/orders/${order.order_id}/documents`)}>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                <FiFileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Documents</h3>
                <p className="text-sm text-slate-500">Upload and view shipment files</p>
              </div>
            </div>
            <Button variant="ghost">View</Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}