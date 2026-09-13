import { authorizeRole, verifyToken } from '@conntrack/api-core'
import { connectMessaging } from '@conntrack/messaging'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import notificationRoutes from './src/routes/notification.routes.js'
import operationsRoutes from './src/routes/operations.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5003

app.use(cors())
app.use(express.json())

// Gateway rewrites /api/operations by stripping that prefix.
//
// Browser:
//   /api/operations/notifications
//
// Operations service receives:
//   /notifications

app.use(
  '/notifications',
  verifyToken,
  authorizeRole('operations'),
  notificationRoutes
)

// All other Operations routes.
app.use(
  '/',
  verifyToken,
  authorizeRole('operations'),
  operationsRoutes
)

app.get('/health', (req, res) => {
  res.json({
    service: 'operations',
    status: 'ok',
  })
})

connectMessaging(process.env.AMQP_URL).then(() => {
  app.listen(PORT, () => {
    console.log(
      `Operations Service running on port ${PORT}`
    )
  })
})

export default app