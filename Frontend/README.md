# MediChannel Frontend

The MediChannel Frontend is a modern React-based web application that provides an intuitive user interface for patients and doctors to interact with the healthcare appointment system.

It connects with multiple backend microservices to enable **doctor discovery, location-based appointment booking, and dashboard management**.

---

## Overview

This frontend enables:

- Patients to search and book appointments with doctors
- Doctors to manage their profiles, locations, and availability
- Viewing real-time slot availability based on selected hospital/clinic

---

## Key Features

### Doctor Discovery
- Search doctors by:
  - Name
  - Specialization
  - Hospital/Clinic
- Filter by availability and consultation fee

---

### Location-Based Booking
- Select:
  - Doctor
  - Hospital/Clinic
  - Date
- View available time slots dynamically
- Supports:
  - In-person consultations
  - Video consultations

---

### Slot-Based Appointment Booking
- Real-time slot rendering
- Prevents double booking
- Shows consultation fee per slot

---

### Doctor Dashboard
- Manage profile
- Add multiple practice locations
- Configure availability per location
- View patient reports
- Navigate to appointment management

---

### Patient Features
- Upload medical reports
- View appointment status
- Access prescriptions

---

## Tech Stack

- **React (Vite)** – Fast frontend framework
- **Axios** – API communication
- **React Router** – Routing
- **Context API** – State management
- **Custom CSS / Tailwind (optional)** – UI styling

---

## Project Structure

```

src/
├── components/        # Reusable UI components
├── pages/             # Main pages (Doctor, Patient, etc.)
├── modules/           # Feature-based modules
├── api/               # Axios configurations
├── context/           # Global state (Auth)
├── assets/            # Images and static files
├── routes/            # Route definitions
└── App.jsx            # Main app entry

````

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
````

### 2. Run Development Server

```bash
npm run dev
```

### 3. Build for Production

```bash
npm run build
```

---

## Environment Configuration

Create a `.env` file in the frontend root:

```env
VITE_AUTH_API=http://localhost:5001/api
VITE_PATIENT_API=http://localhost:5002/api
VITE_DOCTOR_API=http://localhost:5000/api
VITE_APPOINTMENT_API=http://localhost:5003/api
VITE_TELEMEDICINE_API=http://localhost:5004/api
VITE_PAYMENT_API=http://localhost:5005/api
VITE_PRESCRIPTION_API=http://localhost:5006/api
```

---

## Application Flow

### Doctor Flow

1. Login as doctor
2. Add practice locations
3. Configure availability per location
4. Manage appointments

---

### Patient Flow

1. Search doctor
2. Select hospital/clinic
3. Choose date
4. Select available slot
5. Book appointment

---

## Key Concepts Implemented

* Location-based scheduling system
* Dynamic slot rendering from backend availability
* Role-based UI rendering (Doctor / Patient)
* Error handling and validation
* Secure API communication with JWT

---

## Authentication Handling

* JWT token stored in localStorage
* Automatically attached to API requests via Axios interceptors

---

## UI Highlights

* Clean dashboard design
* Responsive layout
* Slot selection grid
* Location-based availability view
* Inline error handling

---

## Important Notes

* Backend services must be running before frontend
* Ensure correct API base URL
* Requires valid JWT for protected routes

---

---

## License

This project is developed for educational purposes and academic submission.

```
