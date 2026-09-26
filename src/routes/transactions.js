import express from 'express'
import { db } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [req.userId])
    res.json(result.rows || [])
  } catch (err) {
    res.status(500).json({ error: 'Query failed' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { description, category, value, type, date } = req.body
    if (!description || !category || value === undefined || !type || !date) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const result = await db.query('INSERT INTO transactions (user_id, description, category, value, type, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [req.userId, description, category, value, type, date])
    res.status(201).json({ id: result.rows[0].id, user_id: req.userId, description, category, value, type, date })
  } catch (err) {
    res.status(500).json({ error: 'Insert failed' })
  }
})

router.get('/:id', authMiddleware, (req, res) => {
  db.get(
    'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Query failed' })
      if (!row) return res.status(404).json({ error: 'Not found' })
      res.json(row)
    }
  )
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' })
  }
})

export default router
