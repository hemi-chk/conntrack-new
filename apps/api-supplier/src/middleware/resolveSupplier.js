import { supabase } from '@conntrack/database'

// Supplier users authenticate as Supabase Auth users (req.user.id), but every
// supplier-scoped table keys off the numeric `supplier_id`. profiles.employee_id
// holds that mapping (set as String(supplier_id) when access is granted - see
// apps/api-admin/src/controller.js grantSupplierAccess). Resolving it here once,
// server-side, means every downstream handler can trust req.supplierId instead
// of a client-supplied supplier_id - closes the IDOR class where Supplier A
// could read/edit/delete Supplier B's data by passing a different id.
export const resolveSupplierId = async (req, res, next) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('employee_id')
    .eq('id', req.user.id)
    .maybeSingle()

  const supplierId = profile?.employee_id ? parseInt(profile.employee_id, 10) : null

  if (error || !supplierId || Number.isNaN(supplierId)) {
    return res.status(403).json({ message: 'No supplier account linked to this user' })
  }

  req.supplierId = supplierId
  next()
}
