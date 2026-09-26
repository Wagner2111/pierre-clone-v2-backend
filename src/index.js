import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initializeDatabase } from './config/database.js'
import { errorHandler } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import transactionRoutes from './routes/transactions.js'
import accountRoutes from './routes/accounts.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Initialize database
initializeDatabase()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/accounts', accountRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Error handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
