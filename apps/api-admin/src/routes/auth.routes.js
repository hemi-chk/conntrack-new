import express from 'express'
const router = express.Router()

router.post('/login', (req, res) => {
  res.json({ message: 'Login route working' })
})

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout route working' })
})

export default router