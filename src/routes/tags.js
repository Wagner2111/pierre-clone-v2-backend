import express from 'express'
import { db } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  db.all(
    'SELECT * FROM tags WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Query failed' })
      res.json(rows || [])
    }
  )
})

router.post('/', authMiddleware, (req, res) => {
  const { name, color } = req.body

  if (!name) {
    return res.status(400).json({ error: 'Name required' })
  }

  db.run(
    'INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)',
    [req.userId, name, color || '#3b82f6'],
    function (err) {
      if (err) return res.status(500).json({ error: 'Insert failed' })
      res.status(201).json({
        id: this.lastID,
        user_id: req.userId,
        name,
        color: color || '#3b82f6'
      })
    }
  )
})

router.post('/:id/transactions/:tx_id', authMiddleware, (req, res) => {
  db.run(
    'INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)',
    [req.params.tx_id, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Insert failed' })
      res.json({ message: 'Tag added' })
    }
  )
})

router.delete('/:id/transactions/:tx_id', authMiddleware, (req, res) => {
  db.run(
    'DELETE FROM transaction_tags WHERE transaction_id = ? AND tag_id = ?',
    [req.params.tx_id, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Delete failed' })
      res.json({ message: 'Tag removed' })
    }
  )
})

router.delete('/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM transaction_tags WHERE tag_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Delete failed' })

    db.run(
      'DELETE FROM tags WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId],
      function (err) {
        if (err) return res.status(500).json({ error: 'Delete failed' })
        if (this.changes === 0) return res.status(404).json({ error: 'Not found' })
        res.json({ message: 'Deleted' })
      }
    )
  })
})

export default router
