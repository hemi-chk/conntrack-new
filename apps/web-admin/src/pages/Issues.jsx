import { useState, useEffect } from 'react'
import { adminAPI } from '../services/api'
import { AlertTriangle, Search, Package, Truck, Building2, User } from 'lucide-react'

const SOURCES = ['operations', 'logistics', 'supplier', 'driver']

const SOURCE_META = {
  operations: { label: 'Operations', icon: Package, color: '#5483B3' },
  logistics: { label: 'Logistics', icon: Truck, color: '#5483B3' },
  supplier: { label: 'Supplier', icon: Building2, color: '#5483B3' },
  driver: { label: 'Driver', icon: User, color: '#5483B3' },
}

// Issues from staff carry `reported_by` (joined to their profile/role);
// driver-reported issues have no reported_by but do have a driver_id.
function getIssueSource(issue) {
  if (issue.reporter?.role) return issue.reporter.role
  if (issue.driver_id) return 'driver'
  return 'unknown'
}

// Older rows may still have free-form priority values (e.g. 'medium') from
// before this page existed - normalize everything to the 3-tier scale.
function normalizePriority(priority) {
  const p = (priority || '').toLowerCase()
  if (['critical', 'high', 'urgent'].includes(p)) return 'critical'
  if (['major', 'medium'].includes(p)) return 'major'
  return 'minor'
}

const PRIORITY_META = {
  minor: { label: 'Minor', bg: '#EBF4FF', text: '#052659' },
  major: { label: 'Major', bg: '#FEF3C7', text: '#92400E' },
  critical: { label: 'Critical', bg: '#FEE2E2', text: '#B91C1C' },
}

export default function Issues() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    adminAPI.getIssues()
      .then(setIssues)
      .catch(() => setIssues([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = issues.filter(issue => {
    const source = getIssueSource(issue)
    const priority = normalizePriority(issue.priority)
    const matchSource = sourceFilter === 'all' || source === sourceFilter
    const matchPriority = priorityFilter === 'all' || priority === priorityFilter
    const matchSearch = !searchTerm.trim() || (
      (issue.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.issue_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.orders?.order_reference || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    return matchSource && matchPriority && matchSearch
  })

  const countBySource = (source) => issues.filter(i => getIssueSource(i) === source).length
  const countByPriority = (priority) => issues.filter(i => normalizePriority(i.priority) === priority).length

  const reporterName = (issue) => {
    if (issue.reporter?.first_name) return `${issue.reporter.first_name} ${issue.reporter.last_name || ''}`.trim()
    if (issue.drivers?.first_name) return `${issue.drivers.first_name} ${issue.drivers.last_name || ''}`.trim()
    return '—'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Issues</h1>
        <p className="text-sm text-slate-500 mt-1">Issues reported across Operations, Logistics, Supplier, and Driver</p>
      </div>

      {/* Source stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {SOURCES.map(source => {
          const meta = SOURCE_META[source]
          const Icon = meta.icon
          return (
            <button
              key={source}
              onClick={() => setSourceFilter(sourceFilter === source ? 'all' : source)}
              className={`text-left bg-white rounded-2xl p-5 shadow-sm border transition ${
                sourceFilter === source ? 'border-[#5483B3] ring-2 ring-[#C1E8FF]' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{meta.label}</p>
                  <p className="text-3xl font-bold text-[#1E293B] mt-1">{countBySource(source)}</p>
                </div>
                <div className="w-12 h-12 bg-[#EBF4FF] rounded-xl flex items-center justify-center">
                  <Icon size={22} className="text-[#5483B3]" />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Issues table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">All Issues</h2>
              <p className="text-xs text-slate-400 mt-0.5">{filtered.length} issues found</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Priority filter pills */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPriorityFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    priorityFilter === 'all' ? 'bg-[#052659] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {Object.entries(PRIORITY_META).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setPriorityFilter(priorityFilter === key ? 'all' : key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    style={
                      priorityFilter === key
                        ? { background: meta.text, color: '#fff' }
                        : { background: meta.bg, color: meta.text }
                    }
                  >
                    {meta.label} ({countByPriority(key)})
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="pb-4 font-semibold">Source</th>
                <th className="pb-4 font-semibold">Reported By</th>
                <th className="pb-4 font-semibold">Order</th>
                <th className="pb-4 font-semibold">Type</th>
                <th className="pb-4 font-semibold">Description</th>
                <th className="pb-4 font-semibold">Priority</th>
                <th className="pb-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
                    Loading issues...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((issue) => {
                  const source = getIssueSource(issue)
                  const sourceMeta = SOURCE_META[source] || { label: 'Unknown', icon: AlertTriangle }
                  const SourceIcon = sourceMeta.icon
                  const priority = normalizePriority(issue.priority)
                  const priorityMeta = PRIORITY_META[priority]

                  return (
                    <tr key={issue.issue_id || issue.id} className="border-t border-slate-50 hover:bg-[#EBF4FF] transition">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[#EBF4FF] rounded-lg flex items-center justify-center">
                            <SourceIcon size={13} className="text-[#5483B3]" />
                          </div>
                          <span className="font-semibold text-[#1E293B]">{sourceMeta.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-500">{reporterName(issue)}</td>
                      <td className="py-3.5 text-slate-500 font-mono text-xs">{issue.orders?.order_reference || '—'}</td>
                      <td className="py-3.5 text-slate-500">{issue.issue_type || '—'}</td>
                      <td className="py-3.5 text-slate-500 max-w-xs truncate">{issue.description}</td>
                      <td className="py-3.5">
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: priorityMeta.bg, color: priorityMeta.text }}
                        >
                          {priorityMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          issue.status === 'open'
                            ? 'bg-[#C1E8FF] text-[#052659]'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {issue.status === 'open' ? 'Open' : (issue.status || 'Resolved')}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
                    No issues found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
