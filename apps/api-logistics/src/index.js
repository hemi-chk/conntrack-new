import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Routes — logistics branch routes
import logisticsRoutes from './routes/logistics.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/logistics', logisticsRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ConTrack API Server is running!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app