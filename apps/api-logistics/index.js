import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import logisticsRoutes from './src/routes/logistics.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5004

app.use(cors())
app.use(express.json())

// Mounted at '/' because Gateway rewrites '/api/logistics' by stripping it
app.use('/', logisticsRoutes)

app.get('/health', (req, res) => {
  res.json({ service: 'logistics', status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Logistics Service running on port ${PORT}`)
})

export default app
