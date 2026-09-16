
# DOCTOR SERVICE README

```md
# Doctor Service

The Doctor Service manages all doctor-related data including profiles, practice locations, and location-based availability.

---

## Responsibilities

- Manage doctor profiles
- Handle multiple hospital/clinic locations
- Define availability schedules per location
- Provide doctor data to other services

---

## Core Concept

A doctor can:

- Work in **multiple hospitals/clinics**
- Have **different schedules per location**

---

## Key Features

- Profile management
- Multi-location support
- Slot-based availability configuration
- Consultation type support (In-person / Video)

---

## API Endpoints

### Profile
| Method | Endpoint | Description |
|--------|--------|------------|
| GET | /api/doctors/me/profile | Get own profile |
| PUT | /api/doctors/me/profile | Update profile |

### Locations
| Method | Endpoint | Description |
|--------|--------|------------|
| GET | /api/doctors/me/locations | Get locations |
| POST | /api/doctors/me/locations | Add location |
| PATCH | /api/doctors/me/locations/:id | Update location |
| DELETE | /api/doctors/me/locations/:id | Delete location |

### Availability
| Method | Endpoint | Description |
|--------|--------|------------|
| PUT | /api/doctors/me/availability | Update availability |

---

## Data Model Highlights

- Doctor Profile
- Practice Locations
- Availability (linked to locationId)

---

## Environment Variables

```env
PORT=5000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret
SERVICE_SECRET=internal_secret
AUTH_SERVICE_URL=http://localhost:5001
```
---

## Run Service

```bash
npm install
npm start