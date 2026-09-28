# 🏥 MediChannel – AI-Enabled Smart Healthcare Platform

MediChannel is a **cloud-native healthcare platform** designed to simplify doctor appointments, telemedicine, and patient management.  
It integrates **AI-powered symptom checking**, secure authentication, and real-time communication using a **microservices architecture**.

---

## 🚀 Project Overview

This system allows:

- Patients to **find doctors, book appointments, and manage medical records**
- Doctors to **manage availability, appointments, and patient reports**
- Admins to **verify doctors and monitor the system**
- Users to get **AI-based symptom suggestions**

The platform is built using modern technologies and follows **real-world scalable architecture practices**.

---

## 🧩 System Architecture

- **Frontend**: React (Vite)
- **Backend**: Node.js + Express (Microservices)
- **Database**: MongoDB Atlas (Cloud)
- **Containerization**: Docker
- **Orchestration**: Kubernetes (Docker Desktop)
- **API Communication**: REST APIs

### Microservices

- Auth Service (JWT Authentication)
- Patient Service
- Doctor Service
- Appointment Service
- Telemedicine Service
- Payment Service (Stripe)
- Prescription Service
- Notification Service (Email + SMS)
- AI Service (Gemini API)

---

## ✨ Key Features

### 🔐 Authentication & Security
- JWT-based login system
- Role-based access (Patient / Doctor / Admin)

### 👨‍⚕️ Patient Features
- Register and manage profile
- Book and track appointments
- Upload medical reports
- View prescriptions
- AI symptom checker

### 🩺 Doctor Features
- Manage availability schedules
- Accept/reject appointments
- View patient records
- Upload prescriptions

### 🛠 Admin Features
- Verify doctor registrations
- Manage users
- Monitor appointments and payments

### 💬 Communication
- Email notifications (SMTP)
- SMS notifications (TextLK)

### 💳 Payments
- Integrated with Stripe (test mode)

---

## 🐳 Docker Setup (Local Development)

Run the entire system using Docker:

```bash
docker compose up --build
````

Frontend:

```
http://localhost:5173
```

---

## ☸️ Kubernetes Deployment

### 1. Enable Kubernetes

Enable Kubernetes in Docker Desktop.

### 2. Setup Secret File (IMPORTANT)

Copy the example file:

```
k8s/config/backend-secret.example.yaml → k8s/config/backend-secret.yaml
```

Replace all `REPLACE_ME` values with your actual credentials:

* MongoDB URIs
* JWT secret
* API keys (Stripe, Cloudinary, Gemini)
* Email credentials
* SMS API token

⚠️ **Do NOT commit `backend-secret.yaml` to GitHub**

---

### 3. Apply Configurations

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/config/
kubectl apply -f k8s/auth-service/
kubectl apply -f k8s/patient-service/
kubectl apply -f k8s/doctor-service/
kubectl apply -f k8s/appointment-service/
kubectl apply -f k8s/telemedicine-service/
kubectl apply -f k8s/payment-service/
kubectl apply -f k8s/prescription-service/
kubectl apply -f k8s/notification-service/
kubectl apply -f k8s/ai-service/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress/
```

---

### 4. Install Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

---

### 5. Verify Deployment

```bash
kubectl get pods -n medichannel
kubectl get svc -n medichannel
kubectl get ingress -n medichannel
```

(All pods should be in **Running** state)

---

## 🌐 Access Application

* NodePort:

```
http://localhost:30080
```

* Ingress (recommended):

```
http://localhost
```

---

## 🔄 Restart Deployment

```bash
kubectl rollout restart deployment --all -n medichannel
```

---

## 📌 Notes

* MongoDB Atlas is used instead of local MongoDB
* Each microservice uses a separate database
* Docker is used for containerization
* Kubernetes is used for orchestration and scaling
* Ingress allows access using `localhost` without ports
* Sensitive data is managed using Kubernetes Secrets

---

## 📄 License

This project is developed for academic purposes.

```
