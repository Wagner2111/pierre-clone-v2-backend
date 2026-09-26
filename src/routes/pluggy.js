import express from 'express'
import { db } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

const PLUGGY_API_URL = 'https://api.pluggy.ai'
const PLUGGY_CLIENT_ID = process.env.PLUGGY_CLIENT_ID || ''
const PLUGGY_CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET || ''

async function getPluggyToken() {
  try {
    const response = await fetch(`${PLUGGY_API_URL}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: PLUGGY_CLIENT_ID,
        clientSecret: PLUGGY_CLIENT_SECRET
      })
    })
    const data = await response.json()
    return data.accessToken
  } catch (err) {
    console.error('Failed to get Pluggy token:', err)
    throw err
  }
}

router.get('/accounts', authMiddleware, (req, res) => {
  db.all(
    'SELECT pluggy_id, pluggy_name, bank_name FROM transactions WHERE user_id = ? AND pluggy_id IS NOT NULL GROUP BY pluggy_id',
    [req.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Query failed' })
      res.json(rows || [])
    }
  )
})

router.post('/connect', authMiddleware, async (req, res) => {
  const { encryptedCredentials } = req.body

  if (!encryptedCredentials) {
    return res.status(400).json({ error: 'Credentials required' })
  }

  try {
    const token = await getPluggyToken()

    const response = await fetch(`${PLUGGY_API_URL}/connectors/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ encryptedCredentials })
    })

    const data = await response.json()

    db.run(
      'INSERT OR REPLACE INTO accounts (user_id, name, type) VALUES (?, ?, ?)',
      [req.userId, data.accountName || 'Pluggy Account', 'bank'],
      function (err) {
        if (err) return res.status(500).json({ error: 'Insert failed' })
        res.status(201).json({
          id: this.lastID,
          user_id: req.userId,
          pluggy_connection_id: data.id
        })
      }
    )
  } catch (err) {
    console.error('Pluggy connection error:', err)
    res.status(500).json({ error: 'Connection failed' })
  }
})

router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const token = await getPluggyToken()

    db.all(
      'SELECT DISTINCT pluggy_id FROM transactions WHERE user_id = ? AND pluggy_id IS NOT NULL',
      [req.userId],
      async (err, rows) => {
        if (err) return res.status(500).json({ error: 'Query failed' })

        let synced = 0
        for (const row of rows || []) {
          try {
            const response = await fetch(
              `${PLUGGY_API_URL}/accounts/${row.pluggy_id}/transactions`,
              {
                headers: { 'Authorization': `Bearer ${token}` }
              }
            )
            const data = await response.json()

            for (const tx of data.transactions || []) {
              db.run(
                'INSERT OR IGNORE INTO transactions (user_id, description, category, value, type, date, pluggy_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                  req.userId,
                  tx.description,
                  tx.category || 'Other',
                  Math.abs(tx.amount),
                  tx.amount < 0 ? 'expense' : 'income',
                  tx.date,
                  row.pluggy_id
                ]
              )
            }
            synced++
          } catch (err) {
            console.error(`Failed to sync account ${row.pluggy_id}:`, err)
          }
        }

        res.json({ message: 'Sync completed', accounts_synced: synced })
      }
    )
  } catch (err) {
    console.error('Pluggy sync error:', err)
    res.status(500).json({ error: 'Sync failed' })
  }
})

export default router
