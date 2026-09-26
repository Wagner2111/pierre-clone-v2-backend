import express from 'express'
import { db } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7)

  db.all(
    'SELECT * FROM budgets WHERE user_id = ? AND month = ?',
    [req.userId, month],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Query failed' })
      res.json(rows || [])
    }
  )
})

router.post('/', authMiddleware, (req, res) => {
  const { category, limit, month } = req.body

  if (!category || !limit || !month) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  db.run(
    'INSERT OR REPLACE INTO budgets (user_id, category, limit, month) VALUES (?, ?, ?, ?)',
    [req.userId, category, limit, month],
    function (err) {
      if (err) return res.status(500).json({ error: 'Insert failed' })
      res.status(201).json({
        id: this.lastID,
        user_id: req.userId,
        category,
        limit,
        month
      })
    }
  )
})

router.delete('/:id', authMiddleware, (req, res) => {
  db.run(
    'DELETE FROM budgets WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Delete failed' })
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' })
      res.json({ message: 'Deleted' })
    }
  )
})

export default router
