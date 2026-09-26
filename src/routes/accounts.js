import express from 'express'
import { db } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  db.all(
    'SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Query failed' })
      res.json(rows || [])
    }
  )
})

router.post('/', authMiddleware, (req, res) => {
  const { name, type, balance = 0 } = req.body

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type required' })
  }

  db.run(
    'INSERT INTO accounts (user_id, name, type, balance) VALUES (?, ?, ?, ?)',
    [req.userId, name, type, balance],
    function (err) {
      if (err) return res.status(500).json({ error: 'Insert failed' })
      res.status(201).json({
        id: this.lastID,
        user_id: req.userId,
        name,
        type,
        balance
      })
    }
  )
})

router.delete('/:id', authMiddleware, (req, res) => {
  db.run(
    'DELETE FROM accounts WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Delete failed' })
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' })
      res.json({ message: 'Deleted' })
    }
  )
})

export default router
