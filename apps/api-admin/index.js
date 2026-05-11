import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { verifyToken, authorizeRole } from '@conntrack/api-core'
import adminRoutes from './src/routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5002

app.use(express.json())

// Apply auth middleware to all admin routes, requiring 'admin' role
// Note: Depending on your exact previous setup, you might want this per route, 
// but usually the admin service requires admin role for everything.
app.use('/', verifyToken, authorizeRole('admin'), adminRoutes)

app.get('/health', (req, res) => {
  res.json({ service: 'admin', status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Admin Service running on port ${PORT}`)
})
