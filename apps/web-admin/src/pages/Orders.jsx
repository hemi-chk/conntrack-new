import { useState, useEffect } from 'react'
import { Package, MapPin, ArrowRight, Truck } from 'lucide-react'
import { adminAPI } from '../services/api'

function Orders({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('ongoing')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const tabs = [
    { label: 'Ongoing', value: 'in_transit' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Other', value: 'other' },
  ]

  // WHY: Fetch real orders when page loads
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await adminAPI.getOrders()
        setOrders(data)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // WHY: Filter orders by current tab status
  const filteredOrders = orders.filter(o => {
    if (activeTab === 'in_transit') return o.current_status === 'in_transit'
    if (activeTab === 'completed') return o.current_status === 'completed'
    if (activeTab === 'cancelled') return o.current_status === 'cancelled'
    if (activeTab === 'other') return !['in_transit', 'completed', 'cancelled'].includes(o.current_status)
    return true
  })

  const getCardColors = (status) => {
    switch (status) {
      case 'in_transit':
        return {
          card: 'bg-blue-50/40 border-blue-200 hover:border-blue-400 hover:shadow-blue-100 hover:bg-blue-50/80',
          icon: 'bg-blue-100 text-blue-700',
          badge: 'bg-blue-100 text-blue-700',
        }
      case 'completed':
        return {
          card: 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100 hover:bg-emerald-50/80',
          icon: 'bg-emerald-100 text-emerald-600',
          badge: 'bg-emerald-100 text-emerald-700',
        }
      case 'cancelled':
        return {
          card: 'bg-rose-50/40 border-rose-200 hover:border-rose-400 hover:shadow-rose-100 hover:bg-rose-50/80',
          icon: 'bg-rose-100 text-rose-600',
          badge: 'bg-rose-100 text-rose-700',
        }
      default:
        return {
          card: 'bg-amber-50/40 border-amber-200 hover:border-amber-400 hover:shadow-amber-100 hover:bg-amber-50/80',
          icon: 'bg-amber-100 text-amber-600',
          badge: 'bg-amber-100 text-amber-700',
        }
    }
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track all container orders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`pb-3 px-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === tab.value
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label} Orders
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <Package size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Loading orders...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map(order => {
            const colors = getCardColors(order.current_status)
            return (
              <div
                key={order.order_id}
                onClick={() => onNavigate(`/orders/${order.order_id}`)}
                className={`rounded-2xl p-5 border transition-all cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md ${colors.card}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.icon}`}>
                        <Package size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1E293B]">
                          {order.order_reference || `ORD-${String(order.order_id).padStart(5, '0')}`}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                      {order.current_status?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-white/70 p-2 rounded-lg">
                      <MapPin size={16} className="text-slate-400 flex-shrink-0" />
                      <div className="truncate font-medium flex items-center gap-1">
                        <span className="truncate">{order.pickup_location || 'N/A'}</span>
                        <ArrowRight size={14} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{order.destination_country || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Truck size={16} className="text-slate-400" />
                      <span>
                        {order.order_type} • <span className="font-medium">{order.cargo_type || 'N/A'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/50 flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium truncate max-w-[150px]">
                    {order.customers?.customer_name || 'No client'}
                  </span>
                  <span className="text-blue-700 font-semibold group-hover:underline flex items-center gap-1">
                    View Details
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <Package size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium text-lg">No orders found in this category.</p>
          <p className="text-slate-400 text-sm mt-1">There are currently no orders here.</p>
        </div>
      )}

    </div>
  )
}

export default Orders