import { useState, useEffect } from 'react'
import { Search, X, CheckCircle, XCircle, Clock, Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import { adminAPI } from '../services/api'

function Bids() {
  const [activeTab, setActiveTab] = useState('active')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [selectedClosedBid, setSelectedClosedBid] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeBids, setActiveBids] = useState([])
  const [closedBids, setClosedBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true)
        const data = await adminAPI.getBids()

        // Group flat bid list by order_id
        const grouped = {}
        data.forEach(bid => {
          const key = bid.order_id
          if (!grouped[key]) {
            grouped[key] = {
              order_id: bid.orders?.order_reference || `ORD-${bid.order_id}`,
              order_type: bid.orders?.order_type,
              cargo_type: bid.orders?.cargo_type,
              bids: [],
              winner: null,
              all_bids: [],
              status: 'active'
            }
          }
          const bidEntry = {
            bid_id: bid.bid_reference,
            supplier: bid.suppliers?.company_name,
            amount: bid.bid_amount,
            submitted: bid.submitted_at?.split('T')[0],
            notes: bid.notes,
            status: bid.bid_status,
            eta: bid.eta,
          }
          grouped[key].all_bids.push(bidEntry)

          if (bid.bid_status === 'accepted') {
            grouped[key].winner = bidEntry
            grouped[key].status = 'closed'
          } else if (bid.bid_status === 'under_review') {
            grouped[key].bids.push(bidEntry)
          }
        })

        const orders = Object.values(grouped)
        setActiveBids(orders.filter(o => o.status === 'active'))
        setClosedBids(orders.filter(o => o.status === 'closed'))
      } catch (err) {
        setError('Failed to load bids')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchBids()
  }, [])

  const filteredActiveBids = activeBids.filter((order) =>
    (order.order_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.cargo_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredClosedBids = closedBids.filter((order) =>
    (order.order_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.cargo_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.winner?.supplier || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-slate-400 text-sm">Loading bids...</div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-red-400 text-sm">{error}</div>
    </div>
  )

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Bids</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor all supplier bids across orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500">Active Orders</p>
          <p className="text-2xl font-bold text-[#1E293B] mt-1">{activeBids.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500">Total Active Bids</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">
            {activeBids.reduce((sum, order) => sum + (order.bids?.length || 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500">Closed Orders</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{closedBids.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500">Total Past Bids</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {closedBids.reduce((sum, order) => sum + (order.all_bids?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">

        {/* Tabs + Search */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'active'
                    ? 'bg-[#22C55E] text-white shadow-sm shadow-green-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Active Bids
              </button>
              <button
                onClick={() => setActiveTab('closed')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'closed'
                    ? 'bg-[#FFF3AA] text-black shadow-sm shadow-yellow-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Closed Bids
              </button>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by order, cargo, supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72 bg-slate-50"
              />
            </div>
          </div>
        </div>

        <div className="p-6">

          {/* ACTIVE BIDS TAB */}
          {activeTab === 'active' && (
            <div className="space-y-4">
              {filteredActiveBids.length > 0 ? (
                filteredActiveBids.map((order) => (
                  <div key={order.order_id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div
                      className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition"
                      onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1E293B]">{order.order_id}</span>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-medium flex items-center gap-1">
                            <Clock size={10} />
                            {order.bids?.length || 0} bid{(order.bids?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {order.order_type} • {order.cargo_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {expandedOrder === order.order_id
                          ? <ChevronUp size={18} className="text-slate-400" />
                          : <ChevronDown size={18} className="text-slate-400" />
                        }
                      </div>
                    </div>

                    {expandedOrder === order.order_id && (
                      <div className="p-4 space-y-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Supplier Bids</p>
                        {order.bids?.map((bid, index) => (
                          <div key={bid.bid_id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                index === 1 ? 'bg-slate-100 text-slate-600' :
                                'bg-orange-50 text-orange-600'
                              }`}>
                                #{index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#1E293B]">{bid.supplier}</p>
                                <p className="text-xs text-slate-500">{bid.notes}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#1E40AF]">LKR {bid.amount?.toLocaleString()}</p>
                              <p className="text-xs text-slate-400">ETA: {bid.eta}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-8">No active bids found</p>
              )}
            </div>
          )}

          {/* CLOSED BIDS TAB */}
          {activeTab === 'closed' && (
            <div className="space-y-4">
              {filteredClosedBids.length > 0 ? (
                filteredClosedBids.map((order) => (
                  <div
                    key={order.order_id}
                    className="border border-slate-200 rounded-xl p-4 hover:bg-blue-50 cursor-pointer transition"
                    onClick={() => setSelectedClosedBid(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1E293B]">{order.order_id}</span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-medium">Closed</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{order.order_type} • {order.cargo_type}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Winner</p>
                          <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                            <Trophy size={12} />{order.winner?.supplier}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Winning Bid</p>
                          <p className="text-sm font-bold text-[#1E40AF]">LKR {order.winner?.amount?.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Total Bids</p>
                          <p className="text-sm font-medium text-[#1E293B]">{order.all_bids?.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-8">No closed bids found</p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Closed Bid Details Modal */}
      {selectedClosedBid && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-[#1E293B]">Closed Bid Details</h2>
                <p className="text-sm text-slate-500">{selectedClosedBid.order_id}</p>
              </div>
              <button onClick={() => setSelectedClosedBid(null)} className="p-2 hover:bg-slate-100 rounded-xl transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-[#1E40AF] uppercase tracking-wide mb-3">Order Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Order Type</p>
                    <p className="text-sm font-medium text-[#1E293B] mt-1">{selectedClosedBid.order_type}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Cargo Type</p>
                    <p className="text-sm font-medium text-[#1E293B] mt-1">{selectedClosedBid.cargo_type}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1E40AF] uppercase tracking-wide mb-3">Winner</h4>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Trophy size={18} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-[#1E293B]">{selectedClosedBid.winner?.supplier}</p>
                        <p className="text-xs text-slate-500">{selectedClosedBid.winner?.bid_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Winning Amount</p>
                      <p className="text-lg font-bold text-green-600">LKR {selectedClosedBid.winner?.amount?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1E40AF] uppercase tracking-wide mb-3">
                  All Bids ({selectedClosedBid.all_bids?.length})
                </h4>
                <div className="space-y-2">
                  {selectedClosedBid.all_bids?.map((bid) => (
                    <div
                      key={bid.bid_id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        bid.status === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {bid.status === 'accepted'
                          ? <CheckCircle size={16} className="text-green-600" />
                          : <XCircle size={16} className="text-red-400" />
                        }
                        <div>
                          <p className="text-sm font-medium text-[#1E293B]">{bid.supplier}</p>
                          <p className="text-xs text-slate-500">{bid.bid_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${bid.status === 'accepted' ? 'text-green-600' : 'text-slate-500'}`}>
                          LKR {bid.amount?.toLocaleString()}
                        </p>
                        <span className={`text-xs ${bid.status === 'accepted' ? 'text-green-600' : 'text-red-400'}`}>
                          {bid.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100">
              <button
                onClick={() => setSelectedClosedBid(null)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bids