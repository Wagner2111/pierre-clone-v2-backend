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
    const result = await db.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [email, name, passwordHash]
    )
    const userId = result.rows[0].id
    const token = generateToken(userId)
    res.status(201).json({ user: { id: userId, email, name }, token })
  } catch (err) {
    if (err.message.includes('duplicate')) {
      return res.status(400).json({ error: 'Email already registered' })
    }
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    console.log('📝 Login request received:', { email: req.body.email })
    const { email, password } = req.body
    if (!email || !password) {
      console.log('❌ Missing email or password')
      return res.status(400).json({ error: 'Email and password required' })
    }
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]
    if (!user) {
      console.log('❌ User not found:', email)
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    console.log('✓ User found:', email)
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      console.log('❌ Password invalid for:', email)
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    console.log('✓ Password valid for:', email)
    const token = generateToken(user.id)
    console.log('✓ Token generated, sending response')
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token })
  } catch (err) {
    console.error('❌ Login error:', err.message)
    res.status(500).json({ error: 'Login failed' })
  }
})

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

export default router
