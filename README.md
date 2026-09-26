# Pierre Clone v2 - Backend

REST API for personal finance management. Built with Node.js, Express, and SQLite.

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Create .env from template (or use defaults)
cp .env.example .env

# Start dev server with auto-reload
npm run dev
```

Server runs on `http://localhost:5000`

### Build & Run for Production

```bash
# Install dependencies (production only)
npm ci --production

# Create .env.production with real values
cp .env.example .env.production

# Start server
npm start
```

## Environment Variables

**Development** (`.env`):
```
PORT=5000
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
DATABASE_PATH=./database.sqlite
NODE_ENV=development
```

**Production** (`.env.production`):
```
PORT=5000
JWT_SECRET=generate-a-strong-random-secret
JWT_EXPIRES_IN=7d
DATABASE_PATH=./database.sqlite
NODE_ENV=production
```

⚠️ **Important:** Change `JWT_SECRET` in production! Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Tech Stack

- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite3** - Embedded database (file-based)
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **CORS** - Cross-origin requests

## Project Structure

```
src/
├── index.js              # Express app & server startup
├── config/
│   └── database.js       # SQLite initialization & schema
├── middleware/
│   └── auth.js          # JWT validation middleware
├── routes/
│   ├── auth.js          # POST /register, /login, /logout
│   ├── transactions.js   # CRUD transactions
│   └── accounts.js       # CRUD accounts
└── utils/
    └── jwt.js           # Token generation & verification
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Get JWT token
- `POST /api/auth/logout` - Invalidate session

### Transactions (require auth)
- `GET /api/transactions` - List user transactions
- `POST /api/transactions` - Create transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Accounts (require auth)
- `GET /api/accounts` - List user accounts
- `POST /api/accounts` - Create account
- `DELETE /api/accounts/:id` - Delete account

## Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

## Deploy to Production

### Option 1: Railway

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Option 2: Heroku

```bash
npm i -g heroku
heroku login
heroku create pierre-clone-api
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

### Option 3: Self-hosted VPS

```bash
sudo apt update && sudo apt install -y nodejs npm
git clone <repo-url>
cd pierre-clone-v2-backend
npm ci --production
nano .env.production  # Configure secrets
npm i -g pm2
pm2 start src/index.js --name pierre-api
pm2 startup && pm2 save
```

## Database Backup

```bash
# Backup local database
scp user@server:/path/to/database.sqlite ./backup.sqlite

# Or setup cron job
0 2 * * * cp /path/to/database.sqlite /backups/db-$(date +\%Y\%m\%d).sqlite
```

## Security

- Use HTTPS in production (nginx reverse proxy)
- Change JWT_SECRET to a strong random value
- Implement rate limiting on auth endpoints
- Backup database regularly
- Rotate JWT_SECRET periodically

## Troubleshooting

**Port in use:**
```bash
lsof -i :5000 && kill -9 <PID>
```

**Database locked:**
Ensure only one process accesses database.sqlite

**JWT errors:**
Verify JWT_SECRET is consistent across all instances

## Related

- **Frontend**: `pierre-clone-v2` (Next.js + React)
