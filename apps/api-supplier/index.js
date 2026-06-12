import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import supplierRoutes from './src/routes/supplier.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5005

app.use(cors())
app.use(express.json())

// Mounted at '/' because Gateway rewrites '/api/supplier' by stripping it
app.use('/', supplierRoutes)

app.get('/health', (req, res) => {
  res.json({ service: 'supplier', status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Supplier Service running on port ${PORT}`)
})

export default app
