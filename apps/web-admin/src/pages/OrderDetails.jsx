import { useState, useEffect } from 'react'
import { ArrowLeft, Package, User, Truck, MapPin, AlertCircle, Building2, Briefcase, Mail, Phone, X, Calendar, Weight } from 'lucide-react'
import { adminAPI } from '../services/api'

function OrderDetails({ orderId, onNavigate }) {
  const [popupType, setPopupType] = useState(null)
  const [popupData, setPopupData] = useState(null)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orders = await adminAPI.getOrders()
        const found = orders.find(o => String(o.order_id) === String(orderId))
        setOrder(found || null)
      } catch (error) {
        console.error('Failed to fetch order:', error)
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  const getStatusColors = (status) => {
    switch (status) {
      case 'in_transit': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'completed': return 'bg-green-50 text-green-700 border-green-200'
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
      case 'open_for_bids': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'bid_accepted': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'driver_assigned': return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      case 'at_port': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'at_freezone': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500">Loading order details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Package size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Order Not Found</h2>
        <p className="text-slate-500 mb-6">The order "{orderId}" does not exist or has been removed.</p>
        <button
          onClick={() => onNavigate('/orders')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <ArrowLeft size={16} />
          Go Back to Orders
        </button>
      </div>
    )
  }

  const handleEntityClick = (type, data) => {
    if (!data) return
    setPopupType(type)
    setPopupData(data)
  }

  return (
    <div className="space-y-6 relative">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('/orders')}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{order.order_reference}</h1>
          <p className="text-sm text-slate-500 mt-1">Detailed tracking & operations profile</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border ${getStatusColors(order.current_status)}`}>
            {order.current_status?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Route Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-[#1E293B] flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
              <MapPin className="text-blue-600" size={20} />
              Route & Logistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Origin</span>
                <p className="text-lg font-semibold text-[#1E293B] mb-1">
                  {order.pickup_state || 'N/A'}, {order.pickup_country || 'N/A'}
                </p>
                <p className="text-sm text-slate-500">Pickup: {order.pickup_date || 'N/A'}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 block">Destination</span>
                <p className="text-lg font-semibold text-[#1E40AF] mb-1">
                  {order.destination_state || 'N/A'}, {order.destination_country || 'N/A'}
                </p>
                <p className="text-sm text-blue-600/70">Expected: {order.expected_arrival || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Order Type</p>
                  <p className="text-sm font-bold text-[#1E293B] mt-1 capitalize">{order.order_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium">Container No.</p>
                  <p className="text-sm font-bold text-[#1E293B] mt-1">{order.container_no || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium">Order Date</p>
                  <p className="text-sm font-bold text-[#1E293B] mt-1">{order.order_date || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cargo Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-[#1E293B] flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
              <Package className="text-blue-600" size={20} />
              Cargo Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">Cargo Type</p>
                <p className="font-semibold text-slate-800 mt-1">{order.cargo_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Vehicle Type</p>
                <p className="font-semibold text-slate-800 mt-1">{order.vehicle_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Cargo Weight</p>
                <p className="font-semibold text-slate-800 mt-1">{order.cargo_weight ? `${order.cargo_weight} kg` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Customer</p>
                <p className="font-semibold text-slate-800 mt-1">{order.customers?.customer_name || 'N/A'}</p>
              </div>
            </div>
            {order.special_instructions && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Special Instructions</p>
                <p className="text-sm text-amber-800">{order.special_instructions}</p>
              </div>
            )}
          </div>

          {/* Transport Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-[#1E293B] flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
              <Truck className="text-blue-600" size={20} />
              Transport Details
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div
                onClick={() => handleEntityClick('driver', {
                  first_name: order.driver_name?.split(' ')[0] || 'N/A',
                  last_name: order.driver_name?.split(' ').slice(1).join(' ') || '',
                  status: 'Active',
                  license_number: 'N/A'
                })}
                className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition group relative"
              >
                <div className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 text-xs text-blue-500 font-medium transition-opacity">View →</div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                  <User className="text-slate-400 group-hover:text-blue-600 transition" size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Driver</p>
                  <p className="font-bold text-slate-800 mt-1">{order.driver_name || 'Not assigned'}</p>
                </div>
              </div>

              <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                  <Truck className="text-slate-400" size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Vehicle Type</p>
                  <p className="font-bold text-slate-800 mt-1">{order.vehicle_type || 'Not assigned'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-[#1E293B] flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
              <Briefcase className="text-blue-600" size={20} />
              Involved Parties
            </h2>
            <div className="space-y-5">

              <div
                onClick={() => handleEntityClick('supplier', {
                  company_name: order.supplier_name || 'Not assigned',
                  contact_number: 'N/A',
                  email: 'N/A',
                  contact_person: 'N/A',
                  status: 'Active'
                })}
                className="group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition"
              >
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition">Supplier / Transporter</p>
                <div className="flex items-center gap-3">
                  <Building2 size={16} className="text-slate-400 group-hover:text-blue-600" />
                  <p className="font-medium text-[#1E293B] group-hover:text-blue-700">{order.supplier_name || 'Not assigned'}</p>
                </div>
              </div>

              <div className="group p-2 -mx-2 rounded-lg">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                <div className="flex items-center gap-3">
                  <User size={16} className="text-slate-400" />
                  <p className="font-medium text-[#1E293B]">{order.customers?.customer_name || 'Not assigned'}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-[#1E293B] flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
              <Calendar className="text-blue-600" size={20} />
              Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Order Date</span>
                <span className="font-medium text-[#1E293B]">{order.order_date || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pickup Date</span>
                <span className="font-medium text-[#1E293B]">{order.pickup_date || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Expected Arrival</span>
                <span className="font-medium text-[#1E293B]">{order.expected_arrival || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Last Updated</span>
                <span className="font-medium text-[#1E293B]">{order.updated_at?.split('T')[0] || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-[#1E293B] flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
              <AlertCircle className="text-slate-400" size={20} />
              Special Instructions
            </h2>
            {order.special_instructions ? (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-sm font-medium text-orange-800">{order.special_instructions}</p>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                <p className="text-sm font-medium text-slate-500">No special instructions.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Popup Modal */}
      {popupType && popupData && (
        <div className="fixed inset-0 bg-black/60 flex flex-col items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1E293B] capitalize flex items-center gap-2">
                {popupType === 'supplier' && <Building2 size={20} className="text-blue-600" />}
                {popupType === 'driver' && <User size={20} className="text-blue-600" />}
                {popupType} Details
              </h2>
              <button
                onClick={() => { setPopupType(null); setPopupData(null) }}
                className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-200 text-slate-500 rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                  {popupType === 'supplier' ? <Building2 size={32} className="text-blue-500" /> : <User size={32} className="text-blue-500" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1E293B]">
                    {popupType === 'supplier' ? popupData.company_name : `${popupData.first_name} ${popupData.last_name}`}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">{popupData.status}</p>
                </div>
              </div>
              <div className="space-y-4 bg-slate-50 rounded-xl p-5 border border-slate-100">
                {popupData.contact_number && (
                  <div className="flex items-start gap-3">
                    <Phone size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-medium text-slate-800">{popupData.contact_number}</p>
                    </div>
                  </div>
                )}
                {popupData.email && popupData.email !== 'N/A' && (
                  <div className="flex items-start gap-3">
                    <Mail size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium text-slate-800">{popupData.email}</p>
                    </div>
                  </div>
                )}
                {popupType === 'supplier' && popupData.contact_person && popupData.contact_person !== 'N/A' && (
                  <div className="flex items-start gap-3">
                    <User size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contact Person</p>
                      <p className="text-sm font-medium text-slate-800">{popupData.contact_person}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default OrderDetails