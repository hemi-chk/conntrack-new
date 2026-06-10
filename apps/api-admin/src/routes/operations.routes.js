import express from 'express'
const router = express.Router()

router.get('/orders', (req, res) => {
  res.json({ message: 'Get all orders' })
})

router.post('/orders', (req, res) => {
  res.json({ message: 'Create new order' })
})

export default router