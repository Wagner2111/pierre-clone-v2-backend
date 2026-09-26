import express from 'express'
import bcrypt from 'bcrypt'
import { db } from '../config/database.js'
import { generateToken } from '../utils/jwt.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    db.run(
      'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
      [email, name, passwordHash],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already registered' })
          }
          return res.status(500).json({ error: 'Registration failed' })
        }

        const token = generateToken(this.lastID)
        res.status(201).json({
          user: { id: this.lastID, email, name },
          token
        })
      }
    )
  } catch (err) {
    res.status(500).json({ error: 'Registration error' })
  }
})

router.post('/login', (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = generateToken(user.id)
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    })
  })
})

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

export default router
