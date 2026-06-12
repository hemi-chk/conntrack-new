import { useState } from 'react'
import { User, Bell, Shield, Building2, Save } from 'lucide-react'

function Settings() {
  // WHY: Controls which settings tab is active
  const [activeTab, setActiveTab] = useState('profile')

  // WHY: Stores profile form data
  const [profileForm, setProfileForm] = useState({
    first_name: 'Hemindi',
    last_name: 'Chathurika',
    email: 'hemindi@contrack.lk',
    contact_number: '0771234567',
    employee_id: 'ADMIN001',
  })

  // WHY: Stores password form data
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  // WHY: Stores notification preferences
  const [notifications, setNotifications] = useState({
    new_order: true,
    new_bid: true,
    bid_accepted: true,
    driver_update: true,
    license_expiry: true,
    system_alerts: true,
  })

  // WHY: Stores company settings
  const [companyForm, setCompanyForm] = useState({
    company_name: 'ConTrack Logistics',
    company_email: 'info@contrack.lk',
    company_phone: '0112345678',
    company_address: 'No. 123, Colombo 03, Sri Lanka',
  })

  // WHY: Shows success message after saving
  const [saveSuccess, setSaveSuccess] = useState('')

  // WHY: Shows password error
  const [passwordError, setPasswordError] = useState('')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  const handleSave = (section) => {
    // TODO: Connect to backend API
    setSaveSuccess(`${section} settings saved successfully!`)
    setTimeout(() => setSaveSuccess(''), 3000)
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match.')
      return
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    setPasswordError('')
    handleSave('Password')
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
  }

  return (
    <div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and system preferences</p>
      </div>

      {/* Success Message */}
      {/* WHY: Shows confirmation when settings are saved */}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600 font-medium">✅ {saveSuccess}</p>
        </div>
      )}

      <div className="flex gap-6">

        {/* Sidebar Tabs */}
        {/* WHY: Separate tabs keep settings organized and easy to navigate */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition border-b border-slate-100 last:border-0 ${
                  activeTab === tab.id
                    ? 'bg-[#EFF6FF] text-[#1E40AF]'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-[#1E293B] mb-6">Profile Settings</h2>

              {/* Profile Avatar */}
              {/* WHY: Visual identity for the admin account */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-2xl">
                <div className="w-16 h-16 bg-[#1E40AF] rounded-2xl flex items-center justify-center shadow-sm">
                  <span className="text-white text-xl font-bold">
                    {profileForm.first_name[0]}{profileForm.last_name[0]}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-[#1E293B]">{profileForm.first_name} {profileForm.last_name}</p>
                  <p className="text-sm text-slate-500">{profileForm.email}</p>
                  <p className="text-xs text-[#1E40AF] font-bold mt-1 uppercase tracking-widest">System Administrator</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">First Name</label>
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Contact Number</label>
                    <input
                      type="text"
                      value={profileForm.contact_number}
                      onChange={(e) => setProfileForm({ ...profileForm, contact_number: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Employee ID</label>
                    <input
                      type="text"
                      value={profileForm.employee_id}
                      disabled
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSave('Profile')}
                  className="flex items-center gap-2 bg-[#1E40AF] text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm font-semibold shadow-sm shadow-blue-200"
                >
                  <Save size={16} />
                  Save Profile
                </button>
              </div>
            </div>
          )}

          {/* COMPANY TAB */}
          {activeTab === 'company' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-[#1E293B] mb-6">Company Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Company Name</label>
                  <input
                    type="text"
                    value={companyForm.company_name}
                    onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Company Email</label>
                    <input
                      type="email"
                      value={companyForm.company_email}
                      onChange={(e) => setCompanyForm({ ...companyForm, company_email: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Company Phone</label>
                    <input
                      type="text"
                      value={companyForm.company_phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, company_phone: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Company Address</label>
                  <input
                    type="text"
                    value={companyForm.company_address}
                    onChange={(e) => setCompanyForm({ ...companyForm, company_address: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                {/* WHY: Company logo upload for branding */}
                <div>
                  <label className="text-sm font-medium text-slate-700">Company Logo</label>
                  <div className="mt-1 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition cursor-pointer bg-slate-50">
                    <img src="/logo.png" alt="Current Logo" className="h-12 mx-auto mb-2 object-contain" />
                    <p className="text-sm text-slate-500">Click to update logo</p>
                    <p className="text-xs text-slate-400 mt-1">PNG or SVG recommended</p>
                    <p className="text-xs text-slate-400 mt-1">* Upload will be enabled after backend integration</p>
                  </div>
                </div>

                <button
                  onClick={() => handleSave('Company')}
                  className="flex items-center gap-2 bg-[#1E40AF] text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm font-semibold shadow-sm shadow-blue-200"
                >
                  <Save size={16} />
                  Save Company Settings
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-[#1E293B] mb-2">Notification Settings</h2>
              <p className="text-sm text-slate-500 mb-6">Choose which notifications you want to receive</p>

              <div className="space-y-3">
                {[
                  { key: 'new_order', label: 'New Order Created', desc: 'When operations team creates a new order' },
                  { key: 'new_bid', label: 'New Bid Submitted', desc: 'When a supplier submits a bid' },
                  { key: 'bid_accepted', label: 'Bid Accepted', desc: 'When logistics team accepts a bid' },
                  { key: 'driver_update', label: 'Driver Location Updates', desc: 'When driver updates their location' },
                  { key: 'license_expiry', label: 'License Expiry Alerts', desc: 'When driver licenses are about to expire' },
                  { key: 'system_alerts', label: 'System Alerts', desc: 'Critical system issues and warnings' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    {/* WHY: Toggle switch for each notification type */}
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        notifications[item.key] ? 'bg-[#1E40AF]' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSave('Notification')}
                className="flex items-center gap-2 bg-[#1E40AF] text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm font-semibold shadow-sm shadow-blue-200 mt-6"
              >
                <Save size={16} />
                Save Notifications
              </button>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6">

              {/* Change Password */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-[#1E293B] mb-2">Change Password</h2>
                <p className="text-sm text-slate-500 mb-6">Choose a strong password with at least 8 characters</p>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className={`w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 ${
                        passwordError ? 'border-red-400 bg-red-50' : 'border-slate-200'
                      }`}
                      required
                    />
                    {passwordError && (
                      <p className="text-red-500 text-xs mt-1">⚠️ {passwordError}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-[#1E40AF] text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm font-semibold shadow-sm shadow-blue-200"
                  >
                    <Shield size={16} />
                    Update Password
                  </button>
                </form>
              </div>

              {/* Session Info */}
              {/* WHY: Shows admin their current session details */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-[#1E293B] mb-4">Session Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">Current Session</p>
                      <p className="text-xs text-slate-500">Logged in as Admin — ADMIN001</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">Last Login</p>
                      <p className="text-xs text-slate-500">Today at 5:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Settings