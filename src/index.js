import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initializeDatabase } from './config/database.js'
import { errorHandler } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import transactionRoutes from './routes/transactions.js'
import accountRoutes from './routes/accounts.js'
import budgetRoutes from './routes/budgets.js'
import recurringRoutes from './routes/recurring.js'
import categoryRoutes from './routes/categories.js'
import tagRoutes from './routes/tags.js'
import pluggyRoutes from './routes/pluggy.js'

const app = express()
const PORT = process.env.PORT || 5000

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})

// Initialize database
initializeDatabase()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/accounts', accountRoutes)
// TODO: Fix remaining routes for PostgreSQL
// app.use('/api/budgets', budgetRoutes)
// app.use('/api/recurring', recurringRoutes)
// app.use('/api/categories', categoryRoutes)
// app.use('/api/tags', tagRoutes)
// app.use('/api/pluggy', pluggyRoutes)

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
