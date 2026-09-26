import express from 'express'
import { db } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC', [req.userId])
    res.json(result.rows || [])
  } catch (err) {
    res.status(500).json({ error: 'Query failed' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, type, balance = 0 } = req.body
    if (!name || !type) return res.status(400).json({ error: 'Name and type required' })
    const result = await db.query('INSERT INTO accounts (user_id, name, type, balance) VALUES ($1, $2, $3, $4) RETURNING id', [req.userId, name, type, balance])
    res.status(201).json({ id: result.rows[0].id, user_id: req.userId, name, type, balance })
  } catch (err) {
    res.status(500).json({ error: 'Insert failed' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' })
  }
})

export default router
