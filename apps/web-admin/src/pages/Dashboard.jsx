import { AlertTriangle, ArrowRight, CheckCircle, Clock, Package, TrendingUp, Truck, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { adminAPI } from '../services/api'

function Dashboard() {
  const userName = JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin'

  const [stats, setStats] = useState({
    total_orders: 0,
    active_orders: 0,
    active_bids: 0,
    completed_orders: 0,
  })
  const [issues, setIssues] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, issuesData, ordersData] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getIssues(),
          adminAPI.getOrders(),
        ])
        setStats(statsData)
        setIssues(issuesData || [])
        setRecentOrders(
          (ordersData || []).slice(0, 5).map(o => ({
            id: o.order_reference || `ORD-${String(o.order_id).padStart(5, '0')}`,
            client: o.customers?.customer_name || 'N/A',
            route: `${o.pickup_location || 'N/A'} → ${o.destination_country || 'N/A'}`,
            status: o.current_status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown',
            date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          }))
        )
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // WHY: Get current hour to show appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const statCards = [
    {
      label: 'Total Orders',
      sublabel: 'This month',
      value: loading ? '...' : stats.total_orders,
      icon: Package,
      color: 'bg-blue-500',
      light: 'bg-blue-50',
      textColor: 'text-blue-600',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Active Orders',
      sublabel: 'In transit now',
      value: loading ? '...' : stats.active_orders,
      icon: Truck,
      color: 'bg-orange-500',
      light: 'bg-orange-50',
      textColor: 'text-orange-600',
      trend: '3 need attention',
      trendUp: null,
    },
    {
      label: 'Active Bids',
      sublabel: 'Awaiting selection',
      value: loading ? '...' : stats.active_bids,
      icon: Clock,
      color: 'bg-purple-500',
      light: 'bg-purple-50',
      textColor: 'text-purple-600',
      trend: '2 orders open',
      trendUp: null,
    },
    {
      label: 'Completed',
      sublabel: 'Orders this month',
      value: loading ? '...' : stats.completed_orders,
      icon: CheckCircle,
      color: 'bg-green-500',
      light: 'bg-green-50',
      textColor: 'text-green-600',
      trend: '+8%',
      trendUp: true,
    },
  ]

  return (
    <div className="space-y-6">

      {/* Hero Banner */}
      <div className="relative rounded-2xl p-8 overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563EB 60%, #3b82f6 100%)' }}>
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-40 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-4 left-1/2 w-96 h-96 bg-blue-400/10 rounded-full -translate-x-1/2" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl font-bold text-white mb-2">
              {getGreeting()}, Hi {userName}! 👋
            </h1>
            <p className="text-blue-100 text-sm max-w-md">
              You have <span className="font-bold text-white">{issues.filter(i => i.type === 'error').length} critical issues</span> that need your attention today. Let's get started!
            </p>
            <button className="mt-4 flex items-center gap-2 bg-white text-[#2563EB] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 transition shadow-sm">
              Review Issues
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {[
              { value: loading ? '...' : stats.total_orders, label: 'Total Orders' },
              { value: loading ? '...' : stats.active_orders, label: 'Active Now' },
              { value: issues.filter(i => i.type === 'error').length, label: 'Critical Issues' },
            ].map(item => (
              <div key={item.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[88px] border border-white/20">
                <p className="text-3xl font-bold text-white">{item.value}</p>
                <p className="text-blue-100 text-xs mt-1 whitespace-nowrap">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.light} p-3 rounded-xl`}>
                <stat.icon size={20} className={stat.textColor} />
              </div>
              {stat.trendUp !== null && (
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
                  stat.trendUp ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'
                }`}>
                  {stat.trendUp ? <TrendingUp size={12} /> : null}
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-[#1E293B]">{stat.value}</p>
            <p className="text-sm font-medium text-[#1E293B] mt-1">{stat.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.sublabel}</p>
            {stat.trendUp === null && (
              <p className="text-xs text-orange-500 mt-1">{stat.trend}</p>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-3 gap-6">

        {/* Issues Table */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle size={16} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1E293B]">Issues Requiring Attention</h2>
                <p className="text-xs text-slate-400">{issues.length} total issues</p>
              </div>
            </div>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
              {issues.filter(i => i.type === 'error').length} Critical
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {issues.map((issue) => (
              <div key={issue.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition group">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1 rounded-lg ${
                    issue.type === 'error' ? 'bg-red-50' : 'bg-orange-50'
                  }`}>
                    {issue.type === 'error'
                      ? <XCircle size={14} className="text-red-500" />
                      : <AlertTriangle size={14} className="text-orange-400" />
                    }
                  </div>
                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      issue.type === 'error'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {issue.category}
                    </span>
                    <p className="text-sm text-slate-600 mt-1">{issue.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{issue.date}</p>
                  </div>
                </div>
                <button className="text-xs font-medium text-[#2563EB] opacity-0 group-hover:opacity-100 transition flex items-center gap-1 whitespace-nowrap ml-4">
                  {issue.action} <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">Recent Orders</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest activity</p>
            </div>
            <button className="text-xs text-[#2563EB] font-medium hover:underline">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-4 hover:bg-slate-50 transition cursor-pointer group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-[#2563EB]">{order.id}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-700">{order.client}</p>
                <p className="text-xs text-slate-400 mt-0.5">{order.route}</p>
                <p className="text-xs text-slate-400">{order.date}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard