import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { verifyToken, authorizeRole } from '@conntrack/api-core'
import { connectMessaging } from '@conntrack/messaging'
import logisticsRoutes from './src/routes/logistics.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5004

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ service: 'logistics', status: 'ok' })
})

// Mounted at '/' because Gateway rewrites '/api/logistics' by stripping it
app.use('/', verifyToken, authorizeRole('logistics'), logisticsRoutes)

connectMessaging(process.env.AMQP_URL).then(() => {
  app.listen(PORT, () => {
    console.log(`Logistics Service running on port ${PORT}`)
  })
})

export default app
