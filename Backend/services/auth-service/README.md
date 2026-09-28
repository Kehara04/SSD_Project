# Auth Service

The Auth Service is responsible for handling authentication and authorization across the MediChannel platform.

---

## Responsibilities

- User registration (Patient / Doctor / Admin)
- User login & JWT token generation
- Token validation middleware
- Role-based access control

---

## Features

- Secure authentication using JWT
- Password hashing (bcrypt)
- Role-based authorization
- Internal service communication support

---

## Architecture Role

Acts as the **entry point for identity management**, used by all other services.

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|---------|------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login and get token |
| GET | /api/auth/me | Get logged-in user |

### Internal
| Method | Endpoint | Description |
|--------|---------|------------|
| GET | /api/internal/users/:id | Get user by ID |

---

## Environment Variables

```env
PORT=5001
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret
SERVICE_SECRET=internal_secret

NOTIFICATION_SERVICE_URL=http://localhost:5007
DOCTOR_SERVICE_URL=http://localhost:5000
```
---
## Run Service

```bash
npm install
npm start