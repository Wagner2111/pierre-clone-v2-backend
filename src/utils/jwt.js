import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'your-secret-key'
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export const generateToken = (userId) => {
  return jwt.sign({ userId }, SECRET, { expiresIn: EXPIRES_IN })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET)
  } catch (err) {
    return null
  }
}
