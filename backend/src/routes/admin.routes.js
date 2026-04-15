import express from 'express'
const router = express.Router()

router.get('/users', (req, res) => {
  res.json({ message: 'Get all users' })
})

router.get('/orders', (req, res) => {
  res.json({ message: 'Get all orders' })
})

export default router