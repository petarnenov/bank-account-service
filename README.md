# Bank Account Service - Full Stack Application

A complete bank account management system built with React.js, Node.js, Express, and PostgreSQL (Supabase).

## ✅ Current Status: **WORKING**

- ✅ Server running on `http://localhost:5000`
- ✅ Client running on `http://localhost:3000`
- ✅ Database connected to Supabase
- ✅ API endpoints working
- ✅ Sample data loaded

## 🏗️ Architecture

**Frontend**: React.js with React Router
**Backend**: Node.js with Express.js
**Database**: PostgreSQL (Supabase cloud)
**Structure**: Monorepo with npm workspaces

## 📁 Project Structure

```
account-service/
├── package.json                 # Root package with workspaces
├── .env                        # Environment variables
├── start-dev.sh               # Quick start script
├── apps/
│   ├── client/                # React frontend
│   │   ├── src/
│   │   │   ├── components/    # Reusable React components
│   │   │   ├── pages/        # Page components
│   │   │   └── services/     # API service layer
│   │   └── package.json
│   └── server/               # Node.js backend
│       ├── src/
│       │   ├── controllers/  # Route controllers
│       │   ├── models/      # Database models
│       │   └── routes/      # API routes
│       └── package.json
└── database/                # Database schema
```

## 🚀 Quick Start

### Option 1: Use the startup script
```bash
./start-dev.sh
```

### Option 2: Manual start
```bash
# Start both servers
npm run dev

# Or start individually:
npm run dev:server  # Server on port 5000
npm run dev:client  # Client on port 3000
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 📊 Database

**Provider**: Supabase (Free tier)
**Connection**: Session Pooler (IPv4 compatible)

### Sample Data
- **2 Customers**: John Doe, Jane Smith
- **3 Accounts**: 2 for John (checking + savings), 1 for Jane (checking)

## 🔌 API Endpoints

### Accounts
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/:id` - Get account by ID
- `GET /api/accounts/customer/:customerId` - Get accounts by customer
- `POST /api/accounts` - Create new account
- `PATCH /api/accounts/:id/balance` - Update balance
- `PATCH /api/accounts/:id/status` - Update status

### Customers  
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer

### Health
- `GET /health` - Server health check

## 🧪 Testing

```bash
# Test database connection
node test-supabase-connection.js

# Test API connectivity
node test-api-connectivity.js

# Test individual endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/accounts
curl http://localhost:5000/api/customers
```

## 🎯 Features

### ✅ Implemented
- Account management (CRUD operations)
- Customer management
- Account types: checking, savings, credit
- Balance tracking with currency support
- Account status management (active/inactive/frozen)
- React frontend with routing
- Responsive design
- Error handling
- Environment configuration

### 🚧 Future Enhancements
- Authentication & authorization
- Transaction history
- Account transfers
- Interest calculations
- Reporting & analytics
- Mobile app
- Docker deployment

## 🛠️ Development

### Install Dependencies
```bash
npm install                    # Root dependencies
cd apps/server && npm install # Server dependencies  
cd apps/client && npm install # Client dependencies
```

### Environment Variables
Configure `.env` file:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://your-connection-string
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-secret-key
```

### Database Schema
```sql
-- Located in database/schema.sql
-- Tables: customers, accounts
-- Indexes: email, customer_id, account_number
```

## 🌩️ Deployment

**Recommended**: Heroku (configured)
**Database**: Supabase (production-ready)

```bash
# Heroku deployment
heroku create your-app-name
heroku addons:create heroku-postgresql:mini
git push heroku main
```

## 📋 Development Notes

### Port Configuration
- Server: 5000 (configurable via PORT env var)
- Client: 3000 (React default)

### Database Connection
- Using Supabase Session Pooler for IPv4 compatibility
- SSL enabled for secure connections
- Connection pooling implemented

### Monorepo Benefits
- Shared dependencies
- Consistent tooling
- Easy development workflow
- Single repository for full stack

## 🏆 Success Criteria Met

✅ React.js frontend working
✅ Node.js/Express backend working  
✅ PostgreSQL database connected
✅ API endpoints functional
✅ Sample data available
✅ Monorepo structure
✅ Cloud database (Supabase)
✅ Professional architecture

## 📞 Support

If you encounter any issues:

1. Check both servers are running
2. Verify database connection with test scripts
3. Check browser console for frontend errors
4. Check terminal for backend errors
5. Ensure .env file is properly configured

---

**Your Account Service application is now ready for development and testing!** 🎉
