import { useState, useEffect } from 'react'
import { X, Search, Users, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff, KeyRound } from 'lucide-react'
import { adminAPI } from '../services/api'

const ROLES = ['operations', 'logistics', 'supplier']

const ROLE_COLORS = {
  admin:      { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  operations: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  logistics:  { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  supplier:   { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' },
}

const emptyGrant = {
  role: 'operations', search: '', selectedPerson: null,
  email: '', password: '', showPw: false,
}

export default function Staff({ darkMode }) {
  const [staff, setStaff]           = useState([])
  const [suppliers, setSuppliers]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [grant, setGrant]           = useState(emptyGrant)
  const [grantLoading, setGrantLoading] = useState(false)
  const [grantError, setGrantError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => { fetchStaff(); fetchSuppliers() }, [])

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

  const fetchSuppliers = async () => {
    try {
      const data = await adminAPI.getSuppliers()
      setSuppliers(data || [])
    } catch {
      setSuppliers([])
    }
  }

  const grantResults = !grant.search.trim() ? [] : grant.role === 'supplier'
    ? suppliers.filter(s =>
        (s.supplier_reference || '').toLowerCase().includes(grant.search.toLowerCase()) ||
        (s.company_name || '').toLowerCase().includes(grant.search.toLowerCase())
      ).slice(0, 8)
    : staff.filter(s =>
        s.role === grant.role &&
        (
          (s.employee_id || '').toLowerCase().includes(grant.search.toLowerCase()) ||
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(grant.search.toLowerCase())
        )
      ).slice(0, 8)

  const handleGrantAccess = async (e) => {
    e.preventDefault()
    if (!grant.password || grant.password.length < 6) {
      setGrantError('Password must be at least 6 characters.')
      return
    }
    setGrantLoading(true)
    setGrantError('')
    try {
      if (grant.role === 'supplier') {
        await adminAPI.grantSupplierAccess({
          supplier_id: grant.selectedPerson.supplier_id,
          email: grant.email,
          password: grant.password,
        })
      } else {
        await adminAPI.grantAccess({
          profile_id: grant.selectedPerson.id,
          email: grant.email,
          password: grant.password,
        })
      }
      await fetchStaff()
      setShowGrantModal(false)
      setGrant(emptyGrant)
    } catch (err) {
      setGrantError(err.message || 'Failed to grant access.')
    } finally {
      setGrantLoading(false)
    }
  }

  const resetGrant = () => {
    setShowGrantModal(false)
    setGrant(emptyGrant)
    setGrantError('')
  }

  const filtered = staff.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase()
    const matchSearch = name.includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = roleFilter === 'all' || s.role === roleFilter
    return matchSearch && matchRole
  })

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
          onClick={() => setShowGrantModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#1E40AF', color: 'white', border: 'none',
            borderRadius: '10px', padding: '10px 18px', fontSize: '14px',
            fontWeight: '600', cursor: 'pointer'
          }}
        >
          <KeyRound size={16} /> Grant Access
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
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: muted }}>
                      {member.is_temp_account
                        ? <span style={{ fontSize: '11px', background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', borderRadius: '20px', padding: '2px 8px', fontWeight: '600' }}>Pending Access</span>
                        : (member.email || '—')}
                    </td>
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

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: card, borderRadius: '20px', width: '100%', maxWidth: '520px',
            maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: text, margin: 0 }}>Grant Portal Access</h2>
                <p style={{ fontSize: '13px', color: muted, margin: '4px 0 0' }}>
                  {grant.selectedPerson ? 'Set login credentials for this person' : 'Find an existing record to grant login access'}
                </p>
              </div>
              <button onClick={resetGrant} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted }}>
                <X size={20} />
              </button>
            </div>

            {/* Step 1: Role tabs + search */}
            {!grant.selectedPerson && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  {ROLES.map(r => {
                    const rc = ROLE_COLORS[r]
                    const sel = grant.role === r
                    return (
                      <button key={r} type="button"
                        onClick={() => setGrant(g => ({ ...g, role: r, search: '', selectedPerson: null }))}
                        style={{
                          flex: 1, padding: '8px 6px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                          cursor: 'pointer', border: sel ? `2px solid ${rc.text}` : `1.5px solid ${border}`,
                          background: sel ? rc.bg : card, color: sel ? rc.text : muted,
                        }}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    )
                  })}
                </div>

                <div>
                  <label style={labelStyle(muted)}>
                    {grant.role === 'supplier' ? 'Supplier Reference or Company Name' : 'Employee ID or Name'}
                  </label>
                  <div style={{ position: 'relative', marginTop: '6px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: muted }} />
                    <input
                      value={grant.search}
                      onChange={e => setGrant(g => ({ ...g, search: e.target.value }))}
                      placeholder={grant.role === 'supplier' ? 'e.g. SUP001 or Acme Ltd…' : 'e.g. EMP001 or John Doe…'}
                      style={{ ...inputStyle(inputBg, border, text), paddingLeft: '36px' }}
                    />
                  </div>
                </div>

                {grant.search.trim() && (
                  <div style={{ marginTop: '12px', border: `1px solid ${border}`, borderRadius: '12px', overflow: 'hidden' }}>
                    {grantResults.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: muted, fontSize: '13px' }}>
                        {grant.role === 'supplier' ? 'No suppliers found' : 'No staff found — make sure they were added from their department page first'}
                      </div>
                    ) : (
                      grantResults.map((item, idx) => (
                        <button key={idx} type="button"
                          onClick={() => setGrant(g => ({
                            ...g, selectedPerson: item,
                            email: (grant.role !== 'supplier' && !item.is_temp_account) ? (item.email || '') : '',
                          }))}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left',
                            padding: '12px 16px', background: 'none', border: 'none',
                            borderBottom: idx < grantResults.length - 1 ? `1px solid ${border}` : 'none',
                            cursor: 'pointer',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = (darkMode ? '#1e293b' : '#F8FAFC')}
                          onMouseOut={e => e.currentTarget.style.background = 'none'}
                        >
                          {grant.role === 'supplier' ? (
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: text }}>{item.company_name}</div>
                              <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>Ref: {item.supplier_reference}</div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: text }}>{item.first_name} {item.last_name}</div>
                                <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>ID: {item.employee_id} · {item.position || item.role}</div>
                              </div>
                              <span style={{
                                fontSize: '11px', fontWeight: '600', borderRadius: '20px', padding: '2px 8px', flexShrink: 0, marginLeft: '8px',
                                background: item.is_temp_account ? '#FFF7ED' : '#F0FDF4',
                                color: item.is_temp_account ? '#C2410C' : '#15803D',
                                border: `1px solid ${item.is_temp_account ? '#FED7AA' : '#BBF7D0'}`,
                              }}>
                                {item.is_temp_account ? 'Pending' : 'Active'}
                              </span>
                            </>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}

            {/* Step 2: Credentials form */}
            {grant.selectedPerson && (
              <form onSubmit={handleGrantAccess} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button type="button"
                  onClick={() => setGrant(g => ({ ...g, selectedPerson: null, email: '', password: '' }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, textAlign: 'left', fontSize: '13px', padding: 0 }}>
                  ← Back to search
                </button>

                <div style={{ background: inputBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: text }}>
                    {grant.role === 'supplier' ? grant.selectedPerson.company_name : `${grant.selectedPerson.first_name} ${grant.selectedPerson.last_name}`}
                  </div>
                  <div style={{ fontSize: '12px', color: muted, marginTop: '3px' }}>
                    {grant.role === 'supplier'
                      ? `Supplier Ref: ${grant.selectedPerson.supplier_reference}`
                      : `Employee ID: ${grant.selectedPerson.employee_id} · ${grant.selectedPerson.position || grant.role}`}
                  </div>
                </div>

                {grant.role !== 'supplier' && !grant.selectedPerson.is_temp_account && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#15803D' }}>
                    This person already has portal access ({grant.selectedPerson.email}). Submitting will update their login email and password.
                  </div>
                )}

                <div>
                  <label style={labelStyle(muted)}>Login Email *</label>
                  <input type="email" required value={grant.email}
                    onChange={e => { setGrant(g => ({ ...g, email: e.target.value })); setGrantError('') }}
                    style={{ ...inputStyle(inputBg, border, text), marginTop: '6px' }}
                    placeholder="name@contrack.lk" />
                </div>

                <div>
                  <label style={labelStyle(muted)}>Password *</label>
                  <div style={{ position: 'relative', marginTop: '6px' }}>
                    <input type={grant.showPw ? 'text' : 'password'} required value={grant.password}
                      onChange={e => { setGrant(g => ({ ...g, password: e.target.value })); setGrantError('') }}
                      style={{ ...inputStyle(inputBg, border, text), paddingRight: '44px' }}
                      placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setGrant(g => ({ ...g, showPw: !g.showPw }))}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: muted }}>
                      {grant.showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {grantError && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#DC2626' }}>
                    {grantError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <button type="button" onClick={resetGrant}
                    style={{ flex: 1, padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', border: `1.5px solid ${border}`, background: card, color: muted }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={grantLoading}
                    style={{ flex: 2, padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: grantLoading ? 'not-allowed' : 'pointer', border: 'none', background: '#1E40AF', color: 'white', opacity: grantLoading ? 0.7 : 1 }}>
                    {grantLoading
                      ? (grant.role !== 'supplier' && !grant.selectedPerson.is_temp_account ? 'Updating…' : 'Granting Access…')
                      : (grant.role !== 'supplier' && !grant.selectedPerson.is_temp_account ? 'Update Login Credentials' : 'Grant Portal Access')}
                  </button>
                </div>
              </form>
            )}
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
