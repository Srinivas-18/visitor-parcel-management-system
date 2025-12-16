# Visitor & Parcel Management System

> ⚠️ **Status: Under Development / Testing**
> 
> This project is currently under active development and testing. Features may be incomplete or subject to change.

A comprehensive, production-ready management system for gated communities built with **Angular 16**, **Node.js + Express + TypeScript**, and **MySQL**.

![Status](https://img.shields.io/badge/Status-Under%20Development-yellow.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Angular](https://img.shields.io/badge/Angular-16.2.0-red.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Design](#-database-design)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [User Roles](#-user-roles)
- [Status Flow](#-status-flow)
- [Screenshots](#-screenshots)
- [Project Structure](#-project-structure)

## ✨ Features

### Core Functionality
- **Visitor Management**: Log, track, and manage visitor entries with approval workflow
- **Parcel Management**: Track parcels from receipt to collection
- **Real-time Notifications**: Socket.IO powered instant updates
- **Role-based Access Control**: Admin, Security Guard, and Resident roles
- **Dashboard Analytics**: Statistics and recent activity tracking

### Technical Highlights
- Clean architecture with separation of concerns
- Type-safe codebase with TypeScript
- Input validation and error handling
- Responsive Material Design UI
- Status transition validation
- Lazy-loaded Angular modules

## 🛠 Tech Stack

### Frontend
- **Angular 16** - Modern web framework
- **Angular Material** - UI component library
- **RxJS** - Reactive programming
- **Socket.IO Client** - Real-time communication
- **SCSS** - Styling with variables and mixins

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MySQL2** - Database driver with pooling
- **Socket.IO** - WebSocket server
- **bcrypt** - Password hashing
- **express-validator** - Input validation

### Database
- **MySQL 8.0** - Relational database

## 🏗 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Angular SPA    │────▶│  Express API    │────▶│    MySQL DB     │
│  (Frontend)     │     │  (Backend)      │     │                 │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        └───────────────────────┘
              Socket.IO
           (Real-time Events)
```

## 💾 Database Design

The system uses a **minimal 2-table design** for simplicity and flexibility:

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'SECURITY', 'RESIDENT') NOT NULL,
    contact_info VARCHAR(20),
    flat_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Records Table
```sql
CREATE TABLE records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resident_id INT NOT NULL,
    security_guard_id INT,
    type ENUM('VISITOR', 'PARCEL') NOT NULL,
    name VARCHAR(100) NOT NULL,
    purpose_or_description TEXT,
    media_url VARCHAR(500),
    vehicle_details VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES users(id),
    FOREIGN KEY (security_guard_id) REFERENCES users(id)
);
```

## 🚀 Installation

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/visitor-parcel-management.git
cd visitor-parcel-management
```

### 2. Database Setup
```bash
# Login to MySQL
mysql -u root -p

# Run the schema file
source database/schema.sql
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start development server
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
ng serve
```

## 🏃 Running the Application

### Development Mode

**Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

**Frontend:**
```bash
cd frontend
ng serve
# App runs on http://localhost:4200
```

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
ng build --configuration production
# Deploy dist/ folder to your web server
```

## 📚 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/residents` | Get all residents (for Security) |

### Visitors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/visitors` | Get all visitors (Security) |
| GET | `/api/visitors/pending` | Get pending approvals (Resident) |
| POST | `/api/visitors` | Create visitor entry |
| PUT | `/api/visitors/:id/status` | Update visitor status |

### Parcels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parcels` | Get all parcels (Security) |
| GET | `/api/parcels/resident` | Get resident's parcels |
| POST | `/api/parcels` | Create parcel entry |
| PUT | `/api/parcels/:id/status` | Update parcel status |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |

## 👥 User Roles

### Admin
- View dashboard with statistics
- Access all visitor and parcel logs
- System overview and monitoring

### Security Guard
- Log new visitors and parcels
- Update visitor status (Entry/Exit)
- Mark parcels as collected
- View all records

### Resident
- Approve/Reject visitor requests
- Acknowledge and collect parcels
- View personal visitor history

## 🔄 Status Flow

### Visitor Status Flow
```
NEW → WAITING → APPROVED/REJECTED
                    ↓
               ENTERED → EXITED
```

### Parcel Status Flow
```
RECEIVED → ACKNOWLEDGED → COLLECTED
```

## 📸 Screenshots

### Login Page
Clean, professional login interface with role-based redirection.

### Admin Dashboard
Statistics overview with visitor/parcel counts and recent activity.

### Security - Visitor Log
Table view with search, pagination, and quick status actions.

### Resident - Approvals
Card-based pending approvals with approve/reject actions.

## 📁 Project Structure

```
visitor-parcel-management/
├── database/
│   └── schema.sql              # Database schema with seed data
│
├── backend/
│   ├── src/
│   │   ├── config/             # Database & app configuration
│   │   ├── types/              # TypeScript interfaces
│   │   ├── utils/              # Helper functions
│   │   ├── middlewares/        # Auth, error, validation
│   │   ├── models/             # Database models
│   │   ├── services/           # Business logic
│   │   ├── controllers/        # Route handlers
│   │   ├── routes/             # API routes
│   │   ├── socket/             # Socket.IO setup
│   │   └── app.ts              # Express application
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Services, guards, models
│   │   │   ├── shared/         # Shared components & modules
│   │   │   ├── auth/           # Login module
│   │   │   ├── admin/          # Admin dashboard
│   │   │   ├── visitor/        # Visitor management
│   │   │   ├── parcel/         # Parcel management
│   │   │   └── app.module.ts   # Root module
│   │   ├── environments/       # Environment configs
│   │   └── styles.scss         # Global styles
│   ├── angular.json
│   └── package.json
│
└── README.md
```

## 🔐 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vpm.com | admin123 |
| Security | guard1@vpm.com | guard123 |
| Resident | resident1@vpm.com | resident123 |

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

⭐ Star this repository if you found it helpful!
