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

router.get('/accounts', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, pluggy_id, pluggy_name, bank_name FROM pluggy_connections WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    )
    res.json(result.rows || [])
  } catch (err) {
    res.status(500).json({ error: 'Query failed' })
  }
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

    if (!response.ok) {
      throw new Error(`Pluggy API error: ${response.status}`)
    }

    const data = await response.json()

    const result = await db.query(
      'INSERT INTO pluggy_connections (user_id, pluggy_id, pluggy_name, bank_name) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, pluggy_id) DO UPDATE SET pluggy_name = $3, bank_name = $4 RETURNING id',
      [req.userId, data.id, data.name || 'Pluggy Account', data.institution?.name || 'Bank']
    )

    res.status(201).json({
      id: result.rows[0].id,
      user_id: req.userId,
      pluggy_id: data.id,
      pluggy_name: data.name,
      bank_name: data.institution?.name
    })
  } catch (err) {
    console.error('Pluggy connection error:', err)
    res.status(500).json({ error: 'Connection failed' })
  }
})

router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const token = await getPluggyToken()

    const result = await db.query(
      'SELECT id, pluggy_id FROM pluggy_connections WHERE user_id = $1',
      [req.userId]
    )

    let synced = 0
    let totalTransactions = 0

    for (const connection of result.rows || []) {
      try {
        const response = await fetch(
          `${PLUGGY_API_URL}/accounts/${connection.pluggy_id}/transactions`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )

        if (!response.ok) {
          console.error(`Pluggy API error for account ${connection.pluggy_id}: ${response.status}`)
          continue
        }

        const data = await response.json()

        for (const tx of data.transactions || []) {
          try {
            await db.query(
              `INSERT INTO transactions (user_id, description, category, value, type, date, pluggy_id, pluggy_name, bank_name)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT DO NOTHING`,
              [
                req.userId,
                tx.description || 'Transaction',
                tx.category || 'Other',
                Math.abs(tx.amount || 0),
                tx.amount < 0 ? 'expense' : 'income',
                tx.date || new Date().toISOString(),
                connection.pluggy_id,
                tx.accountName || 'Pluggy Account',
                tx.institution?.name || 'Bank'
              ]
            )
            totalTransactions++
          } catch (txErr) {
            console.error('Error inserting transaction:', txErr)
          }
        }
        synced++
      } catch (err) {
        console.error(`Failed to sync account ${connection.pluggy_id}:`, err)
      }
    }

    res.json({ message: 'Sync completed', accounts_synced: synced, transactions_synced: totalTransactions })
  } catch (err) {
    console.error('Pluggy sync error:', err)
    res.status(500).json({ error: 'Sync failed' })
  }
})

export default router
