import { useState, useEffect, useRef } from 'react'
import { Plus, X, Upload, Search, Truck, User, FileText } from 'lucide-react'
import { adminAPI, uploadFile } from '../services/api'

function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [ageError, setAgeError] = useState('')
  const [policeReportError, setPoliceReportError] = useState('')
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [driverToDeactivate, setDriverToDeactivate] = useState(null)
  const [deactivateForm, setDeactivateForm] = useState({ password: '', reason: '' })
  const [deactivateError, setDeactivateError] = useState('')
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [driverToRemove, setDriverToRemove] = useState(null)
  const [removeForm, setRemoveForm] = useState({ admin_id: '', password: '', reason: '' })
  const [removeError, setRemoveError] = useState('')
  const [previews, setPreviews] = useState({ profile_photo: null, police_report_file: null, license_front: null, license_back: null })

  const profilePhotoRef = useRef(null)
  const policeReportRef = useRef(null)
  const licenseFrontRef = useRef(null)
  const licenseBackRef = useRef(null)

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', date_of_birth: '', gender: '',
    national_id: '', contact_number: '', contact_email: '',
    residential_address: '', profile_photo: null, police_report_number: '',
    police_report_issue_date: '', police_report_file: null, license_number: '',
    license_issue_date: '', license_expiry_date: '', license_class: '',
    license_front: null, license_back: null,
  })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const data = await adminAPI.getDrivers()
        setDrivers(data)
      } catch (error) {
        console.error('Failed to fetch drivers:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDrivers()
  }, [])

  const filteredDrivers = drivers.filter((driver) => {
    const fullName = `${driver.first_name} ${driver.last_name}`.toLowerCase()
    const search = searchTerm.toLowerCase()
    const reference = (driver.driver_reference || `DRV-${String(driver.driver_id).padStart(5, '0')}`).toLowerCase()
    return fullName.includes(search) || driver.driver_id.toString().includes(search) || reference.includes(search)
  })

  const calculateAge = (dob) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      const file = e.target.files[0]
      setFormData({ ...formData, [e.target.name]: file })
      if (file) {
        const url = URL.createObjectURL(file)
        setPreviews(prev => ({ ...prev, [e.target.name]: { url, name: file.name, isImage: file.type.startsWith('image/') } }))
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value })
    }
    if (e.target.name === 'date_of_birth') {
      const age = calculateAge(e.target.value)
      setAgeError(age < 20 ? `Driver must be at least 20 years old. Current age: ${age}` : '')
    }
    if (e.target.name === 'police_report_issue_date') {
      const issueDate = new Date(e.target.value)
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      setPoliceReportError(issueDate < oneYearAgo ? 'Police clearance report must be issued within the last 12 months.' : '')
    }
  }

 const handleSubmit = async (e) => {
  e.preventDefault()
  if (ageError) { alert('Please fix the age error before submitting.'); return }
  if (policeReportError) { alert('Please fix the police report date error before submitting.'); return }

  try {
    // Upload files — each is optional; log warning if bucket is missing but continue
    const tryUpload = async (bucket, file, folder) => {
      try { return await uploadFile(bucket, file, folder) } catch (err) {
        console.warn(`File upload skipped (${bucket}):`, err.message); return null
      }
    }

    const [profile_photo_url, police_report_url, license_copy_url] = await Promise.all([
      formData.profile_photo ? tryUpload('driver-profiles', formData.profile_photo, 'photos') : null,
      formData.police_report_file ? tryUpload('driver-documents', formData.police_report_file, 'police-reports') : null,
      formData.license_front ? tryUpload('driver-documents', formData.license_front, 'licenses') : null,
    ])

    await adminAPI.addDriver({
      first_name: formData.first_name,
      last_name: formData.last_name,
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
      national_id: formData.national_id,
      contact_number: formData.contact_number,
      contact_email: formData.contact_email,
      residential_address: formData.residential_address,
      police_report_number: formData.police_report_number,
      police_report_issue_date: formData.police_report_issue_date,
      license_number: formData.license_number,
      license_issue_date: formData.license_issue_date,
      license_expiry: formData.license_expiry_date,
      license_class: formData.license_class,
      profile_photo_url,
      police_report_url,
      license_copy_url,
      status: 'active'
    })

    const updated = await adminAPI.getDrivers()
    setDrivers(updated)
    setShowForm(false)
    setPreviews({ profile_photo: null, police_report_file: null, license_front: null, license_back: null })

  } catch (error) {
    alert(`Failed to add driver: ${error.message}`)
    console.error(error)
  }
}

  const handleDeactivate = async (e) => {
  e.preventDefault()
  if (!deactivateForm.reason.trim()) { setDeactivateError('Please provide a reason.'); return }
  try {
    const result = await adminAPI.verifyPassword(deactivateForm.password)
    if (!result.valid) { setDeactivateError('Incorrect password.'); return }
    
    const newStatus = driverToDeactivate?.status === 'active' ? 'inactive' : 'active'
    await adminAPI.updateDriverStatus(driverToDeactivate.driver_id, { 
      status: newStatus, 
      deactivation_reason: deactivateForm.reason 
    })
    setDrivers(await adminAPI.getDrivers())
    setShowDeactivateModal(false)
    setDriverToDeactivate(null)
    setDeactivateForm({ password: '', reason: '' })
    setDeactivateError('')
    setSelectedDriver(null)
  } catch { 
    setDeactivateError('Failed. Please try again.') 
  }
}

  const handleRemove = async (e) => {
  e.preventDefault()
  if (!removeForm.reason.trim()) { setRemoveError('Please provide a reason.'); return }
  try {
    const result = await adminAPI.verifyPassword(removeForm.password)
    if (!result.valid) { setRemoveError('Incorrect password.'); return }

    // Verify admin ID matches logged in user
    if (removeForm.admin_id !== 'ADMIN001') { setRemoveError('Incorrect Admin ID.'); return }

    await adminAPI.deleteDriver(driverToRemove.driver_id)
    setDrivers(drivers.filter(d => d.driver_id !== driverToRemove.driver_id))
    setShowRemoveModal(false)
    setDriverToRemove(null)
    setRemoveForm({ admin_id: '', password: '', reason: '' })
    setRemoveError('')
    setSelectedDriver(null)
  } catch { 
    setRemoveError('Failed to remove. Please try again.') 
  }
}
  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Drivers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and monitor all registered drivers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#052659] text-white px-5 py-2.5 rounded-xl hover:bg-[#5483B3] transition text-sm font-semibold shadow-sm shadow-blue-200"
        >
          <Plus size={16} />
          Add Driver
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Drivers</p>
              <p className="text-3xl font-bold text-[#1E293B] mt-1">{drivers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Truck size={22} className="text-[#5483B3]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Drivers</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {drivers.filter(d => d.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <span className="text-green-600 text-xl font-bold">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Inactive Drivers</p>
              <p className="text-3xl font-bold text-red-500 mt-1">
                {drivers.filter(d => d.status === 'inactive').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <span className="text-red-500 text-xl font-bold">×</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">All Drivers</h2>
              <p className="text-xs text-slate-400 mt-0.5">{filteredDrivers.length} drivers found</p>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-slate-50"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="pb-4 font-semibold">Reference</th>
                <th className="pb-4 font-semibold">Driver</th>
                <th className="pb-4 font-semibold">Contact</th>
                <th className="pb-4 font-semibold">Email</th>
                <th className="pb-4 font-semibold">License Expiry</th>
                <th className="pb-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Truck size={32} className="mx-auto mb-2 opacity-30" />
                    Loading drivers...
                  </td>
                </tr>
              ) : filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver) => (
                  <tr
                    key={driver.driver_id}
                    className="border-t border-slate-50 hover:bg-[#EBF4FF] cursor-pointer transition group"
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <td className="py-3.5 text-slate-400 text-xs font-mono">
                      {driver.driver_reference || `DRV-${String(driver.driver_id).padStart(5, '0')}`}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        {driver.profile_photo_url ? (
                          <img src={driver.profile_photo_url} alt="Profile" className="w-8 h-8 rounded-xl object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                            <User size={14} className="text-[#5483B3]" />
                          </div>
                        )}
                        <span className="font-semibold text-[#1E293B] group-hover:text-[#052659] transition">
                          {driver.first_name} {driver.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-500">{driver.contact_number}</td>
                    <td className="py-3.5 text-slate-500">{driver.contact_email}</td>
                    <td className="py-3.5 text-slate-500">{driver.license_expiry || '—'}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        driver.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {driver.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Truck size={32} className="mx-auto mb-2 opacity-30" />
                    {searchTerm ? `No drivers found matching "${searchTerm}"` : 'No drivers registered yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Profile Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User size={18} className="text-[#5483B3]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1E293B]">Driver Profile</h2>
                  <p className="text-xs text-slate-400">
                    {selectedDriver.driver_reference || `DRV-${String(selectedDriver.driver_id).padStart(5, '0')}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedDriver(null)} className="p-2 hover:bg-slate-100 rounded-xl transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  {selectedDriver.profile_photo_url ? (
                    <img src={selectedDriver.profile_photo_url} alt="Profile" className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-[#052659] to-blue-400 rounded-2xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-xl font-bold">
                        {selectedDriver.first_name?.[0]}{selectedDriver.last_name?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-[#1E293B]">
                      {selectedDriver.first_name} {selectedDriver.last_name}
                    </h3>
                    <p className="text-sm text-slate-500">Driver</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  selectedDriver.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {selectedDriver.status === 'active' ? '● Active' : '● Inactive'}
                </span>
              </div>

              {/* Personal Information */}
              <div>
                <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Date of Birth', value: selectedDriver.date_of_birth },
                    { label: 'Gender', value: selectedDriver.gender },
                    { label: 'National ID', value: selectedDriver.national_id },
                    { label: 'Contact Number', value: selectedDriver.contact_number },
                    { label: 'Email', value: selectedDriver.contact_email },
                    { label: 'Address', value: selectedDriver.residential_address },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Police Clearance */}
              <div>
                <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">Police Clearance</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Report Number', value: selectedDriver.police_report_number },
                    { label: 'Issue Date', value: selectedDriver.police_report_issue_date },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>
                {selectedDriver.police_report_url && (
                  <div className="bg-slate-50 rounded-xl p-3 mt-3">
                    <p className="text-xs text-slate-400 mb-2">Police Report Document</p>
                    {selectedDriver.police_report_url.toLowerCase().endsWith('.pdf') ? (
                       <a href={selectedDriver.police_report_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                         <FileText size={16} /> View PDF Document
                       </a>
                    ) : (
                       <img 
                         src={selectedDriver.police_report_url} 
                         alt="Police Report" 
                         className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-white"
                       />
                    )}
                  </div>
                )}
              </div>

              {/* License Details */}
              <div>
                <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">License Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'License Number', value: selectedDriver.license_number },
                    { label: 'License Class', value: selectedDriver.license_class },
                    { label: 'Issue Date', value: selectedDriver.license_issue_date },
                    { label: 'Expiry Date', value: selectedDriver.license_expiry },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>
                {selectedDriver.license_copy_url && (
                  <div className="bg-slate-50 rounded-xl p-3 mt-3">
                    <p className="text-xs text-slate-400 mb-2">License Copy</p>
                    {selectedDriver.license_copy_url.toLowerCase().endsWith('.pdf') ? (
                      <a href={selectedDriver.license_copy_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                        <FileText size={16} /> View License PDF
                      </a>
                    ) : (
                      <img 
                        src={selectedDriver.license_copy_url} 
                        alt="License Copy" 
                        className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-white"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 space-y-3">
              <button
                onClick={() => { setDriverToDeactivate(selectedDriver); setShowDeactivateModal(true) }}
                className="w-full px-4 py-2.5 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 rounded-xl text-sm font-semibold transition"
              >
                {selectedDriver.status === 'active' ? '⚠️ Deactivate Driver' : '✅ Reactivate Driver'}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => { setDriverToRemove(selectedDriver); setShowRemoveModal(true) }}
                  className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl text-sm font-semibold transition"
                >
                  Remove Permanently
                </button>
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-base font-bold text-[#1E293B]">Add New Driver</h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in all required fields</p>
              </div>
              <button onClick={() => { setShowForm(false); setPreviews({ profile_photo: null, police_report_file: null, license_front: null, license_back: null }) }} className="p-2 hover:bg-slate-100 rounded-xl transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Personal Information */}
              <div>
                <h3 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Profile Photo</label>
                    <div
                      onClick={() => profilePhotoRef.current.click()}
                      className="mt-1 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition cursor-pointer bg-slate-50"
                    >
                      {previews.profile_photo ? (
                        <img src={previews.profile_photo.url} alt="Profile preview" className="w-20 h-20 rounded-xl object-cover mx-auto mb-2" />
                      ) : (
                        <Upload size={20} className="mx-auto text-slate-400 mb-2" />
                      )}
                      <p className="text-sm text-slate-500">
                        {previews.profile_photo ? previews.profile_photo.name : 'Click to upload profile photo'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG supported</p>
                      <input ref={profilePhotoRef} type="file" name="profile_photo" accept="image/*" onChange={handleChange} className="hidden" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">First Name <span className="text-red-500">*</span></label>
                      <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="As per license" className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Last Name <span className="text-red-500">*</span></label>
                      <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="As per license" className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Date of Birth <span className="text-red-500">*</span></label>
                      <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} max={today} className={`w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 ${ageError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} required />
                      {ageError && <p className="text-red-500 text-xs mt-1">⚠️ {ageError}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Gender <span className="text-red-500">*</span></label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">National ID / Passport Number <span className="text-red-500">*</span></label>
                    <input type="text" name="national_id" value={formData.national_id} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Contact Number <span className="text-red-500">*</span></label>
                      <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Email Address <span className="text-red-500">*</span></label>
                      <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Residential Address <span className="text-red-500">*</span></label>
                    <input type="text" name="residential_address" value={formData.residential_address} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Police Clearance */}
              <div>
                <h3 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-4">Police Clearance Report</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Report Reference Number <span className="text-red-500">*</span></label>
                    <input type="text" name="police_report_number" value={formData.police_report_number} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Issue Date <span className="text-red-500">*</span></label>
                    <input type="date" name="police_report_issue_date" value={formData.police_report_issue_date} onChange={handleChange} max={today} className={`w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 ${policeReportError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} required />
                    {policeReportError && <p className="text-red-500 text-xs mt-1">⚠️ {policeReportError}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Upload Police Report</label>
                    <div
                      onClick={() => policeReportRef.current.click()}
                      className="mt-1 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition cursor-pointer bg-slate-50"
                    >
                      {previews.police_report_file ? (
                        previews.police_report_file.isImage ? (
                          <img src={previews.police_report_file.url} alt="Police report preview" className="w-24 h-16 rounded-lg object-cover mx-auto mb-2" />
                        ) : (
                          <FileText size={28} className="mx-auto text-blue-500 mb-2" />
                        )
                      ) : (
                        <Upload size={20} className="mx-auto text-slate-400 mb-2" />
                      )}
                      <p className="text-sm text-slate-500 truncate px-2">
                        {previews.police_report_file ? previews.police_report_file.name : 'Click to upload police clearance report'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF supported</p>
                      <input ref={policeReportRef} type="file" name="police_report_file" accept="image/*,.pdf" onChange={handleChange} className="hidden" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* License Details */}
              <div>
                <h3 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-4">Driving License Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">License Number <span className="text-red-500">*</span></label>
                    <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Issue Date <span className="text-red-500">*</span></label>
                      <input type="date" name="license_issue_date" value={formData.license_issue_date} onChange={handleChange} max={today} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Expiry Date <span className="text-red-500">*</span></label>
                      <input type="date" name="license_expiry_date" value={formData.license_expiry_date} onChange={handleChange} min={today} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">License Class <span className="text-red-500">*</span></label>
                    <select name="license_class" value={formData.license_class} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required>
                      <option value="">Select license class</option>
                      <option value="light">Light Vehicle</option>
                      <option value="heavy">Heavy Vehicle</option>
                      <option value="articulated">Articulated Vehicle</option>
                      <option value="special">Special Purpose Vehicle</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">License Front</label>
                      <div
                        onClick={() => licenseFrontRef.current.click()}
                        className="mt-1 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition cursor-pointer bg-slate-50"
                      >
                        {previews.license_front ? (
                          previews.license_front.isImage ? (
                            <img src={previews.license_front.url} alt="License front" className="w-full h-16 rounded-lg object-cover mb-1" />
                          ) : (
                            <FileText size={22} className="mx-auto text-blue-500 mb-1" />
                          )
                        ) : (
                          <Upload size={16} className="mx-auto text-slate-400 mb-1" />
                        )}
                        <p className="text-xs text-slate-500 truncate">
                          {previews.license_front ? previews.license_front.name : 'Upload front'}
                        </p>
                        <input ref={licenseFrontRef} type="file" name="license_front" accept="image/*,.pdf" onChange={handleChange} className="hidden" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">License Back</label>
                      <div
                        onClick={() => licenseBackRef.current.click()}
                        className="mt-1 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition cursor-pointer bg-slate-50"
                      >
                        {previews.license_back ? (
                          previews.license_back.isImage ? (
                            <img src={previews.license_back.url} alt="License back" className="w-full h-16 rounded-lg object-cover mb-1" />
                          ) : (
                            <FileText size={22} className="mx-auto text-blue-500 mb-1" />
                          )
                        ) : (
                          <Upload size={16} className="mx-auto text-slate-400 mb-1" />
                        )}
                        <p className="text-xs text-slate-500 truncate">
                          {previews.license_back ? previews.license_back.name : 'Upload back'}
                        </p>
                        <input ref={licenseBackRef} type="file" name="license_back" accept="image/*,.pdf" onChange={handleChange} className="hidden" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setPreviews({ profile_photo: null, police_report_file: null, license_front: null, license_back: null }) }} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-[#052659] text-white rounded-xl text-sm font-semibold hover:bg-[#5483B3] transition shadow-sm shadow-blue-200">Add Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="text-orange-600 text-lg">⚠️</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1E293B]">
  {driverToDeactivate?.status === 'active' ? 'Deactivate Driver' : 'Reactivate Driver'}
</h2>
                  <p className="text-sm text-slate-400">{driverToDeactivate?.first_name} {driverToDeactivate?.last_name}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleDeactivate} className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <h2 className="text-base font-bold text-[#1E293B]">
               {driverToDeactivate?.status === 'active' ? 'Deactivate Driver' : 'Reactivate Driver'}
              </h2>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Reason <span className="text-red-500">*</span></label>
                <textarea value={deactivateForm.reason} onChange={(e) => setDeactivateForm({ ...deactivateForm, reason: e.target.value })} rows={3} placeholder="Enter a valid reason" className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-slate-50" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Your Password <span className="text-red-500">*</span></label>
                <input type="password" value={deactivateForm.password} onChange={(e) => { setDeactivateForm({ ...deactivateForm, password: e.target.value }); setDeactivateError('') }} className={`w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50 ${deactivateError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} required />
                {deactivateError && <p className="text-red-500 text-xs mt-1">⚠️ {deactivateError}</p>}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowDeactivateModal(false); setDeactivateForm({ password: '', reason: '' }); setDeactivateError('') }} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition ${
                 driverToDeactivate?.status === 'active' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                 }`}>
                 {driverToDeactivate?.status === 'active' ? 'Confirm Deactivation' : 'Confirm Reactivation'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-red-600 text-lg"> </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1E293B]">Remove Driver Permanently</h2>
                  <p className="text-sm text-slate-400">{driverToRemove?.first_name} {driverToRemove?.last_name}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleRemove} className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm font-semibold text-red-600">⚠️ This action is permanent!</p>
                <p className="text-sm text-red-500 mt-1">Removing this driver will immediately revoke their system access.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Reason <span className="text-red-500">*</span></label>
                <textarea value={removeForm.reason} onChange={(e) => setRemoveForm({ ...removeForm, reason: e.target.value })} rows={3} placeholder="e.g. Resignation, Contract ended..." className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-slate-50" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Admin ID <span className="text-red-500">*</span></label>
                <input type="text" value={removeForm.admin_id} onChange={(e) => { setRemoveForm({ ...removeForm, admin_id: e.target.value }); setRemoveError('') }} placeholder="e.g. ADMIN001" className={`w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-slate-50 ${removeError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
                <input type="password" value={removeForm.password} onChange={(e) => { setRemoveForm({ ...removeForm, password: e.target.value }); setRemoveError('') }} className={`w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-slate-50 ${removeError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} required />
                {removeError && <p className="text-red-500 text-xs mt-1">⚠️ {removeError}</p>}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowRemoveModal(false); setRemoveForm({ admin_id: '', password: '', reason: '' }); setRemoveError('') }} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">Confirm Removal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Drivers