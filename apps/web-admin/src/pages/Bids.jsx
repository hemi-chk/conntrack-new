import { useState, useEffect } from 'react'
import { Search, X, CheckCircle, XCircle, Clock, Trophy, ChevronDown, ChevronUp, Building2, Phone, Mail, MapPin, Star, Truck } from 'lucide-react'
import { adminAPI } from '../services/api'

// ── Supplier detail popup ────────────────────────────────────────────────────
function SupplierModal({ supplier, bid, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EBF4FF] rounded-xl flex items-center justify-center">
              <Building2 size={18} className="text-[#5483B3]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Supplier Profile</h2>
              <p className="text-xs text-slate-400">{supplier.supplier_reference || `SUP-${String(supplier.supplier_id).padStart(5,'0')}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Profile banner */}
          <div className="flex items-center justify-between p-4 bg-[#EBF4FF] rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#021024,#5483B3)' }}>
                <Building2 size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1E293B]">{supplier.company_name}</h3>
                <p className="text-xs text-slate-500">Transport Supplier</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
              supplier.status === 'active' ? 'bg-[#C1E8FF] text-[#052659]' : 'bg-slate-100 text-slate-500'
            }`}>
              {supplier.status === 'active' ? '● Active' : '● Inactive'}
            </span>
          </div>

          {/* Company details */}
          <div>
            <p className="text-[10px] font-bold text-[#5483B3] uppercase tracking-widest mb-2">Company</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Registration No.', value: supplier.registration_number },
                { label: 'TIN Number',        value: supplier.tin_number },
                { label: 'Experience',         value: supplier.experience_years ? `${supplier.experience_years} yrs` : null },
                { label: 'HCV Fleet',          value: supplier.hcv_count ?? null },
                { label: 'LCV Fleet',          value: supplier.lcv_count ?? null },
              ].map(item => item.value != null && (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400">{item.label}</p>
                  <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            {supplier.address && (
              <div className="mt-2 flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                <MapPin size={13} className="text-[#5483B3] mt-0.5 shrink-0" />
                <p className="text-sm text-[#1E293B]">{supplier.address}</p>
              </div>
            )}
            {supplier.company_overview && (
              <div className="mt-2 bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 mb-1">Overview</p>
                <p className="text-sm text-[#1E293B] leading-relaxed">{supplier.company_overview}</p>
              </div>
            )}
          </div>

          {/* Contact */}
          <div>
            <p className="text-[10px] font-bold text-[#5483B3] uppercase tracking-widest mb-2">Contact</p>
            <div className="space-y-2">
              {supplier.contact_person && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Star size={13} className="text-[#5483B3] shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400">Contact Person</p>
                    <p className="text-sm font-semibold text-[#1E293B]">{supplier.contact_person}</p>
                  </div>
                </div>
              )}
              {supplier.contact_number && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Phone size={13} className="text-[#5483B3] shrink-0" />
                  <p className="text-sm text-[#1E293B]">{supplier.contact_number}</p>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Mail size={13} className="text-[#5483B3] shrink-0" />
                  <p className="text-sm text-[#1E293B]">{supplier.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Their bid for this order */}
          {bid && (
            <div>
              <p className="text-[10px] font-bold text-[#5483B3] uppercase tracking-widest mb-2">Bid for this Order</p>
              <div className="bg-[#EBF4FF] border border-[#C1E8FF] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400">Bid Reference</p>
                    <p className="text-sm font-semibold text-[#1E293B]">{bid.bid_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Bid Amount</p>
                    <p className="text-lg font-bold text-[#052659]">LKR {bid.amount?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-400">ETA</p>
                    <p className="text-sm font-medium text-[#1E293B]">{bid.eta || '—'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-400">Submitted</p>
                    <p className="text-sm font-medium text-[#1E293B]">{bid.submitted || '—'}</p>
                  </div>
                </div>
                {bid.notes && (
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-400 mb-1">Notes</p>
                    <p className="text-sm text-[#1E293B]">{bid.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-[#052659] text-white rounded-xl text-sm font-semibold hover:bg-[#5483B3] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
function Bids() {
  const [activeTab, setActiveTab] = useState('active')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [selectedClosedBid, setSelectedClosedBid] = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [selectedSupplierBid, setSelectedSupplierBid] = useState(null)
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
            supplierData: bid.suppliers,       // full supplier object
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

  const openSupplier = (bid, e) => {
    e.stopPropagation()
    setSelectedSupplier(bid.supplierData || { company_name: bid.supplier })
    setSelectedSupplierBid(bid)
  }

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

      {/* Supplier detail modal */}
      {selectedSupplier && (
        <SupplierModal
          supplier={selectedSupplier}
          bid={selectedSupplierBid}
          onClose={() => { setSelectedSupplier(null); setSelectedSupplierBid(null) }}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Bids</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor all supplier bids across orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Active Orders</p>
          <p className="text-2xl font-bold text-[#1E293B] mt-1">{activeBids.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Total Active Bids</p>
          <p className="text-2xl font-bold text-[#5483B3] mt-1">
            {activeBids.reduce((sum, order) => sum + (order.bids?.length || 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Closed Orders</p>
          <p className="text-2xl font-bold text-[#052659] mt-1">{closedBids.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Total Past Bids</p>
          <p className="text-2xl font-bold text-[#7DA0CA] mt-1">
            {closedBids.reduce((sum, order) => sum + (order.all_bids?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">

        {/* Tabs + Search */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'active'
                    ? 'bg-[#052659] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Active Bids
              </button>
              <button
                onClick={() => setActiveTab('closed')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'closed'
                    ? 'bg-[#C1E8FF] text-[#052659] shadow-sm'
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
                className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5483B3] w-72 bg-slate-50"
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
                      className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-[#EBF4FF] transition"
                      onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1E293B]">{order.order_id}</span>
                          <span className="px-2 py-0.5 bg-[#EBF4FF] text-[#5483B3] rounded-full text-xs font-medium flex items-center gap-1">
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
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Supplier Bids — click a name to view supplier profile</p>
                        {order.bids?.map((bid, index) => (
                          <div key={bid.bid_id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-[#C1E8FF] transition">
                            <div className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                index === 0 ? 'bg-[#C1E8FF] text-[#052659]' :
                                index === 1 ? 'bg-[#EBF4FF] text-[#5483B3]' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                #{index + 1}
                              </div>
                              <div>
                                <button
                                  onClick={(e) => openSupplier(bid, e)}
                                  className="text-sm font-semibold text-[#052659] hover:text-[#5483B3] hover:underline transition text-left"
                                >
                                  {bid.supplier}
                                </button>
                                <p className="text-xs text-slate-500">{bid.notes}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#052659]">LKR {bid.amount?.toLocaleString()}</p>
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
                    className="border border-slate-200 rounded-xl p-4 hover:bg-[#EBF4FF] cursor-pointer transition"
                    onClick={() => setSelectedClosedBid(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1E293B]">{order.order_id}</span>
                          <span className="px-2 py-0.5 bg-[#C1E8FF] text-[#052659] rounded-full text-xs font-medium">Closed</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{order.order_type} • {order.cargo_type}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Winner</p>
                          <p className="text-sm font-medium text-[#5483B3] flex items-center gap-1">
                            <Trophy size={12} />{order.winner?.supplier}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Winning Bid</p>
                          <p className="text-sm font-bold text-[#052659]">LKR {order.winner?.amount?.toLocaleString()}</p>
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
                <h4 className="text-sm font-semibold text-[#052659] uppercase tracking-wide mb-3">Order Information</h4>
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
                <h4 className="text-sm font-semibold text-[#052659] uppercase tracking-wide mb-3">Winner</h4>
                <div className="bg-[#EBF4FF] border border-[#C1E8FF] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#C1E8FF] rounded-full flex items-center justify-center">
                        <Trophy size={18} className="text-[#052659]" />
                      </div>
                      <div>
                        <button
                          onClick={(e) => openSupplier(selectedClosedBid.winner, e)}
                          className="font-bold text-[#052659] hover:text-[#5483B3] hover:underline transition text-left"
                        >
                          {selectedClosedBid.winner?.supplier}
                        </button>
                        <p className="text-xs text-slate-500">{selectedClosedBid.winner?.bid_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Winning Amount</p>
                      <p className="text-lg font-bold text-[#052659]">LKR {selectedClosedBid.winner?.amount?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#052659] uppercase tracking-wide mb-3">
                  All Bids ({selectedClosedBid.all_bids?.length}) — click a name to view supplier profile
                </h4>
                <div className="space-y-2">
                  {selectedClosedBid.all_bids?.map((bid) => (
                    <div
                      key={bid.bid_id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        bid.status === 'accepted' ? 'bg-[#EBF4FF] border-[#C1E8FF]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {bid.status === 'accepted'
                          ? <CheckCircle size={16} className="text-[#5483B3]" />
                          : <XCircle size={16} className="text-slate-400" />
                        }
                        <div>
                          <button
                            onClick={(e) => openSupplier(bid, e)}
                            className="text-sm font-semibold text-[#052659] hover:text-[#5483B3] hover:underline transition text-left"
                          >
                            {bid.supplier}
                          </button>
                          <p className="text-xs text-slate-500">{bid.bid_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#052659]">
                          LKR {bid.amount?.toLocaleString()}
                        </p>
                        <span className={`text-xs ${bid.status === 'accepted' ? 'text-[#5483B3]' : 'text-slate-400'}`}>
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
