import { useState, useEffect } from 'react'
import { Plus, X, Search, User, Mail, Phone } from 'lucide-react'
import { adminAPI } from '../services/api'

function Logistics() {
  const [showForm, setShowForm] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [staffToRemove, setStaffToRemove] = useState(null)
  const [removeForm, setRemoveForm] = useState({ admin_id: '', password: '', reason: '' })
  const [removeError, setRemoveError] = useState('')
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [staffToDeactivate, setStaffToDeactivate] = useState(null)
  const [deactivateForm, setDeactivateForm] = useState({ password: '', reason: '' })
  const [deactivateError, setDeactivateError] = useState('')
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', contact_number: '',
    position: '', employee_id: '', date_joined: '', national_id: '', address: '', password: '',
  })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true)
        const data = await adminAPI.getStaff('logistics')
        setStaff(data || [])
      } catch (err) {
        setError('Failed to load staff')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStaff()
  }, [])

  const filteredStaff = staff.filter((s) => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase()
    const search = searchTerm.toLowerCase()
    return (
      fullName.includes(search) ||
      (s.employee_id || '').toLowerCase().includes(search)
    )
  })

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await adminAPI.addStaff({ ...formData, role: 'logistics', status: 'active' })
      setStaff(await adminAPI.getStaff('logistics'))
      setShowForm(false)
      setFormData({ first_name: '', last_name: '', email: '', contact_number: '', position: '', employee_id: '', date_joined: '', national_id: '', address: '', password: '' })
    } catch (err) {
      alert('Failed to add staff member. Please try again.')
      console.error(err)
    }
  }

  const handleDeactivate = async (e) => {
    e.preventDefault()
    if (!deactivateForm.reason.trim()) { setDeactivateError('Please provide a reason.'); return }
    try {
      const result = await adminAPI.verifyPassword(deactivateForm.password)
      if (!result.valid) { setDeactivateError('Incorrect password.'); return }
      const newStatus = staffToDeactivate?.status === 'active' ? 'inactive' : 'active'
      await adminAPI.updateStaffStatus(staffToDeactivate.id, { status: newStatus, deactivation_reason: deactivateForm.reason })
      setStaff(await adminAPI.getStaff('logistics'))
      setShowDeactivateModal(false)
      setStaffToDeactivate(null)
      setDeactivateForm({ password: '', reason: '' })
      setDeactivateError('')
      setSelectedStaff(null)
    } catch {
      setDeactivateError('Failed. Please try again.')
    }
  }

  const handleRemove = async (e) => {
    e.preventDefault()
    if (removeForm.admin_id !== 'ADMIN001') { setRemoveError('Incorrect Admin ID.'); return }
    if (!removeForm.reason.trim()) { setRemoveError('Please provide a reason.'); return }
    try {
      const result = await adminAPI.verifyPassword(removeForm.password)
      if (!result.valid) { setRemoveError('Incorrect password.'); return }
      await adminAPI.deleteStaff(staffToRemove.id)
      setStaff(staff.filter(s => s.id !== staffToRemove.id))
      setShowRemoveModal(false)
      setStaffToRemove(null)
      setRemoveForm({ admin_id: '', password: '', reason: '' })
      setRemoveError('')
      setSelectedStaff(null)
    } catch {
      setRemoveError('Failed to remove. Please try again.')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-400 text-sm">Loading staff...</div></div>
  if (error) return <div className="flex items-center justify-center h-64"><div className="text-red-400 text-sm">{error}</div></div>

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Logistics Team</h1>
          <p className="text-sm text-slate-500 mt-1">Manage logistics staff members</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#052659] text-white px-5 py-2.5 rounded-xl hover:bg-[#5483B3] transition text-sm font-semibold shadow-sm shadow-blue-200"
        >
          <Plus size={16} />
          Add Staff Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Staff</p>
              <p className="text-3xl font-bold text-[#1E293B] mt-1">{staff.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <User size={22} className="text-[#5483B3]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {staff.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <span className="text-green-600 font-bold text-xl">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Inactive</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {staff.filter(s => s.status === 'inactive').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <span className="text-red-600 font-bold text-xl">×</span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1E293B]">All Staff Members</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72 bg-slate-50"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide font-semibold">
                <th className="pb-4">Employee ID</th>
                <th className="pb-4">Name</th>
                <th className="pb-4">Contact</th>
                <th className="pb-4">Email</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-slate-100 hover:bg-[#EBF4FF] cursor-pointer transition"
                    onClick={() => setSelectedStaff(s)}
                  >
                    <td className="py-3 text-slate-600 font-medium">{s.employee_id || '—'}</td>
                    <td className="py-3 font-medium text-[#052659]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={14} className="text-[#5483B3]" />
                        </div>
                        {s.first_name} {s.last_name}
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">{s.contact_number || '—'}</td>
                    <td className="py-3 text-slate-600">{s.email || '—'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    {searchTerm ? `No staff found matching "${searchTerm}"` : 'No logistics staff found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Profile Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-[#1E293B]">Staff Profile</h2>
              <button onClick={() => setSelectedStaff(null)} className="p-2 hover:bg-slate-100 rounded-xl transition"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-[#5483B3]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1E293B]">{selectedStaff.first_name} {selectedStaff.last_name}</h3>
                    <p className="text-sm text-slate-500">{selectedStaff.role}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedStaff.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>{selectedStaff.status}</span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#052659] uppercase tracking-wide mb-3">Employment Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Employee ID</p>
                    <p className="text-sm font-medium text-[#1E293B] mt-1">{selectedStaff.employee_id || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Role</p>
                    <p className="text-sm font-medium text-[#1E293B] mt-1">{selectedStaff.role}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">National ID</p>
                    <p className="text-sm font-medium text-[#1E293B] mt-1">{selectedStaff.national_id || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Joined</p>
                    <p className="text-sm font-medium text-[#1E293B] mt-1">{selectedStaff.created_at?.split('T')[0] || '—'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#052659] uppercase tracking-wide mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                    <Mail size={16} className="text-[#5483B3]" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-medium text-[#1E293B]">{selectedStaff.email || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                    <Phone size={16} className="text-[#5483B3]" />
                    <div>
                      <p className="text-xs text-slate-500">Contact Number</p>
                      <p className="text-sm font-medium text-[#1E293B]">{selectedStaff.contact_number || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 space-y-3">
              <button
                onClick={() => { setStaffToDeactivate(selectedStaff); setShowDeactivateModal(true) }}
                className="w-full px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 rounded-lg text-sm font-medium transition"
              >
                {selectedStaff.status === 'active' ? 'Deactivate Staff Member' : 'Reactivate Staff Member'}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => { setStaffToRemove(selectedStaff); setShowRemoveModal(true) }}
                  className="flex-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-medium transition"
                >
                  Remove Permanently
                </button>
                <button onClick={() => setSelectedStaff(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-[#1E293B]">Add Logistics Staff</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-[#052659] uppercase tracking-wide mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">First Name <span className="text-red-500">*</span></label>
                      <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Last Name <span className="text-red-500">*</span></label>
                      <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">National ID <span className="text-red-500">*</span></label>
                    <input type="text" name="national_id" value={formData.national_id} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Address <span className="text-red-500">*</span></label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100" />
              <div>
                <h3 className="text-sm font-semibold text-[#052659] uppercase tracking-wide mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email Address <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@contrack.lk" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Contact Number <span className="text-red-500">*</span></label>
                    <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Temporary Password <span className="text-red-500">*</span></label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Staff member will use this to log in" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100" />
              <div>
                <h3 className="text-sm font-semibold text-[#052659] uppercase tracking-wide mb-4">Employment Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Employee ID <span className="text-red-500">*</span></label>
                      <input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} placeholder="e.g. OP001" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Date Joined <span className="text-red-500">*</span></label>
                      <input type="date" name="date_joined" value={formData.date_joined} onChange={handleChange} max={today} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Position <span className="text-red-500">*</span></label>
                    <select name="position" value={formData.position} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                      <option value="">Select position</option>
                      <option value="Logistics Manager">Logistics Manager</option>
                      <option value="Senior Logistics Officer">Senior Logistics Officer</option>
                      <option value="Logistics Officer">Logistics Officer</option>
                      <option value="Logistics Coordinator">Logistics Coordinator</option>
                      <option value="Logistics Assistant">Logistics Assistant</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#052659] text-white rounded-lg text-sm font-medium hover:bg-[#5483B3] transition">Add Staff Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><span className="text-orange-600 text-lg">⚠️</span></div>
                <div>
                  <h2 className="text-lg font-bold text-[#1E293B]">{staffToDeactivate?.status === 'active' ? 'Deactivate' : 'Reactivate'} Staff Member</h2>
                  <p className="text-sm text-slate-500">{staffToDeactivate?.first_name} {staffToDeactivate?.last_name} — {staffToDeactivate?.employee_id}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleDeactivate} className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-600">
                  {staffToDeactivate?.status === 'active' ? '⚠️ This will suspend their system access temporarily.' : '⚠️ This will restore their system access.'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Reason <span className="text-red-500">*</span></label>
                <textarea value={deactivateForm.reason} onChange={(e) => setDeactivateForm({ ...deactivateForm, reason: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Your Password <span className="text-red-500">*</span></label>
                <input type="password" value={deactivateForm.password} onChange={(e) => { setDeactivateForm({ ...deactivateForm, password: e.target.value }); setDeactivateError('') }} className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${deactivateError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} required />
                {deactivateError && <p className="text-red-500 text-xs mt-1">⚠️ {deactivateError}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowDeactivateModal(false); setDeactivateForm({ password: '', reason: '' }); setDeactivateError('') }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition">{staffToDeactivate?.status === 'active' ? 'Confirm Deactivation' : 'Confirm Reactivation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><span className="text-red-600 text-lg">🚨</span></div>
                <div>
                  <h2 className="text-lg font-bold text-[#1E293B]">Remove Staff Member</h2>
                  <p className="text-sm text-slate-500">{staffToRemove?.first_name} {staffToRemove?.last_name} — {staffToRemove?.employee_id}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleRemove} className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                <p className="text-sm font-semibold text-red-600">⚠️ This action is permanent!</p>
                <p className="text-sm text-red-500">Removing this staff member will immediately revoke their system access.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Reason for Removal <span className="text-red-500">*</span></label>
                <textarea value={removeForm.reason} onChange={(e) => setRemoveForm({ ...removeForm, reason: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Your Admin ID <span className="text-red-500">*</span></label>
                <input type="text" value={removeForm.admin_id} onChange={(e) => { setRemoveForm({ ...removeForm, admin_id: e.target.value }); setRemoveError('') }} className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 ${removeError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Your Password <span className="text-red-500">*</span></label>
                <input type="password" value={removeForm.password} onChange={(e) => { setRemoveForm({ ...removeForm, password: e.target.value }); setRemoveError('') }} className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 ${removeError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} required />
                {removeError && <p className="text-red-500 text-xs mt-1">⚠️ {removeError}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowRemoveModal(false); setRemoveForm({ admin_id: '', password: '', reason: '' }); setRemoveError('') }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">Confirm Removal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Logistics