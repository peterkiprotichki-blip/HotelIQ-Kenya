# SmartSeason Setup Guide

Complete step-by-step guide to set up and run the SmartSeason field monitoring system.

## Prerequisites

Before starting, ensure you have installed:
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 9+** or **yarn** - Usually comes with Node.js
- **MongoDB 5.0+** - [Download Community Edition](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** (optional) - For cloning/version control

### Verify Installation

```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
mongod --version  # Should be 5.0 or higher (if local MongoDB)
```

## Part 1: MongoDB Setup

### Option A: Local MongoDB

#### Windows
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the installation wizard
3. MongoDB will install as a Windows Service (should auto-start)
4. To verify: Open Command Prompt and run `mongosh` or `mongo`

#### macOS (with Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

### Option B: MongoDB Atlas (Cloud - Recommended for Production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (select M0 Tier for free)
4. Create a database user with username and password
5. Get your connection string from "Connect" button
6. Copy the connection string to your `.env` file

### Verify MongoDB Connection

```bash
# Connect to local MongoDB
mongosh
# Or for older versions
mongo

# You should see a connection prompt
test>
```

## Part 2: Backend Setup

### 1. Navigate to Backend Directory

```bash
cd smartseason-backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all packages from `package.json`:
- NestJS and related packages
- MongoDB/Mongoose
- JWT and Passport for authentication
- Swagger for API documentation

### 3. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your configuration
# On Windows, use Notepad:
notepad .env
# On macOS/Linux:
nano .env
```

#### Edit `.env` with these values:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smartseason
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=24h
FRONTEND_URL=http://localhost:4400
```

**Important**: For production, use a strong JWT_SECRET and change `NODE_ENV=production`

### 4. Start Backend Server

```bash
npm run dev
```

Expected output:
```
[Nest] 12345   - 04/19/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345   - 04/19/2026, 10:30:00 AM     LOG [InstanceLoader] DatabaseModule dependencies initialized +10ms
[Nest] 12345   - 04/19/2026, 10:30:01 AM     LOG [InstanceLoader] AuthModule dependencies initialized +50ms
[Nest] 12345   - 04/19/2026, 10:30:01 AM     LOG [InstanceLoader] FieldsModule dependencies initialized +30ms
SmartSeason API running on http://localhost:3000
Swagger docs available at http://localhost:3000/api/docs
```

### 5. Test the API

Open your browser and visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/auth/users (should prompt for auth)

The backend is now running! Keep the terminal open.

## Part 3: Frontend Setup

### 1. Open a New Terminal/Command Prompt

Keep the backend running in its terminal, open a new terminal window.

### 2. Navigate to Frontend Directory

```bash
cd smartseason-frontend
```

### 3. Install Dependencies

```bash
npm install
```

This will install all Angular packages and dependencies.

### 4. Start Frontend Server

```bash
npm start
```

Expected output:
```
✔ Browser application bundle generated successfully.
✔ Lazy loaded routes compiled successfully.

Application bundle generation complete. [3.456 seconds]

Watch mode enabled. Watching for file changes...
Angular Live Development Server is listening on localhost:4400, open your browser on http://localhost:4400/
```

The application will automatically open in your default browser at `http://localhost:4400`.

## Part 4: Create Initial Data (Demo Setup)

### Using MongoDB Compass (GUI - Easier)

1. Download [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Install and open it
3. Connect to `mongodb://localhost:27017`
4. Create a new database: `smartseason`
5. Create three collections: `users`, `fields`, `fieldupdates`

### Using MongoDB Shell

```bash
mongosh
# Or for older versions:
mongo

# In the shell:
use smartseason

# Create collections
db.createCollection("users")
db.createCollection("fields")
db.createCollection("fieldupdates")

# Verify
show collections
```

## Part 5: Test the Application

### 1. Access the Frontend

Open your browser and go to: **http://localhost:4400**

### 2. Test Authentication

The system includes pre-configured demo accounts. To create one, use the registration page or API:

```bash
# POST request to register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@test.com",
    "password": "Admin@123",
    "role": "admin"
  }'
```

### 3. Test with Admin Account

Register or use these demo credentials:
- **Email**: admin@smartseason.com
- **Password**: Admin@123
- **Role**: Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@smartseason.com",
    "password": "Admin@123"
  }'
```

### 4. Create a Test Field

```bash
# Get token from login response first, then:
curl -X POST http://localhost:3000/api/fields \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wheat Field A",
    "cropType": "Wheat",
    "plantingDate": "2026-03-01",
    "assignedAgentId": "AGENT_ID",
    "location": "Region 1"
  }'
```

## Part 6: Verify Everything is Working

### Checklist

- [ ] Backend API running at `http://localhost:3000`
- [ ] Frontend app running at `http://localhost:4400`
- [ ] Can access Swagger docs at `http://localhost:3000/api/docs`
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] JWT token is received and stored
- [ ] Can create a field (as Admin)
- [ ] Can view fields (based on role)

## Troubleshooting

### MongoDB Connection Error

**Error**: `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
1. Check if MongoDB is running:
   ```bash
   # Windows
   Get-Service MongoDB
   
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mongod
   ```
2. If not running, start it:
   ```bash
   # Windows (if not auto-starting)
   mongod
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
1. Change the port in `.env`:
   ```env
   PORT=3001
   ```
2. Or kill the process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   ```

### Dependencies Installation Error

**Error**: `npm ERR! ...`

**Solution**:
1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Frontend Not Connecting to Backend

**Error**: `Cannot GET /api/auth/login` or CORS error

**Solution**:
1. Verify backend is running on port 3000
2. Check API URL in frontend services (should be `http://localhost:3000`)
3. Check CORS configuration in backend `.env`:
   ```env
   FRONTEND_URL=http://localhost:4400
   ```

### Angular Build Issues

**Error**: TypeScript compilation errors

**Solution**:
```bash
cd smartseason-frontend
npm install
npm start
```

## Development Mode

Once everything is running:

1. **Backend**: Changes to TypeScript files automatically reload (watch mode)
2. **Frontend**: Changes to components automatically reload (hot module replacement)
3. **Browser DevTools**: Inspect Network tab to see API calls

## Next Steps

1. **Explore Swagger Docs**: http://localhost:3000/api/docs
2. **Create Multiple Users**: Admin, Coordinator, and Agent accounts
3. **Create Fields**: Add test fields and assign to agents
4. **Test Workflows**: Field creation, updating, status tracking
5. **Build Custom Components**: Add UI for dashboards and field management

## Production Deployment

See the main [README.md](README.md) for production deployment instructions.

---

**Having issues?** Check the backend and frontend READMEs in their respective directories for more detailed troubleshooting.
