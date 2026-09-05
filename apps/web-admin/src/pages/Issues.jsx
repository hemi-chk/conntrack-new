import { useState, useEffect } from 'react'
import { adminAPI } from '../services/api'
import { AlertTriangle, Search, Package, Truck, Building2, User, X, Clock, Eye, CheckCircle2 } from 'lucide-react'

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

// Raw DB values stay open/escalated/resolved (Operations' and Logistics'
// own Issues pages already read these directly) - this is purely the
// Admin-facing label/color for the same three states.
const STATUS_ORDER = ['open', 'escalated', 'resolved']
const STATUS_META = {
  open: { label: 'Not Reviewed', bg: '#F1F5F9', text: '#475569', icon: Clock },
  escalated: { label: 'Reviewing', bg: '#C1E8FF', text: '#052659', icon: Eye },
  resolved: { label: 'Solved', bg: '#D1FAE5', text: '#065F46', icon: CheckCircle2 },
}
function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.open
}

// Each interface's issue-report form phrases categories slightly differently
// (Logistics: "Traffic/Route Delay", Driver: same now, Operations' upcoming
// form: "Delay/Tracking Issue", legacy driver rows: "delay_issue", etc).
// Normalize by keyword so they group under one canonical set instead of
// fragmenting into near-duplicates on this page.
const CATEGORIES = ['Mechanical Breakdown', 'Traffic/Route Delay', 'Documentation Issue', 'Cargo Damage', 'Driver Issue', 'Insurance Issue', 'Other']

function normalizeCategory(issueType) {
  const t = (issueType || '').toLowerCase()
  if (/mechanic|vehicle|breakdown/.test(t)) return 'Mechanical Breakdown'
  if (/route|delay|traffic|tracking/.test(t)) return 'Traffic/Route Delay'
  if (/document/.test(t)) return 'Documentation Issue'
  if (/cargo|damage/.test(t)) return 'Cargo Damage'
  if (/driver/.test(t)) return 'Driver Issue'
  if (/insurance/.test(t)) return 'Insurance Issue'
  return 'Other'
}

export default function Issues() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => {
    adminAPI.getIssues()
      .then(setIssues)
      .catch(() => setIssues([]))
      .finally(() => setLoading(false))
  }, [])

  const issueKey = (issue) => issue.issue_id || issue.id

  const handleStatusChange = async (issue, newStatus) => {
    if (newStatus === issue.status) return
    setSavingStatus(true)
    try {
      const updated = await adminAPI.updateIssueStatus(issueKey(issue), newStatus)
      setIssues(prev => prev.map(i => issueKey(i) === issueKey(issue) ? { ...i, ...updated } : i))
      setSelectedIssue(prev => prev && issueKey(prev) === issueKey(issue) ? { ...prev, ...updated } : prev)
    } catch (err) {
      console.error('Failed to update issue status:', err)
    } finally {
      setSavingStatus(false)
    }
  }

  const filtered = issues.filter(issue => {
    const source = getIssueSource(issue)
    const priority = normalizePriority(issue.priority)
    const category = normalizeCategory(issue.issue_type)
    const matchSource = sourceFilter === 'all' || source === sourceFilter
    const matchPriority = priorityFilter === 'all' || priority === priorityFilter
    const matchCategory = categoryFilter === 'all' || category === categoryFilter
    const matchSearch = !searchTerm.trim() || (
      (issue.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.issue_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.orders?.order_reference || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    return matchSource && matchPriority && matchCategory && matchSearch
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
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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
                  const category = normalizeCategory(issue.issue_type)
                  const sMeta = statusMeta(issue.status)
                  const StatusIcon = sMeta.icon

                  return (
                    <tr
                      key={issueKey(issue)}
                      onClick={() => setSelectedIssue(issue)}
                      className="border-t border-slate-50 hover:bg-[#EBF4FF] transition cursor-pointer"
                    >
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
                      <td className="py-3.5 text-slate-500">{category}</td>
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
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: sMeta.bg, color: sMeta.text }}
                        >
                          <StatusIcon size={12} />
                          {sMeta.label}
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

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          savingStatus={savingStatus}
          onStatusChange={(status) => handleStatusChange(selectedIssue, status)}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  )
}

function IssueDetailModal({ issue, savingStatus, onStatusChange, onClose }) {
  const source = getIssueSource(issue)
  const sourceMeta = SOURCE_META[source] || { label: 'Unknown', icon: AlertTriangle }
  const SourceIcon = sourceMeta.icon
  const priority = normalizePriority(issue.priority)
  const priorityMeta = PRIORITY_META[priority]
  const category = normalizeCategory(issue.issue_type)
  const reporterName = issue.reporter?.first_name
    ? `${issue.reporter.first_name} ${issue.reporter.last_name || ''}`.trim()
    : issue.drivers?.first_name
      ? `${issue.drivers.first_name} ${issue.drivers.last_name || ''}`.trim()
      : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#EBF4FF] rounded-lg flex items-center justify-center">
              <SourceIcon size={15} className="text-[#5483B3]" />
            </div>
            <h2 className="text-base font-bold text-[#1E293B]">{sourceMeta.label} Issue</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Reported By</p>
              <p className="text-[#1E293B] font-medium">{reporterName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Order</p>
              <p className="text-[#1E293B] font-mono text-xs">{issue.orders?.order_reference || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Category</p>
              <p className="text-[#1E293B] font-medium">{category}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Priority</p>
              <span
                className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: priorityMeta.bg, color: priorityMeta.text }}
              >
                {priorityMeta.label}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Reported On</p>
              <p className="text-[#1E293B] font-medium">
                {issue.created_at ? new Date(issue.created_at).toLocaleString() : '—'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-[#1E293B] leading-relaxed bg-slate-50 rounded-xl p-3">{issue.description}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Status</p>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_ORDER.map((status) => {
                const meta = STATUS_META[status]
                const Icon = meta.icon
                const active = issue.status === status
                return (
                  <button
                    key={status}
                    disabled={savingStatus}
                    onClick={() => onStatusChange(status)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition disabled:opacity-50 ${
                      active ? 'border-transparent' : 'border-slate-200 hover:border-slate-300 bg-white text-slate-500'
                    }`}
                    style={active ? { background: meta.bg, color: meta.text } : undefined}
                  >
                    <Icon size={16} />
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
