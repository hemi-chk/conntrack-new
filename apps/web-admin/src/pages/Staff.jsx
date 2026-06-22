import { useState, useEffect } from 'react'
import { Plus, X, Search, Users, Shield, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react'
import { adminAPI } from '../services/api'

const ROLES = ['operations', 'logistics', 'supplier']

const ROLE_COLORS = {
  admin:      { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  operations: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  logistics:  { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  supplier:   { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' },
}

const emptyForm = {
  first_name: '', last_name: '', email: '', password: '',
  role: 'operations', position: '', contact_number: '',
  employee_id: '', national_id: '', address: '', date_joined: '',
}

export default function Staff({ darkMode }) {
  const [staff, setStaff]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [formData, setFormData]     = useState(emptyForm)
  const [formError, setFormError]   = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => { fetchStaff() }, [])

  const fetchStaff = async () => {
    try {
      const data = await adminAPI.getStaff()
      setStaff(data)
    } catch {
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = staff.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase()
    const matchSearch = name.includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = roleFilter === 'all' || s.role === roleFilter
    return matchSearch && matchRole
  })

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setFormError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.password || formData.password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      await adminAPI.addStaff(formData)
      await fetchStaff()
      setShowForm(false)
      setFormData(emptyForm)
    } catch (err) {
      setFormError(err.message || 'Failed to create staff member.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleStatus = async (member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active'
    try {
      await adminAPI.updateStaffStatus(member.id, { status: newStatus })
      setStaff(prev => prev.map(s => s.id === member.id ? { ...s, status: newStatus } : s))
    } catch {
      alert('Failed to update status.')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleteLoading(true)
    try {
      await adminAPI.deleteStaff(confirmDelete.id)
      setStaff(prev => prev.filter(s => s.id !== confirmDelete.id))
      setConfirmDelete(null)
    } catch {
      alert('Failed to delete staff member.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const counts = {
    all: staff.length,
    operations: staff.filter(s => s.role === 'operations').length,
    logistics:  staff.filter(s => s.role === 'logistics').length,
    supplier:   staff.filter(s => s.role === 'supplier').length,
  }

  const bg   = darkMode ? '#0f172a' : '#F8FAFC'
  const card = darkMode ? '#1e293b' : '#FFFFFF'
  const border = darkMode ? '#334155' : '#E2E8F0'
  const text  = darkMode ? '#F1F5F9' : '#1E293B'
  const muted = darkMode ? '#94A3B8' : '#64748B'
  const inputBg = darkMode ? '#0f172a' : '#F8FAFC'

  return (
    <div style={{ padding: '24px', background: bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: text, margin: 0 }}>Staff Management</h1>
          <p style={{ fontSize: '13px', color: muted, margin: '4px 0 0' }}>
            Manage system users and their portal access
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormData(emptyForm); setFormError('') }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#1E40AF', color: 'white', border: 'none',
            borderRadius: '10px', padding: '10px 18px', fontSize: '14px',
            fontWeight: '600', cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* Role filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'operations', 'logistics', 'supplier'].map(role => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            style={{
              padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', border: roleFilter === role ? 'none' : `1px solid ${border}`,
              background: roleFilter === role ? '#1E40AF' : card,
              color: roleFilter === role ? 'white' : muted,
              transition: 'all 0.15s',
            }}
          >
            {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
            <span style={{
              marginLeft: '6px', background: roleFilter === role ? 'rgba(255,255,255,0.25)' : (darkMode ? '#334155' : '#F1F5F9'),
              borderRadius: '10px', padding: '1px 7px', fontSize: '11px',
              color: roleFilter === role ? 'white' : muted,
            }}>
              {counts[role] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '340px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: muted }} />
        <input
          placeholder="Search by name, email or ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px',
            border: `1.5px solid ${border}`, background: inputBg, color: text,
            fontSize: '13px', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: card, borderRadius: '16px', border: `1px solid ${border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: muted }}>Loading staff...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Users size={40} style={{ color: muted, margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: muted, fontSize: '14px', margin: 0 }}>No staff members found</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {['Name', 'Email', 'Role', 'Position', 'Employee ID', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: '11px',
                    fontWeight: '700', color: muted, textTransform: 'uppercase', letterSpacing: '0.06em'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((member, i) => {
                const rc = ROLE_COLORS[member.role] || ROLE_COLORS.operations
                return (
                  <tr key={member.id} style={{
                    borderBottom: i < filtered.length - 1 ? `1px solid ${border}` : 'none',
                    transition: 'background 0.1s',
                  }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: rc.bg, border: `1px solid ${rc.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '700', color: rc.text, flexShrink: 0,
                        }}>
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: text }}>
                          {member.first_name} {member.last_name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: muted }}>{member.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: rc.bg, color: rc.text, border: `1px solid ${rc.border}`,
                        borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '600',
                      }}>
                        {member.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: muted }}>{member.position || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: muted }}>{member.employee_id || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: member.status === 'active' ? '#F0FDF4' : '#FEF2F2',
                        color: member.status === 'active' ? '#15803D' : '#DC2626',
                        border: `1px solid ${member.status === 'active' ? '#BBF7D0' : '#FECACA'}`,
                        borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '600',
                      }}>
                        {member.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleToggleStatus(member)}
                          title={member.status === 'active' ? 'Deactivate' : 'Activate'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: member.status === 'active' ? '#15803D' : '#9CA3AF', padding: '4px' }}
                        >
                          {member.status === 'active' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(member)}
                          title="Delete"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '4px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Staff Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: card, borderRadius: '20px', width: '100%', maxWidth: '560px',
            maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: text, margin: 0 }}>Add Staff Member</h2>
                <p style={{ fontSize: '13px', color: muted, margin: '4px 0 0' }}>
                  Creates a login account and assigns portal access
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Role selector — most important field, shown first */}
              <div>
                <label style={labelStyle(muted)}>Portal Access / Role *</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {ROLES.map(r => {
                    const rc = ROLE_COLORS[r]
                    const selected = formData.role === r
                    return (
                      <button
                        key={r} type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: r }))}
                        style={{
                          padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                          cursor: 'pointer', border: selected ? `2px solid ${rc.text}` : `1.5px solid ${border}`,
                          background: selected ? rc.bg : card, color: selected ? rc.text : muted,
                        }}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle(muted)}>First Name *</label>
                  <input name="first_name" required value={formData.first_name} onChange={handleChange}
                    style={inputStyle(inputBg, border, text)} placeholder="John" />
                </div>
                <div>
                  <label style={labelStyle(muted)}>Last Name *</label>
                  <input name="last_name" required value={formData.last_name} onChange={handleChange}
                    style={inputStyle(inputBg, border, text)} placeholder="Doe" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle(muted)}>Email Address *</label>
                <input name="email" type="email" required value={formData.email} onChange={handleChange}
                  style={inputStyle(inputBg, border, text)} placeholder="john@contrack.lk" />
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle(muted)}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="password" type={showPassword ? 'text' : 'password'}
                    required value={formData.password} onChange={handleChange}
                    style={{ ...inputStyle(inputBg, border, text), paddingRight: '44px' }}
                    placeholder="Min. 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: muted }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Position & Contact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle(muted)}>Position</label>
                  <input name="position" value={formData.position} onChange={handleChange}
                    style={inputStyle(inputBg, border, text)} placeholder="e.g. Manager" />
                </div>
                <div>
                  <label style={labelStyle(muted)}>Contact Number</label>
                  <input name="contact_number" value={formData.contact_number} onChange={handleChange}
                    style={inputStyle(inputBg, border, text)} placeholder="0771234567" />
                </div>
              </div>

              {/* Employee ID & National ID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle(muted)}>Employee ID</label>
                  <input name="employee_id" value={formData.employee_id} onChange={handleChange}
                    style={inputStyle(inputBg, border, text)} placeholder="EMP001" />
                </div>
                <div>
                  <label style={labelStyle(muted)}>National ID</label>
                  <input name="national_id" value={formData.national_id} onChange={handleChange}
                    style={inputStyle(inputBg, border, text)} placeholder="123456789V" />
                </div>
              </div>

              {/* Date joined */}
              <div>
                <label style={labelStyle(muted)}>Date Joined</label>
                <input name="date_joined" type="date" value={formData.date_joined} onChange={handleChange}
                  style={inputStyle(inputBg, border, text)} />
              </div>

              {/* Address */}
              <div>
                <label style={labelStyle(muted)}>Address</label>
                <input name="address" value={formData.address} onChange={handleChange}
                  style={inputStyle(inputBg, border, text)} placeholder="No. 1, Colombo" />
              </div>

              {formError && (
                <div style={{
                  background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px',
                  padding: '10px 14px', fontSize: '13px', color: '#DC2626'
                }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{
                    flex: 1, padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer', border: `1.5px solid ${border}`, background: card, color: muted,
                  }}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  style={{
                    flex: 2, padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                    cursor: formLoading ? 'not-allowed' : 'pointer', border: 'none',
                    background: '#1E40AF', color: 'white', opacity: formLoading ? 0.7 : 1,
                  }}>
                  {formLoading ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: card, borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '400px', textAlign: 'center'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <Trash2 size={24} color="#DC2626" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: text, margin: '0 0 8px' }}>Delete Staff Member?</h3>
            <p style={{ fontSize: '13px', color: muted, margin: '0 0 24px' }}>
              This will permanently remove <strong style={{ color: text }}>{confirmDelete.first_name} {confirmDelete.last_name}</strong> and revoke their system access. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', border: `1.5px solid ${border}`, background: card, color: muted,
                }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer', border: 'none',
                  background: '#DC2626', color: 'white', opacity: deleteLoading ? 0.7 : 1,
                }}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

const labelStyle = (muted) => ({
  display: 'block', fontSize: '12px', fontWeight: '600',
  color: muted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
})

const inputStyle = (bg, border, text) => ({
  width: '100%', padding: '10px 12px', borderRadius: '8px',
  border: `1.5px solid ${border}`, background: bg, color: text,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
})
