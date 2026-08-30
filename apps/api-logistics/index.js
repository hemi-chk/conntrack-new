import { authorizeRole, verifyToken } from '@conntrack/api-core'
import { connectMessaging } from '@conntrack/messaging'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import logisticsRoutes from './src/routes/logistics.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5004

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ service: 'logistics', status: 'ok' })
})

// Support both gateway-rooted requests (`/notifications`) and direct service calls (`/api/logistics/notifications`)
app.use(['/', '/api/logistics'], verifyToken, authorizeRole('logistics'), logisticsRoutes)

connectMessaging(process.env.AMQP_URL).then(() => {
  app.listen(PORT, () => {
    console.log(`Logistics Service running on port ${PORT}`)
  })
})

export default app
