import express from 'express'
import multer from 'multer'
import {
  uploadFile,
  getDashboardStats,
  getAllOrders,
  getAllDrivers,
  addDriver,
  updateDriverStatus,
  deleteDriver,
  getAllSuppliers,
  addSupplier,
  updateSupplierStatus,
  getAllStaff,
  addStaff,
  updateStaffStatus,
  deleteStaff,
  grantAccess,
  grantSupplierAccess,
  getAllBids,
  getAllIssues,
  updateIssueStatus,
} from './controller.js'

const router = express.Router()

// =============================================
// MULTER CONFIG
// =============================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']
    if (allowedTypes.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only PDF, PNG, JPG files allowed'))
  }
})

// Upload
router.post('/upload', upload.single('file'), uploadFile)

// Dashboard
router.get('/stats', getDashboardStats)

// Orders
router.get('/orders', getAllOrders)

// Drivers
router.get('/drivers', getAllDrivers)
router.post('/drivers', addDriver)
router.put('/drivers/:id/status', updateDriverStatus)
router.delete('/drivers/:id', deleteDriver)


// Suppliers
router.get('/suppliers', getAllSuppliers)
router.post('/suppliers', addSupplier)
router.put('/suppliers/:id/status', updateSupplierStatus)

// Staff
router.get('/staff', getAllStaff)
router.post('/staff', addStaff)
router.put('/staff/:id/status', updateStaffStatus)
router.delete('/staff/:id', deleteStaff)
router.post('/staff/grant-access', grantAccess)
router.post('/staff/grant-supplier-access', grantSupplierAccess)

// Bids
router.get('/bids', getAllBids)

// Issues
router.get('/issues', getAllIssues)
router.put('/issues/:id/status', updateIssueStatus)

export default router
