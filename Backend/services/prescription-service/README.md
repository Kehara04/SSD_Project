# PRESCRIPTION SERVICE – `README.md`

```md
# Prescription Service

Manages prescriptions issued by doctors.

---

## Responsibilities

- Create prescriptions
- Store patient medication history

---

## Features

- Prescription creation
- Appointment linkage

---

## Environment Variables

```env
PORT=5006
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret
SERVICE_SECRET=internal_secret

APPOINTMENT_SERVICE_URL=http://localhost:5003
```

## Run Service

```bash
npm install
npm start