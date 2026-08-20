import express from 'express'
import multer from 'multer'
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
  updateBid,
  deleteBid,
  getOpenBiddings,
  getChatMessages,
  sendMessage,
  getVehicleInspections,
  addInspectionRecord,
  getDashboardStats,
  getSupplierProfile,
  updateSupplierLogo
} from '../controllers/supplier.controller.js'

const router = express.Router()

// =============================================
// MULTER CONFIG
// =============================================
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, PNG, JPG files allowed'))
    }
  }
})
const uploadVehicleDocs = upload.fields([
  { name: 'insurance', maxCount: 1 },
  { name: 'port_pass', maxCount: 1 }
])

// --- Supplier Routes ---
router.get('/dashboard-stats', getDashboardStats)
router.get('/', getSupplierData)
router.post('/', createSupplierRecord)
router.patch('/:id/logo', upload.single('logo'), updateSupplierLogo)

// --- Vehicle Routes ---
router.get('/vehicles', getVehicles)
router.post('/vehicles', uploadVehicleDocs, addVehicle)
router.put('/vehicles/:id', uploadVehicleDocs, updateVehicle)
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
router.put('/bids/:id', updateBid)
router.delete('/bids/:id', deleteBid)

// --- Chat Routes ---
router.get('/chats/:chatId/messages', getChatMessages)
router.post('/chats/:chatId/messages', sendMessage)

// --- Inspection Routes ---
router.get('/inspections/:vehicleId', getVehicleInspections)
router.post('/inspections', addInspectionRecord)

router.get('/:id', getSupplierProfile)

export default router