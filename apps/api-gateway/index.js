import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createProxyMiddleware } from 'http-proxy-middleware'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
// Note: Do NOT use express.json() here, because the proxy middleware needs the raw stream to forward to the microservices.

// Define routing map
const services = {
  '/api/auth': 'http://localhost:5001',
  '/api/admin': 'http://localhost:5002',
  '/api/operations': 'http://localhost:5003',
  '/api/logistics': 'http://localhost:5004',
  '/api/supplier': 'http://localhost:5005',
  '/api/driver': 'http://localhost:5006',
}

// Attach proxy middleware
for (const [route, target] of Object.entries(services)) {
  app.use(route, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${route}`]: '', // Optional: remove the /api/xyz prefix before forwarding. Wait, no.
      // Actually, if we forward to the root of the microservice, we should remove the prefix.
      // But let's check how the microservices are set up:
      // api-auth has `app.post('/login')`. If a request comes to /api/auth/login, we strip `/api/auth` so it hits `/login`.
    },
    // We rewrite the path to strip out the prefix so the microservice just handles its root
    pathRewrite: (path, req) => path.replace(route, ''),
    onProxyReq: (proxyReq, req, res) => {
      // Log for debugging
      console.log(`[Gateway] Proxied ${req.method} ${req.url} -> ${target}${proxyReq.path}`);
    },
    onError: (err, req, res) => {
      console.error(`[Gateway] Proxy error to ${target}:`, err.message);
      res.status(502).json({ error: 'Service Unavailable' });
    }
  }))
}

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ConTrack API Gateway is running!' })
})

app.listen(PORT, () => {
  console.log(`API Gateway routing traffic on port ${PORT}`)
})
