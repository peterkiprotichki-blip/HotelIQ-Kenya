# SmartSeason - Field Monitoring System

A comprehensive web application for tracking crop progress across multiple fields during a growing season. Built with NestJS, MongoDB, and Angular.

## Overview

SmartSeason is designed to help agricultural coordinators and field agents monitor and manage crop fields in real-time. The system supports two main user roles:

- **Admin/Coordinator**: Oversees all fields, creates new fields, assigns agents, and monitors progress
- **Field Agent**: Updates field information, logs observations, and monitors assigned fields

## Features

### 1. **User Management & Authentication**
- Role-based access control (Admin, Coordinator, Agent)
- JWT-based authentication
- Secure password hashing with bcrypt
- User profile management

### 2. **Field Management**
- Create and manage fields with detailed information
- Track crop type, planting date, and current stage
- Assign fields to specific agents
- Support for field notes and observations

### 3. **Field Lifecycle Tracking**
- **Stages**: Planted → Growing → Ready → Harvested
- **Status**: Active, At Risk, Completed
- Automatic status computation based on field data
- Time-based risk assessment (no updates in 7+ days, approaching harvest)

### 4. **Field Updates & Monitoring**
- Agents can log field observations and stage updates
- Record weather conditions and identified issues
- Attach photos and detailed notes
- Admins can view all updates across all agents

### 5. **Dashboards**
- **Admin Dashboard**: Overview of all fields with status breakdown
- **Agent Dashboard**: View assigned fields and recent updates
- Statistics: Total fields, status distribution, stage breakdown

## Tech Stack

### Backend
- **Framework**: NestJS 10
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Server**: Express.js

### Frontend
- **Framework**: Angular 17
- **HTTP Client**: HttpClient with RxJS
- **Routing**: Angular Router
- **Styling**: TailwindCSS (optional)
- **Charts**: Chart.js for statistics

### Database
- **Primary**: MongoDB
- **Collections**: Users, Fields, FieldUpdates

## Project Structure

```
SmartSeason/
├── smartseason-backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Authentication & User management
│   │   │   ├── fields/         # Field management & updates
│   │   │   └── database/       # Database configuration
│   │   ├── app.module.ts       # Main application module
│   │   └── main.ts             # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── smartseason-frontend/
    ├── src/
    │   ├── app/
    │   │   ├── shared/
    │   │   │   └── services/   # Shared services (Auth, Field)
    │   │   ├── modules/        # Feature modules
    │   │   └── app.module.ts
    │   └── main.ts
    ├── package.json
    └── angular.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB 5.0+ (local or remote)
- Angular CLI (optional, but recommended)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd smartseason-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string and JWT secret
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The backend API will be available at `http://localhost:3000`
Swagger documentation available at `http://localhost:3000/api/docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd smartseason-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:4400`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/users` - List all users (Admin/Coordinator only)
- `GET /api/auth/agents` - List all field agents
- `POST /api/auth/users` - Create new user (Admin/Coordinator only)
- `DELETE /api/auth/users/:id` - Delete user (Admin only)

### Fields
- `GET /api/fields` - Get fields (All for Admin/Coordinator, Assigned for Agent)
- `POST /api/fields` - Create field (Admin/Coordinator only)
- `GET /api/fields/:id` - Get field details
- `PUT /api/fields/:id` - Update field (Admin/Coordinator only)
- `DELETE /api/fields/:id` - Delete field (Admin/Coordinator only)
- `GET /api/fields/stats` - Get field statistics

### Field Updates
- `POST /api/fields/:id/updates` - Add field update (Agent only)
- `GET /api/fields/:id/updates` - Get field updates
- `GET /api/fields/updates/all` - Get all updates (Admin/Coordinator only)

## Demo Credentials

### Admin Account
- **Email**: admin@smartseason.com
- **Password**: Admin@123
- **Role**: Admin

### Coordinator Account
- **Email**: coordinator@smartseason.com
- **Password**: Coordinator@123
- **Role**: Coordinator

### Field Agent Accounts
- **Email**: agent1@smartseason.com / agent2@smartseason.com
- **Password**: Agent@123
- **Role**: Agent

## Field Status Logic

The system automatically computes field status based on:

### **ACTIVE**
- Field is in "Planted" or "Growing" stage
- Last update is within the last 7 days (for Growing fields)
- Expected harvest is more than 7 days away

### **AT_RISK**
- Field is in "Growing" stage with no updates for 7+ days
- Expected harvest date is within 7 days
- OR expected harvest date has passed

### **COMPLETED**
- Field is in "Harvested" stage
- Expected harvest date has passed

## Design Decisions

1. **MongoDB over SQL**: Flexible schema allows easy addition of custom field properties
2. **NestJS**: Provides built-in structure for scalability and maintainability
3. **JWT Authentication**: Stateless, scalable authentication mechanism
4. **Role-Based Access Control**: Simple yet effective permission system
5. **Computed Status**: Status is computed on-the-fly for real-time accuracy
6. **Agent Assignment**: Each field is assigned to one specific agent for clear responsibility

## Assumptions Made

1. **Single Agent Per Field**: Each field is assigned to exactly one agent
2. **Simple Stage Lifecycle**: Four predefined stages (Planted, Growing, Ready, Harvested)
3. **No Multi-Tenancy**: Single organization usage (easily extendable)
4. **No Notifications**: Basic monitoring without real-time alerts (can be added)
5. **Basic Photo Storage**: Photo URLs stored as strings (can integrate with cloud storage)
6. **Local MongoDB**: Development uses local MongoDB (production uses cloud service)

## Running Tests

```bash
# Backend tests
cd smartseason-backend
npm run test

# Frontend tests
cd smartseason-frontend
npm test
```

## Production Deployment

### Backend (Vercel/Heroku)
1. Set environment variables on the hosting platform
2. Run `npm run build`
3. Deploy the `dist` folder

### Frontend (Vercel/Netlify)
1. Run `npm run build`
2. Deploy the `dist` folder

## Future Enhancements

- [ ] Real-time notifications for field changes
- [ ] Photo upload with cloud storage (AWS S3, Cloudinary)
- [ ] Weather API integration
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Crop yield prediction using ML
- [ ] Multi-language support
- [ ] Export to PDF/Excel reports

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for commercial and personal purposes.

## Support

For issues, questions, or feature requests, please open an issue on GitHub or contact the development team.

---

**Developed with ❤️ for agricultural field monitoring**
