import express from 'express'
const router = express.Router()

router.get('/bids', (req, res) => {
  res.json({ message: 'Get all bids' })
})

router.put('/bids/:id', (req, res) => {
  res.json({ message: 'Update bid status' })
})

export default router
