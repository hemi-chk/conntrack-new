import { useState, useEffect } from 'react'
import { adminAPI, uploadFile } from '../services/api'
import { Plus, X, Search, Building2, Upload, FileText } from 'lucide-react'

// WHY: Reusable upload field component
function UploadField({ label, name, onChange, required = false }) {
  const [fileName, setFileName] = useState('')

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFileName(e.target.files[0].name)
      onChange(e)
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1 border-2 border-dashed border-slate-200 rounded-xl p-3 hover:border-blue-400 transition cursor-pointer bg-slate-50">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Upload size={14} className="text-[#5483B3]" />
          </div>
          <div className="flex-1 min-w-0">
            {fileName ? (
              <p className="text-sm text-[#5483B3] font-medium truncate">✅ {fileName}</p>
            ) : (
              <p className="text-sm text-slate-500">Click to upload</p>
            )}
            <p className="text-xs text-slate-400">PDF, JPG or PNG accepted</p>
          </div>
          <input type="file" name={name} accept="image/*,.pdf" onChange={handleFileChange} className="hidden" required={required} />
        </label>
      </div>
    </div>
  )
}

function DocSlot({ label, url }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-xs text-slate-400 mb-1.5">{label}</p>
      {url ? (
        url.toLowerCase().endsWith('.pdf') ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#5483B3] hover:text-[#052659] text-sm font-medium transition">
            <FileText size={15} /> View PDF
          </a>
        ) : (
          <img src={url} alt={label} className="w-full max-h-36 object-contain rounded-lg border border-[#C1E8FF] bg-white" />
        )
      ) : (
        <p className="text-sm text-slate-400 italic">No document uploaded</p>
      )}
    </div>
  )
}

function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [supplierToDeactivate, setSupplierToDeactivate] = useState(null)
  const [deactivateForm, setDeactivateForm] = useState({ password: '', reason: '' })
  const [deactivateError, setDeactivateError] = useState('')

  const [formData, setFormData] = useState({
    company_name: '', registration_number: '', address: '',
    contact_person: '', contact_position: '', contact_number: '', email: '',
    tin_number: '', vat_number: '', director_name: '', director_nic: '',
    director_address: '', bank_name: '', account_number: '', account_name: '',
    company_overview: '', experience_years: '', past_clients: '', services: '',
    hcv_count: 0, lcv_count: 0,
    business_registration_doc: null, tax_registration_doc: null,
    vat_registration_doc: null, director_nic_doc: null, address_proof_doc: null,
    bank_statement_doc: null, audit_report_doc: null, vehicle_permit_doc: null,
    iso_certification_doc: null, safety_certification_doc: null,
    liability_insurance_doc: null, vehicle_insurance_doc: null,
  })

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await adminAPI.getSuppliers()
        setSuppliers(data)
      } catch (error) {
        console.error('Failed to fetch suppliers:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSuppliers()
  }, [])

  const filteredSuppliers = suppliers.filter((supplier) => {
    const name = supplier.company_name?.toLowerCase() || ''
    const search = searchTerm.toLowerCase()
    const reference = (supplier.supplier_reference || `SUP-${String(supplier.supplier_id).padStart(5, '0')}`).toLowerCase()
    return name.includes(search) || supplier.supplier_id?.toString().includes(search) || reference.includes(search)
  })

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] })
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const tryUpload = async (file, folder) => {
        if (!file) return null
        try { return await uploadFile('supplier-documents', file, folder) } catch (err) {
          console.warn(`File upload skipped (${folder}):`, err.message); return null
        }
      }

      const [
        business_registration_url, tax_registration_url, vat_registration_url,
        director_nic_url, address_proof_url, bank_statement_url,
        audit_report_url, vehicle_permit_url, iso_certification_url,
        safety_certification_url, liability_insurance_url, vehicle_insurance_url,
      ] = await Promise.all([
        tryUpload(formData.business_registration_doc, 'business-registration'),
        tryUpload(formData.tax_registration_doc, 'tax-registration'),
        tryUpload(formData.vat_registration_doc, 'vat-registration'),
        tryUpload(formData.director_nic_doc, 'director-nic'),
        tryUpload(formData.address_proof_doc, 'address-proof'),
        tryUpload(formData.bank_statement_doc, 'bank-statements'),
        tryUpload(formData.audit_report_doc, 'audit-reports'),
        tryUpload(formData.vehicle_permit_doc, 'vehicle-permits'),
        tryUpload(formData.iso_certification_doc, 'iso-certifications'),
        tryUpload(formData.safety_certification_doc, 'safety-certifications'),
        tryUpload(formData.liability_insurance_doc, 'liability-insurance'),
        tryUpload(formData.vehicle_insurance_doc, 'vehicle-insurance'),
      ])

      await adminAPI.addSupplier({
        company_name: formData.company_name,
        registration_number: formData.registration_number,
        address: formData.address,
        tin_number: formData.tin_number,
        vat_number: formData.vat_number,
        director_name: formData.director_name,
        director_nic: formData.director_nic,
        director_address: formData.director_address,
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        account_name: formData.account_name,
        company_overview: formData.company_overview,
        experience_years: parseInt(formData.experience_years) || 0,
        services: formData.services,
        past_clients: formData.past_clients,
        hcv_count: parseInt(formData.hcv_count) || 0,
        lcv_count: parseInt(formData.lcv_count) || 0,
        contact_person: formData.contact_person,
        contact_position: formData.contact_position,
        contact_number: formData.contact_number,
        email: formData.email,
        status: 'active',
        compliance_status: 'pending',
        business_registration_url,
        tax_registration_url,
        vat_registration_url,
        director_nic_url,
        address_proof_url,
        bank_statement_url,
        audit_report_url,
        vehicle_permit_url,
        iso_certification_url,
        safety_certification_url,
        liability_insurance_url,
        vehicle_insurance_url,
      })
      const updated = await adminAPI.getSuppliers()
      setSuppliers(updated)
      setShowForm(false)
    } catch (error) {
      alert('Failed to add supplier. Please try again.')
      console.error(error)
    }
  }

  const handleDeactivate = async (e) => {
    e.preventDefault()
    if (!deactivateForm.reason.trim()) { setDeactivateError('Please provide a reason.'); return }
    try {
      const result = await adminAPI.verifyPassword(deactivateForm.password)
      if (!result.valid) { setDeactivateError('Incorrect password.'); return }

      await adminAPI.updateSupplierStatus(supplierToDeactivate.supplier_id, {
        status: supplierToDeactivate.status === 'active' ? 'inactive' : 'active',
        deactivation_reason: deactivateForm.reason
      })
      setSuppliers(await adminAPI.getSuppliers())
      setShowDeactivateModal(false)
      setSupplierToDeactivate(null)
      setDeactivateForm({ password: '', reason: '' })
      setDeactivateError('')
      setSelectedSupplier(null)
    } catch {
      setDeactivateError('Failed to update supplier. Please try again.')
    }
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and monitor all registered suppliers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#052659] text-white px-5 py-2.5 rounded-xl hover:bg-[#5483B3] transition text-sm font-semibold shadow-sm shadow-blue-200"
        >
          <Plus size={16} />
          Add Supplier
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Suppliers</p>
              <p className="text-3xl font-bold text-[#1E293B] mt-1">{suppliers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Building2 size={22} className="text-[#5483B3]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Suppliers</p>
              <p className="text-3xl font-bold text-[#5483B3] mt-1">
                {suppliers.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#EBF4FF] rounded-xl flex items-center justify-center">
              <span className="text-[#5483B3] text-xl font-bold">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Inactive Suppliers</p>
              <p className="text-3xl font-bold text-slate-500 mt-1">
                {suppliers.filter(s => s.status === 'inactive').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <span className="text-slate-400 text-xl font-bold">×</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">All Suppliers</h2>
              <p className="text-xs text-slate-400 mt-0.5">{filteredSuppliers.length} suppliers found</p>
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
                <th className="pb-4 font-semibold">Company</th>
                <th className="pb-4 font-semibold">Contact Person</th>
                <th className="pb-4 font-semibold">Contact Number</th>
                <th className="pb-4 font-semibold">Email</th>
                <th className="pb-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                    Loading suppliers...
                  </td>
                </tr>
              ) : filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.supplier_id}
                    className="border-t border-slate-50 hover:bg-[#EBF4FF] cursor-pointer transition group"
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    <td className="py-3.5 text-slate-400 text-xs font-mono">
                      {supplier.supplier_reference || `SUP-${String(supplier.supplier_id).padStart(5, '0')}`}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Building2 size={14} className="text-[#5483B3]" />
                        </div>
                        <span className="font-semibold text-[#1E293B] group-hover:text-[#052659] transition">
                          {supplier.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-500">{supplier.contact_person}</td>
                    <td className="py-3.5 text-slate-500">{supplier.contact_number}</td>
                    <td className="py-3.5 text-slate-500">{supplier.email}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        supplier.status === 'active'
                          ? 'bg-[#C1E8FF] text-[#052659]'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {supplier.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                    {searchTerm ? `No suppliers found matching "${searchTerm}"` : 'No suppliers registered yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Profile Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 size={18} className="text-[#5483B3]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1E293B]">Supplier Profile</h2>
                  <p className="text-xs text-slate-400">
                    {selectedSupplier.supplier_reference || `SUP-${String(selectedSupplier.supplier_id).padStart(5, '0')}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="p-2 hover:bg-slate-100 rounded-xl transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Profile Header */}
              <div className="flex items-center justify-between p-4 bg-[#EBF4FF] rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#021024,#5483B3)' }}>
                    <Building2 size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1E293B]">{selectedSupplier.company_name}</h3>
                    <p className="text-sm text-slate-500">Transport Supplier</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  selectedSupplier.status === 'active'
                    ? 'bg-[#C1E8FF] text-[#052659]'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {selectedSupplier.status === 'active' ? '● Active' : '● Inactive'}
                </span>
              </div>

              {/* 1 — Company Information */}
              <div>
                <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">Company Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Registration Number</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.registration_number || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">VAT Number</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.vat_number || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                    <p className="text-xs text-slate-400">Company Address</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.address || '—'}</p>
                  </div>
                </div>
                <DocSlot label="Business Registration Document" url={selectedSupplier.business_registration_url} />
              </div>

              {/* 2 — Tax Registration */}
              <div>
                <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">Tax Registration</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">TIN Number</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.tin_number || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">VAT Registration Number</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.vat_number || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <DocSlot label="Tax Registration Certificate" url={selectedSupplier.tax_registration_url} />
                  <DocSlot label="VAT Registration Certificate" url={selectedSupplier.vat_registration_url} />
                </div>
              </div>

              {/* 3 — Directors & Shareholders */}
              <div>
                <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">Directors & Shareholder Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Director Full Name</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.director_name || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Director NIC / Passport</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.director_nic || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                    <p className="text-xs text-slate-400">Director Address</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.director_address || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <DocSlot label="Director NIC / Passport Copy" url={selectedSupplier.director_nic_url} />
                  <DocSlot label="Address Proof Document" url={selectedSupplier.address_proof_url} />
                </div>
              </div>

              {/* 4 — Bank Account */}
              <div>
                <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">Business Bank Account</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                    <p className="text-xs text-slate-400">Bank Name</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.bank_name || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Account Number</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.account_number || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Account Name</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.account_name || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <DocSlot label="Bank Statement" url={selectedSupplier.bank_statement_url} />
                  <DocSlot label="Audited Financial Report" url={selectedSupplier.audit_report_url} />
                </div>
              </div>

              {/* 5 — Company Profile */}
              <div>
                <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">Company Profile</h4>
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Company Overview</p>
                    <p className="text-sm text-[#1E293B] leading-relaxed">{selectedSupplier.company_overview || '—'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">Years of Experience</p>
                      <p className="text-sm font-semibold text-[#1E293B] mt-0.5">
                        {selectedSupplier.experience_years ? `${selectedSupplier.experience_years} years` : '—'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">Services Offered</p>
                      <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.services || '—'}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Past Clients</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.past_clients || '—'}</p>
                  </div>
                </div>
              </div>

              {/* 6 — Vehicle Capacity */}
              <div>
                <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">Vehicle Capacity</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">HCV (Heavy)</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.hcv_count ?? 0} vehicles</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">LCV (Light)</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.lcv_count ?? 0} vehicles</p>
                  </div>
                  <div className="bg-[#EBF4FF] rounded-xl p-3">
                    <p className="text-xs text-[#5483B3]">Total Fleet</p>
                    <p className="text-sm font-bold text-[#052659] mt-0.5">
                      {(selectedSupplier.hcv_count ?? 0) + (selectedSupplier.lcv_count ?? 0)} vehicles
                    </p>
                  </div>
                </div>
                <DocSlot label="Vehicle Permit(s)" url={selectedSupplier.vehicle_permit_url} />
              </div>

              {/* 7 — Certifications */}
              <div>
                <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">Certifications & Permits</h4>
                <div className="grid grid-cols-2 gap-3">
                  <DocSlot label="ISO Certification" url={selectedSupplier.iso_certification_url} />
                  <DocSlot label="Safety Certification" url={selectedSupplier.safety_certification_url} />
                </div>
              </div>

              {/* 8 — Insurance */}
              <div>
                <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">Insurance Documents</h4>
                <div className="grid grid-cols-2 gap-3">
                  <DocSlot label="Liability Insurance" url={selectedSupplier.liability_insurance_url} />
                  <DocSlot label="Vehicle Insurance" url={selectedSupplier.vehicle_insurance_url} />
                </div>
              </div>

              {/* 9 — Contact Details */}
              <div>
                <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">Contact Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Contact Person</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.contact_person || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Position / Designation</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.contact_position || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Contact Number</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.contact_number || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Email Address</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{selectedSupplier.email || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Deactivation reason — shown only when inactive */}
              {selectedSupplier.status === 'inactive' && selectedSupplier.deactivation_reason && (
                <div>
                  <h4 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-3">Deactivation Reason</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-sm text-[#1E293B]">{selectedSupplier.deactivation_reason}</p>
                  </div>
                </div>
              )}

            </div>

            <div className="p-6 border-t border-slate-100 space-y-3">
              <button
                onClick={() => {
                  setSupplierToDeactivate(selectedSupplier)
                  setShowDeactivateModal(true)
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition border ${
                  selectedSupplier.status === 'active'
                    ? 'bg-[#EBF4FF] text-[#5483B3] hover:bg-[#C1E8FF] border-[#C1E8FF]'
                    : 'bg-[#EBF4FF] text-[#052659] hover:bg-[#C1E8FF] border-[#C1E8FF]'
                }`}
              >
                {selectedSupplier.status === 'active' ? '⚠️ Deactivate Supplier' : '✅ Reactivate Supplier'}
              </button>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-base font-bold text-[#1E293B]">Add New Supplier</h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in all required fields</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* SECTION 1 — Company Information */}
              <div>
                <h3 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-4">Company Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Company Name <span className="text-red-500">*</span></label>
                    <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Company Registration Number <span className="text-red-500">*</span></label>
                    <input type="text" name="registration_number" value={formData.registration_number} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Company Address <span className="text-red-500">*</span></label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                  </div>
                  <UploadField label="Business Registration Document" name="business_registration_doc" onChange={handleChange} required />
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* SECTION 2 — Tax Registration */}
              <div>
                <h3 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-4">Tax Registration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">TIN Number <span className="text-red-500">*</span></label>
                    <input type="text" name="tin_number" value={formData.tin_number} onChange={handleChange} placeholder="Issued by Inland Revenue Department" className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">VAT Registration Number <span className="text-slate-400 font-normal">(if applicable)</span></label>
                    <input type="text" name="vat_number" value={formData.vat_number} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
                  </div>
                  <UploadField label="Tax Registration Certificate" name="tax_registration_doc" onChange={handleChange} required />
                  <UploadField label="VAT Registration Certificate (if applicable)" name="vat_registration_doc" onChange={handleChange} />
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* SECTION 3 — Directors */}
              <div>
                <h3 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-4">Directors & Shareholder Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Director Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="director_name" value={formData.director_name} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Director NIC / Passport Number <span className="text-red-500">*</span></label>
                    <input type="text" name="director_nic" value={formData.director_nic} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Director Address <span className="text-red-500">*</span></label>
                    <input type="text" name="director_address" value={formData.director_address} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                  </div>
                  <UploadField label="Director NIC / Passport Copy" name="director_nic_doc" onChange={handleChange} required />
                  <UploadField label="Address Proof Document" name="address_proof_doc" onChange={handleChange} required />
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* SECTION 4 — Bank Details */}
              <div>
                <h3 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-4">Business Bank Account</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Bank Name <span className="text-red-500">*</span></label>
                    <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Account Number <span className="text-red-500">*</span></label>
                      <input type="text" name="account_number" value={formData.account_number} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Account Name <span className="text-red-500">*</span></label>
                      <input type="text" name="account_name" value={formData.account_name} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                  </div>
                  <UploadField label="Bank Statement (last 3 months)" name="bank_statement_doc" onChange={handleChange} required />
                  <UploadField label="Audited Financial Report (if available)" name="audit_report_doc" onChange={handleChange} />
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* SECTION 5 — Company Profile */}
              <div>
                <h3 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-4">Company Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Company Overview <span className="text-red-500">*</span></label>
                    <textarea name="company_overview" value={formData.company_overview} onChange={handleChange} rows={3} placeholder="Brief description of the business..." className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Years of Experience <span className="text-red-500">*</span></label>
                      <input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} min="0" className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Services Offered <span className="text-red-500">*</span></label>
                      <input type="text" name="services" value={formData.services} onChange={handleChange} placeholder="e.g. Container transport, Cold chain" className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Past Clients</label>
                    <input type="text" name="past_clients" value={formData.past_clients} onChange={handleChange} placeholder="e.g. Hayleys, MAS Holdings, Dialog" className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* SECTION 6 — Certifications */}
              <div>
                <h3 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-4">Certifications & Permits</h3>
                <div className="space-y-4">
                  <UploadField label="Vehicle Permit(s)" name="vehicle_permit_doc" onChange={handleChange} required />
                  <UploadField label="ISO Certification (if applicable)" name="iso_certification_doc" onChange={handleChange} />
                  <UploadField label="Safety Certification" name="safety_certification_doc" onChange={handleChange} />
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* SECTION 7 — Insurance */}
              <div>
                <h3 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-4">Insurance Documents</h3>
                <div className="space-y-4">
                  <UploadField label="Liability Insurance" name="liability_insurance_doc" onChange={handleChange} required />
                  <UploadField label="Vehicle Insurance" name="vehicle_insurance_doc" onChange={handleChange} required />
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* SECTION 8 — Vehicle Capacity */}
              <div>
                <h3 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-4">Vehicle Capacity</h3>
                <div className="space-y-3">
                  {[
                    { key: 'hcv_count', label: 'HCV - Heavy Commercial Vehicle', sub: '3.6-16 tons' },
                    { key: 'lcv_count', label: 'LCV - Light Commercial Vehicle', sub: '3.5-6 tons' },
                  ].map((vehicle) => (
                    <div key={vehicle.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{vehicle.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{vehicle.sub}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setFormData({ ...formData, [vehicle.key]: Math.max(0, formData[vehicle.key] - 1) })} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold">−</button>
                        <span className="w-8 text-center text-sm font-bold text-[#1E293B]">{formData[vehicle.key]}</span>
                        <button type="button" onClick={() => setFormData({ ...formData, [vehicle.key]: formData[vehicle.key] + 1 })} className="w-8 h-8 rounded-full bg-[#052659] flex items-center justify-center text-white hover:bg-[#5483B3] transition font-bold">+</button>
                      </div>
                    </div>
                  ))}
                  {(formData.hcv_count + formData.lcv_count) > 0 && (
                    <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
                      <p className="text-sm text-[#052659] font-semibold">Total Fleet Size</p>
                      <p className="text-sm font-bold text-[#052659]">{formData.hcv_count + formData.lcv_count} vehicles</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* SECTION 9 — Contact Details */}
              <div>
                <h3 className="text-xs font-bold text-[#052659] uppercase tracking-widest mb-4">Contact Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Contact Person Name <span className="text-red-500">*</span></label>
                      <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Position / Designation <span className="text-red-500">*</span></label>
                      <input type="text" name="contact_position" value={formData.contact_position} onChange={handleChange} placeholder="e.g. Operations Manager" className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Contact Number <span className="text-red-500">*</span></label>
                      <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Email Address <span className="text-red-500">*</span></label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-[#052659] text-white rounded-xl text-sm font-semibold hover:bg-[#5483B3] transition shadow-sm shadow-blue-200">Add Supplier</button>
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
                <div className="w-10 h-10 bg-[#EBF4FF] rounded-xl flex items-center justify-center">
                  <span className="text-[#5483B3] text-lg">⚠️</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1E293B]">Deactivate Supplier</h2>
                  <p className="text-sm text-slate-400">{supplierToDeactivate?.company_name}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleDeactivate} className="p-6 space-y-4">
              <div className="bg-[#EBF4FF] border border-[#C1E8FF] rounded-xl p-3">
                <p className="text-sm text-[#5483B3]">⚠️ Deactivating this supplier will prevent them from bidding on new orders.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Reason <span className="text-red-500">*</span></label>
                <textarea value={deactivateForm.reason} onChange={(e) => setDeactivateForm({ ...deactivateForm, reason: e.target.value })} rows={3} placeholder="e.g. Failed to meet delivery standards..." className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-slate-50" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Your Password <span className="text-red-500">*</span></label>
                <input type="password" value={deactivateForm.password} onChange={(e) => { setDeactivateForm({ ...deactivateForm, password: e.target.value }); setDeactivateError('') }} className={`w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50 ${deactivateError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} required />
                {deactivateError && <p className="text-red-500 text-xs mt-1">⚠️ {deactivateError}</p>}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowDeactivateModal(false); setDeactivateForm({ password: '', reason: '' }); setDeactivateError('') }} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">Confirm Deactivation</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Suppliers