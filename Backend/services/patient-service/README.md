# PATIENT SERVICE – `README.md`

```md
# Patient Service

Handles patient profiles and medical report management.

---

## Responsibilities

- Manage patient profile
- Upload and store medical reports
- Allow doctors to access reports via NIC

---

## Features

- Report upload (Cloudinary)
- Report retrieval
- Secure doctor access

---

## API Endpoints

| Method | Endpoint | Description |
|--------|---------|------------|
| GET | /api/patient/me | Get profile |
| POST | /api/reports | Upload report |
| GET | /api/reports/doctor/patient/nic/:nic | Doctor view reports |

---

## Environment Variables

```env
PORT=5002
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret
SERVICE_SECRET=internal_secret

NOTIFICATION_SERVICE_URL=http://localhost:5007
AUTH_SERVICE_URL=http://localhost:5001

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Run Service

```bash
npm install
npm start