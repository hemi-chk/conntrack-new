import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import { Server } from 'socket.io'
import { tempOrderLocations } from './data/tempOrderLocations.js'

// Routes — logistics branch routes
import logisticsRoutes from './routes/logistics.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// HTTP Server wrapper for Socket.io
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Socket.io Realtime Tracking Connection
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`)

  // Handle client requesting location for a specific order
  socket.on('join_order_tracking', (orderId) => {
    console.log(`[Socket.io] Client ${socket.id} joined tracking room for Order #${orderId}`)
    socket.join(`order_${orderId}`)

    // Get order location from local temp locations object (without DB connection)
    const locationData = tempOrderLocations[String(orderId)] || {
      order_id: parseInt(orderId, 10),
      latitude: 6.9271000,
      longitude: 79.8612000,
      current_location: "Default Logistics Hub",
      status: "in_transit"
    }

    // Emit immediate location update to client
    socket.emit('location_update', locationData)
  })

  // Simulated GPS live movement update (moves marker slightly over time)
  const interval = setInterval(() => {
    socket.rooms.forEach((room) => {
      if (room.startsWith('order_')) {
        const orderId = room.replace('order_', '')
        const baseLoc = tempOrderLocations[String(orderId)] || {
          order_id: parseInt(orderId, 10),
          latitude: 6.9271000,
          longitude: 79.8612000,
          current_location: "In Transit",
          status: "in_transit"
        }

        // Slight simulated coordinate fluctuation (+/- 0.0001) for live animation
        const updatedLoc = {
          ...baseLoc,
          latitude: baseLoc.latitude + (Math.random() - 0.5) * 0.0005,
          longitude: baseLoc.longitude + (Math.random() - 0.5) * 0.0005,
          recorded_at: new Date().toISOString()
        }

        io.to(room).emit('location_update', updatedLoc)
      }
    })
  }, 4000)

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`)
    clearInterval(interval)
  })
})

// Routes
app.use('/api/logistics', logisticsRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ConTrack API with Socket.io Realtime Map Server is running!' })
})

server.listen(PORT, () => {
  console.log(`Server & Socket.io running on port ${PORT}`)
})

export default app