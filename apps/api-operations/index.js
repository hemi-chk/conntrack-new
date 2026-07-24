import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectMessaging } from '@conntrack/messaging'
import operationsRoutes from './src/routes/operations.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5003

app.use(cors())
app.use(express.json())

// Mounted at '/' because Gateway rewrites '/api/operations' by stripping it
app.use('/', operationsRoutes)

app.get('/health', (req, res) => {
  res.json({ service: 'operations', status: 'ok' })
})

connectMessaging(process.env.AMQP_URL).then(() => {
  app.listen(PORT, () => {
    console.log(`Operations Service running on port ${PORT}`)
  })
})

export default app
