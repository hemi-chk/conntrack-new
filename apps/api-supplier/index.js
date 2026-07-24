import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectMessaging, createConsumer } from '@conntrack/messaging'
import { supabase } from '@conntrack/database'
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

async function startSupplierConsumers() {
  // Supplement bidding open notifications in case direct write missed any supplier
  await createConsumer('order.bidding.opened', 'supplier.bidding.opened', async (payload) => {
    console.log('[Supplier] Bidding opened event received:', payload.order_reference)
  })

  // Log bid accepted/rejected events (direct notifications already written by logistics)
  await createConsumer('bid.accepted', 'supplier.bid.accepted', async (payload) => {
    console.log('[Supplier] Bid accepted event:', payload.order_id, '→ supplier', payload.supplier_id)
  })

  await createConsumer('bid.rejected', 'supplier.bid.rejected', async (payload) => {
    console.log('[Supplier] Bid rejected event:', payload.order_id, '→ supplier', payload.supplier_id)
  })
}

connectMessaging(process.env.AMQP_URL).then(async () => {
  await startSupplierConsumers()
  app.listen(PORT, () => {
    console.log(`Supplier Service running on port ${PORT}`)
  })
})

export default app
