import express from 'express'
const router = express.Router()

router.get('/assignments', (req, res) => {
  res.json({ message: 'Get driver assignments' })
})

router.post('/tracking', (req, res) => {
  res.json({ message: 'Update tracking location' })
})

export default router