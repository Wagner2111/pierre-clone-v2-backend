import express from 'express'
import { db } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  db.all(
    'SELECT * FROM recurring_transactions WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Query failed' })
      res.json(rows || [])
    }
  )
})

router.post('/', authMiddleware, (req, res) => {
  const { description, category, value, type, frequency, start_date, end_date } = req.body

  if (!description || !category || !value || !type || !frequency || !start_date) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  db.run(
    `INSERT INTO recurring_transactions (user_id, description, category, value, type, frequency, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.userId, description, category, value, type, frequency, start_date, end_date || null],
    function (err) {
      if (err) return res.status(500).json({ error: 'Insert failed' })
      res.status(201).json({
        id: this.lastID,
        user_id: req.userId,
        description,
        category,
        value,
        type,
        frequency,
        start_date,
        end_date: end_date || null,
        is_active: 1
      })
    }
  )
})

router.patch('/:id', authMiddleware, (req, res) => {
  const { is_active } = req.body

  db.run(
    'UPDATE recurring_transactions SET is_active = ? WHERE id = ? AND user_id = ?',
    [is_active ? 1 : 0, req.params.id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Update failed' })
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' })
      res.json({ message: 'Updated' })
    }
  )
})

router.delete('/:id', authMiddleware, (req, res) => {
  db.run(
    'DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Delete failed' })
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' })
      res.json({ message: 'Deleted' })
    }
  )
})

export default router
