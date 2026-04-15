import express from 'express'
const router = express.Router()

router.get('/orders', (req, res) => {
  res.json({ message: 'Get available orders' })
})

router.post('/bids', (req, res) => {
  res.json({ message: 'Submit a bid' })
})

export default router