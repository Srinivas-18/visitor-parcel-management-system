# 📄 Resume Project Description

## Project Title
**Visitor & Parcel Management System**

---

## Short Description

> Developed a full-stack **Visitor & Parcel Management System** for gated communities, enabling security guards to log visitors and parcels, residents to approve/reject entries, and admins to monitor activity through a real-time dashboard. The system features role-based access control, JWT authentication with refresh token rotation, Two-Factor Authentication (2FA), and instant Socket.IO notifications.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | Angular 16, Angular Material, RxJS, SCSS        |
| Backend   | Node.js, Express.js, TypeScript                 |
| Database  | MySQL 8.0                                       |
| Real-time | Socket.IO (WebSockets)                          |
| Auth      | JWT (Access + Refresh Tokens), bcrypt, speakeasy (TOTP 2FA) |
| Tooling   | Angular CLI, ts-node-dev, dotenv                |

---

## Modules / Libraries Used

### Backend
| Module               | Purpose                                      |
|----------------------|----------------------------------------------|
| `express`            | REST API web framework                       |
| `typescript`         | Static type safety across the codebase       |
| `mysql2`             | MySQL database driver with connection pooling|
| `jsonwebtoken`       | JWT-based authentication (access tokens)     |
| `bcrypt`             | Secure password hashing                      |
| `speakeasy`          | TOTP-based Two-Factor Authentication (2FA)   |
| `qrcode`             | QR code generation for 2FA setup             |
| `socket.io`          | Real-time bidirectional event communication  |
| `express-rate-limit` | Brute-force protection / rate limiting       |
| `express-validator`  | Server-side input validation                 |
| `nodemailer`         | Email notifications                          |
| `dotenv`             | Environment variable management              |
| `cors`               | Cross-Origin Resource Sharing middleware     |
| `uuid`               | Unique ID generation                         |

### Frontend
| Module                  | Purpose                                   |
|-------------------------|-------------------------------------------|
| `@angular/core`         | Angular component framework               |
| `@angular/material`     | Pre-built Material Design UI components   |
| `@angular/router`       | Client-side routing with lazy loading     |
| `@angular/forms`        | Reactive forms and form validation        |
| `rxjs`                  | Reactive programming with Observables     |
| `socket.io-client`      | Real-time updates from the server         |

---

## Key Methods & Architectural Patterns

- **MVC / Layered Architecture** – Separate layers for routes, controllers, services, and models
- **Role-Based Access Control (RBAC)** – Middleware guards enforce Admin / Security / Resident permissions on every API route
- **JWT Token Rotation** – 15-minute access tokens paired with 7-day refresh tokens; refresh tokens are stored in the database and can be revoked
- **TOTP Two-Factor Authentication** – Authenticator-app-compatible 2FA using the TOTP standard (RFC 6238) with QR code enrollment
- **Account Lockout** – Automatic account lockout after repeated failed login attempts
- **Audit Logging** – Every security-sensitive action (login, password change, 2FA toggle) is recorded with user, IP, and outcome
- **Real-time Notifications** – Socket.IO events pushed to connected clients on visitor/parcel status changes
- **Reactive UI** – Angular Observables and RxJS operators manage async data streams and live updates
- **Lazy-Loaded Angular Modules** – Feature modules (admin, visitor, parcel, auth) are loaded on demand for faster initial load
- **Input Validation** – `express-validator` on the backend and Angular Reactive Forms on the frontend provide dual-layer validation
- **Password Strength Enforcement** – Custom password-strength component with complexity requirements (length, uppercase, number, special character)

---

## Features

### Core Functionality
- **Visitor Management** – Log visitor arrivals, track status (NEW → WAITING → APPROVED/REJECTED → ENTERED → EXITED), photo support
- **Parcel Management** – Track parcels from receipt to collection (RECEIVED → ACKNOWLEDGED → COLLECTED)
- **Resident Approval Workflow** – Residents receive real-time notifications and can approve or reject visitors
- **Admin Dashboard** – Statistics overview (total visitors, parcels, active guards, pending approvals) with recent activity feed
- **User Management** – Admin can create, activate/deactivate, and reset passwords for all users

### Security Features
- **Two-Factor Authentication (2FA)** – TOTP-based with QR code setup via any authenticator app
- **JWT with Refresh Token Rotation** – Secure, stateless authentication with token revocation support
- **Rate Limiting** – Protects login and password-reset endpoints from brute-force attacks
- **Account Lockout** – Blocks accounts after multiple failed login attempts
- **Security PIN** – 6-digit PIN used for self-service password recovery
- **Audit Logging** – Full trace of all authentication and role-sensitive operations
- **Strong Password Policy** – Minimum 8 characters with complexity rules enforced on both client and server

### Technical Highlights
- Fully type-safe codebase (TypeScript on both frontend and backend)
- Responsive Angular Material UI (works on desktop and tablet)
- Clean separation of concerns across all layers
- Environment-based configuration (`.env`) for easy deployment

---

## Project Summary (Copy-Paste for Resume)

**Visitor & Parcel Management System** | *Angular 16 · Node.js · Express · TypeScript · MySQL · Socket.IO*

- Built a full-stack web application for managing visitor access and parcel tracking in gated communities, supporting three user roles: Admin, Security Guard, and Resident.
- Implemented **JWT authentication** with refresh token rotation, **TOTP-based 2FA**, account lockout, rate limiting, and comprehensive audit logging to meet production security standards.
- Developed **real-time notifications** using Socket.IO so residents instantly receive visitor approval requests and parcel alerts without page refresh.
- Designed a normalized **MySQL database** (6 tables) with foreign-key relationships, status-transition validation, and JSON audit fields.
- Built a responsive **Angular 16 SPA** with lazy-loaded feature modules, Angular Material components, reactive forms, and RxJS-based state management.
- Architected RESTful APIs using Express.js with layered MVC structure, input validation via `express-validator`, and role-based middleware guards.
