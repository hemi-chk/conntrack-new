import express from 'express'
import {
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

// Bids
router.get('/bids', getAllBids)

// Issues
router.get('/issues', getAllIssues)

export default router
