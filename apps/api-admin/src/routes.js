import express from 'express'
import {
  getDashboardStats,
  getAllOrders,
  getAllDrivers,
  addDriver,
  updateDriverStatus,
  getAllSuppliers,
  addSupplier,
  updateSupplierStatus,
  getAllStaff,
  updateStaffStatus,
  getAllBids,
  getAllIssues,
} from './controller.js'

const router = express.Router()

// Dashboard
router.get('/stats', getDashboardStats)

// Orders
router.get('/orders', getAllOrders)

// Drivers
router.get('/drivers', getAllDrivers)
router.post('/drivers', addDriver)
router.put('/drivers/:id/status', updateDriverStatus)

// Suppliers
router.get('/suppliers', getAllSuppliers)
router.post('/suppliers', addSupplier)
router.put('/suppliers/:id/status', updateSupplierStatus)

// Staff
router.get('/staff', getAllStaff)
router.put('/staff/:id/status', updateStaffStatus)

// Bids
router.get('/bids', getAllBids)

// Issues
router.get('/issues', getAllIssues)

export default router
