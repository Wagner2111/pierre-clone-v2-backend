import express from 'express'
import { db } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  db.all(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
    [req.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Query failed' })
      res.json(rows || [])
    }
  )
})

router.post('/', authMiddleware, (req, res) => {
  const { description, category, value, type, date } = req.body

  if (!description || !category || value === undefined || !type || !date) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  db.run(
    'INSERT INTO transactions (user_id, description, category, value, type, date) VALUES (?, ?, ?, ?, ?, ?)',
    [req.userId, description, category, value, type, date],
    function (err) {
      if (err) return res.status(500).json({ error: 'Insert failed' })
      res.status(201).json({
        id: this.lastID,
        user_id: req.userId,
        description,
        category,
        value,
        type,
        date
      })
    }
  )
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

router.delete('/:id', authMiddleware, (req, res) => {
  db.run(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Delete failed' })
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' })
      res.json({ message: 'Deleted' })
    }
  )
})

export default router
