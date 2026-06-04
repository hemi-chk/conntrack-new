import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Routes
import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import operationsRoutes from './routes/operations.routes.js'
import logisticsRoutes from './routes/logistics.routes.js'
import supplierRoutes from './routes/supplier.routes.js'
import driverRoutes from './routes/driver.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/operations', operationsRoutes)
app.use('/api/logistics', logisticsRoutes)
app.use('/api/supplier', supplierRoutes)
app.use('/api/driver', driverRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ConTrack API is running!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app