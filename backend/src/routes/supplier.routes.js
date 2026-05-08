import express from 'express'
import { 
  getSupplierData, 
  createSupplierRecord,
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getDrivers,
  addDriver,
  updateDriver,
  deleteDriver,
  getBids,
  submitBid,
  getOpenBiddings,
  getChatMessages,
  sendMessage,
  getVehicleInspections,
  addInspectionRecord,
  getDashboardStats,
  getSupplierProfile
} from '../controllers/supplier.controller.js'

const router = express.Router()

// --- Supplier Routes ---
router.get('/dashboard-stats', getDashboardStats)
router.get('/', getSupplierData)
router.post('/', createSupplierRecord)

// --- Vehicle Routes ---
router.get('/vehicles', getVehicles)
router.post('/vehicles', addVehicle)
router.put('/vehicles/:id', updateVehicle)
router.delete('/vehicles/:id', deleteVehicle)

// --- Driver Routes ---
router.get('/drivers', getDrivers)
router.post('/drivers', addDriver)
router.put('/drivers/:id', updateDriver)
router.delete('/drivers/:id', deleteDriver)

// --- Bidding Routes ---
router.get('/bids', getBids)
router.get('/open-biddings', getOpenBiddings)
router.post('/bids', submitBid)

// --- Chat Routes ---
router.get('/chats/:chatId/messages', getChatMessages)
router.post('/chats/:chatId/messages', sendMessage)

// --- Inspection Routes ---
router.get('/inspections/:vehicleId', getVehicleInspections)
router.post('/inspections', addInspectionRecord)

router.get('/:id', getSupplierProfile)

export default router