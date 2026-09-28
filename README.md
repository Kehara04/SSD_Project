# MediChannel – Secure Software Development Project

**Module:** SE4030 – Secure Software Development  
**Project:** MediChannel Healthcare Management Platform  
**Repository:** Final Security-Enhanced Version

---

## 1. Project Overview

MediChannel is a healthcare management web application that supports patients, doctors, and administrators through a microservices-based architecture.

The platform includes functionality for:

- Patient registration and authentication
- Doctor management
- Appointment scheduling
- Medical report management
- Telemedicine consultations
- Prescription management
- Payment processing
- Notifications
- AI-assisted healthcare features

The application uses a **React frontend**, **Node.js and Express backend microservices**, **MongoDB**, **Docker**, and REST APIs.

For the SE4030 Secure Software Development assignment, our group evaluated the original MediChannel application, identified and remediated seven security vulnerabilities, performed security retesting and regression testing, and implemented a Google OpenID Connect authentication feature.

---

## 2. Assignment Objectives

The main objectives of this project were to:

- Identify at least seven distinct security vulnerabilities in the existing application.
- Reproduce and document the vulnerable behavior.
- Implement secure remediations.
- Retest the original attack scenarios after each fix.
- Perform regression testing to ensure legitimate application functionality remained operational.
- Implement an OAuth 2.0 or OpenID Connect based feature.
- Maintain a traceable Git history using separate security branches and pull requests.

---

## 3. Repository and Git Workflow

The project uses multiple Git branches to preserve the original vulnerable application and maintain traceability of individual security fixes.

### Main Branches

| Branch | Purpose |
|---|---|
| `baseline-original` | Preserved version of the original vulnerable MediChannel application |
| `dev` | Integration branch used to combine and test all security fixes |
| `main` | Final integrated and tested submission branch |

Separate feature and vulnerability branches were also used for individual contributions.

Examples include:

```text
fix/vuln-01-admin-secret-Semgrep-man
fix/vuln-02-telemedicine-auth
fix/vuln-03-medical-report-idor-final
fix/vuln-04-internal-api-auth
fix/vuln-05-stripe-webhook
fix/vuln-06-payment-fail-open
fix/vuln-07-secret-logging
feature/google-oidc-final
```

Changes were integrated into `dev` through pull requests before the final integrated version was merged into `main`.

---

## 4. Identified Vulnerabilities and Remediations

### VULN-01 – Hard-Coded Admin Secret / Insecure Admin Registration

**Issue**

The original administrative registration flow relied on an insecure hard-coded administrative secret. Knowledge of the static value could allow unauthorized privileged account creation.

**Remediation**

The insecure hard-coded secret logic was removed and the administrative registration mechanism was secured.

**Testing**

- Manual code review
- Semgrep custom SAST rule
- Regression testing

Evidence is available under:

```text
security-evidence/vuln-01-admin-secret-semgrep/
```

The after-fix Semgrep scan confirmed that the targeted hard-coded secret pattern was no longer detected.

---

### VULN-02 – Telemedicine Authentication and Authorization

**Issue**

Sensitive telemedicine endpoints were accessible without sufficient authentication and authorization checks.

The original routes allowed operations such as session creation, retrieval, joining, and ending without correctly enforcing user identity and access permissions.

**Remediation**

Authentication and authorization controls were added to the affected telemedicine routes.

The updated implementation verifies:

- The user is authenticated.
- The user has an appropriate role.
- The user is authorized to interact with the requested telemedicine session.

**Testing**

Postman testing verified that:

- Requests without authentication are rejected.
- Unauthorized users are rejected.
- Legitimate doctors and patients retain access to their permitted sessions.

Evidence is available under:

```text
security-evidence/vuln-02-telemedicine/
```

---

### VULN-03 – Medical Report IDOR / Broken Object-Level Authorization

**Issue**

The medical report functionality verified that a requester had the doctor role but did not verify whether that doctor was authorized to access the requested patient's reports.

An authenticated doctor could manipulate:

- Report IDs
- Patient IDs
- Patient NIC values

to retrieve medical reports belonging to unrelated patients.

**Affected endpoints included:**

```text
GET /api/reports/doctor/:id
GET /api/reports/doctor/:id/open
GET /api/reports/doctor/patient/:patientId
GET /api/reports/doctor/patient/nic/:nic
```

**Remediation**

Server-side object-level authorization was implemented.

The functions:

```text
doctorHasPatientAccess()
ensureDoctorPatientAccess()
```

verify the relationship between the authenticated doctor and the requested patient using appointment information from the appointment service.

Access is allowed only when the doctor has an **approved or completed appointment** with the patient.

The check was applied before:

- Retrieving a report by report ID
- Opening a report file
- Retrieving reports by patient ID
- Retrieving reports by patient NIC

Unauthorized access now returns:

```text
403 Forbidden
```

**Testing**

Bruno and Bruno CLI were used for authorization and regression testing.

The current regression collection contains seven tests covering:

- Authorized doctor access
- Unauthorized doctor access
- Unauthorized report opening
- NIC-based unauthorized access
- Authorized access for another doctor/patient pair
- Unauthenticated access
- Patient-ID based unauthorized access

Evidence is available under:

```text
security-evidence/vuln-03-medical-report-idor/
security-tests/bruno/MediChannel VULN-03 IDOR Tests/
```

---

### VULN-04 – Missing Internal API Authentication

**Issue**

Internal authentication-service endpoints intended for trusted backend services were accessible through the public API without the intended service authentication.

Before the fix, requests could retrieve or modify internal user information without the required service credential.

Examples included:

```text
GET /api/internal/users/:id
GET /api/internal/users/by-nic/:nic
PATCH /api/internal/users/:id/basic
GET /api/internal/doctors/approved
```

**Remediation**

The public and internal authentication applications were separated.

The internal API now:

- Uses a separate internal listener.
- Requires service authentication.
- Validates the `x-service-secret` credential.
- Rejects missing or incorrect credentials.
- Uses timing-safe comparison for the service credential.
- Rejects startup or requests when required service credentials are unavailable.
- Prevents internal routes from being exposed through the public API listener.

**Testing**

Postman and OWASP ZAP were used to verify:

- Missing service credentials are rejected.
- Invalid credentials are rejected.
- Valid internal service authentication succeeds.
- Internal endpoints are not accessible from the public API listener.

Evidence is available under:

```text
security-evidence/Internal-API/
security-evidence/ZAP-after-fix/
```

---

### VULN-05 – Stripe Webhook Signature Verification Bypass

**Issue**

The payment service contained fail-open Stripe webhook handling.

When webhook verification was unavailable or incorrectly configured, webhook payloads could still be processed instead of being rejected.

This could allow an attacker to submit forged payment events.

**Remediation**

Stripe webhook signature verification is now mandatory.

The updated implementation:

- Requires a configured Stripe webhook secret.
- Rejects missing signatures.
- Rejects invalid signatures.
- Uses Stripe's webhook verification mechanism before processing events.
- Does not fall back to trusting unverified JSON payloads.

**Testing**

The fix was verified using:

- Postman / API requests
- Stripe CLI
- Burp-based verification evidence
- Automated regression testing

Valid Stripe-signed webhook events remain functional while invalid or unsigned webhook requests are rejected.

Evidence is available under:

```text
security-evidence/vuln-05-stripe-webhook/
```

---

### VULN-06 – Payment Verification Fail-Open

**Issue**

The payment confirmation logic contained a fail-open behavior.

If Stripe payment verification failed, the application could fall back to treating the payment as successful.

This created a risk where a local payment record could be marked as paid even though Stripe had not verified the payment.

**Remediation**

The fail-open behavior was removed.

The updated payment confirmation logic:

- Depends on the actual Stripe payment status.
- Rejects verification failures.
- Does not create a mock successful Stripe response.
- Leaves the local payment unchanged when Stripe verification fails.
- Returns an error instead of marking an unverified payment as paid.

**Testing**

After the fix:

- Stripe verification failures are rejected.
- The local payment remains pending.
- Valid payment confirmation functionality remains operational.
- Automated regression testing was performed.

Evidence is available under:

```text
security-evidence/vuln-06-payment-fail-open/
```

---

### VULN-07 – Sensitive Service Secrets Written to Logs

**Issue**

Sensitive service authentication credentials could be written to application logs.

Logging authentication secrets can expose credentials to developers, administrators, log aggregation systems, or attackers who gain access to logs.

**Remediation**

Sensitive credential values were removed from logging statements.

The application now handles failed and successful service-authentication attempts without printing secret values.

**Testing**

Regression testing verified that:

- Incorrect service secrets are rejected.
- Missing service credentials are rejected.
- Valid service authentication still works.
- Sensitive secret values are no longer present in application logs.

Evidence is available under:

```text
security-evidence/vuln-07-secret-logging/
```

Regression tests are also available in:

```text
security-tests/vuln07-regression.js
```

---

## 5. Google OpenID Connect Implementation

In addition to remediating the seven vulnerabilities, the application was extended with **Google OpenID Connect authentication for patients**.

The existing username/email and password login remains available.

### Authentication Flow

Patients can select:

```text
Continue with Google
```

from the MediChannel login page.

The implementation uses the **OAuth 2.0 Authorization Code Flow with PKCE** together with OpenID Connect.

### Implemented Security Controls

The implementation includes:

- PKCE
- State validation
- Nonce validation
- Google ID token verification
- Verified Google `sub` claim for account identification
- Patient-only automatic account provisioning
- Protection against unsafe automatic account linking based only on email
- Short-lived, single-use login tickets
- Exchange of the temporary ticket for the MediChannel JWT

### Authentication Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/auth/google` | Starts the Google authentication flow |
| `GET` | `/api/auth/google/callback` | Handles the Google authorization callback |
| `POST` | `/api/auth/google/exchange` | Exchanges the temporary login ticket for a MediChannel JWT |

### Testing

Positive testing confirmed:

- Google authentication can be initiated.
- Google account selection is displayed.
- A patient can successfully authenticate.
- The Patient Dashboard opens after login.
- The Google-linked patient account is stored.
- Returning Google patients can authenticate again.

Negative testing confirmed:

- Invalid login tickets are rejected with HTTP `400`.
- Google-only accounts cannot authenticate using an arbitrary local password and receive HTTP `401`.

Evidence is available under:

```text
security-evidence/google-oidc/
```

---

## 6. Security Testing Methodology

The security assessment combined multiple testing approaches.

### Manual White-Box Review

Source code was reviewed to identify insecure:

- Authentication logic
- Authorization logic
- Secret handling
- Payment processing
- Logging behavior
- Service-to-service communication

### Static Application Security Testing

**Semgrep** was used for targeted static analysis, including detection and verification of the hard-coded administrative secret vulnerability.

### API Security Testing

**Postman** and **Bruno** were used for:

- Authentication testing
- Authorization testing
- Object-level authorization testing
- Service authentication testing
- Negative test cases
- Regression testing

### Dynamic Application Security Testing

**OWASP ZAP** was used as part of testing the internal API exposure and authentication remediation.

### Payment Integration Testing

**Stripe CLI** was used to test valid signed Stripe webhook events.

Payment-related security testing also verified failure handling and webhook signature enforcement.

---

## 7. Regression Testing

After each security fix, the original vulnerable behavior was tested again to verify that it had been blocked.

Regression testing also confirmed that legitimate application functionality remained operational.

Examples include:

- Legitimate doctors can still access related patient reports.
- Unrelated doctors receive `403 Forbidden`.
- Unauthenticated report requests receive `401 Unauthorized`.
- Legitimate telemedicine users retain access.
- Unauthorized telemedicine requests are blocked.
- Valid internal service authentication continues to function.
- Valid Stripe webhook events remain functional.
- Payment verification failures do not alter payments incorrectly.
- Sensitive service credentials are no longer written to logs.

---

## 8. Security Evidence

Security evidence is stored under:

```text
security-evidence/
```

The repository contains before-fix and after-fix evidence for the identified vulnerabilities.

Examples include:

```text
security-evidence/
├── vuln-01-admin-secret-semgrep/
├── vuln-02-telemedicine/
├── vuln-03-medical-report-idor/
├── Internal-API/
├── ZAP-after-fix/
├── vuln-05-stripe-webhook/
├── vuln-06-payment-fail-open/
├── vuln-07-secret-logging/
└── google-oidc/
```

Evidence includes:

- Vulnerable source-code screenshots
- Before-fix API responses
- Updated secure implementations
- After-fix API responses
- Regression test output
- OIDC implementation evidence
- Positive and negative authentication tests

---

## 9. Technology Stack

| Category | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Authentication | JWT |
| Federated Authentication | Google OpenID Connect |
| Payment Integration | Stripe |
| API Communication | REST |
| Containerization | Docker |
| Orchestration | Kubernetes |
| Static Security Testing | Semgrep |
| API Testing | Postman, Bruno |
| Dynamic Security Testing | OWASP ZAP |
| Payment Testing | Stripe CLI |
| Version Control | Git, GitHub |

---

## 10. Microservices

The backend includes the following services:

```text
auth-service
patient-service
doctor-service
appointment-service
telemedicine-service
payment-service
prescription-service
notification-service
ai-service
user-service
```

---

## 11. Project Structure

```text
SSD_Project/
│
├── Backend/
│   └── services/
│       ├── ai-service/
│       ├── appointment-service/
│       ├── auth-service/
│       ├── doctor-service/
│       ├── notification-service/
│       ├── patient-service/
│       ├── payment-service/
│       ├── prescription-service/
│       ├── telemedicine-service/
│       └── user-service/
│
├── Frontend/
│
├── k8s/
│
├── security-evidence/
│
├── security-tests/
│   ├── bruno/
│   ├── vuln01-regression.js
│   └── vuln07-regression.js
│
├── semgrep-rules/
│
└── README.md
```

---

## 12. Running the Application

### Prerequisites

Install:

- Git
- Node.js
- npm
- Docker Desktop
- MongoDB configuration required by the project

Additional tools used for security testing include:

- Postman
- Bruno
- Semgrep
- OWASP ZAP
- Stripe CLI

---

### Clone the Repository

```bash
git clone https://github.com/Kehara04/SSD_Project.git
cd SSD_Project
```

---

### Configure Environment Variables

Each service requires its relevant environment variables.

Examples include:

- MongoDB connection strings
- JWT configuration
- Internal service credentials
- Stripe configuration
- Google OpenID Connect configuration
- Email/SMS configuration
- Other service API credentials

Actual `.env` files and secrets must **not** be committed to the repository.

---

### Docker

The project can be started using Docker where configured:

```bash
docker compose up --build
```

---

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

The frontend development server normally runs on:

```text
http://localhost:5173
```

---

## 13. VULN-03 Bruno Regression Tests

The medical-report authorization regression collection is located at:

```text
security-tests/bruno/MediChannel VULN-03 IDOR Tests/
```

Provide the required doctor JWTs through local PowerShell environment variables:

```powershell
$env:DOCTOR_A_TOKEN="DOCTOR_A_JWT"
$env:DOCTOR_B_TOKEN="DOCTOR_B_JWT"
```

Run the collection:

```powershell
npx @usebruno/cli run --env Local `
  --env-var "doctorAToken=$env:DOCTOR_A_TOKEN" `
  --env-var "doctorBToken=$env:DOCTOR_B_TOKEN"
```

JWT values must not be committed to the repository.

---

## 14. Software Engineering Practices Applied

The project demonstrates the importance of integrating security throughout the software development lifecycle.

Relevant practices include:

- Secure code review
- Static security analysis
- Centralized authentication and authorization
- Object-level authorization
- Secure service-to-service authentication
- Threat modelling and trust boundaries
- Fail-closed payment processing
- External webhook verification
- Secure logging
- Negative security testing
- Automated regression testing
- Separate Git branches for security fixes
- Pull-request based integration

---

## 15. Repository Links

**Original Repository:**  
`https://github.com/Kehara04/DS-Project.git `

**Security-Enhanced Repository:**  
`https://github.com/Kehara04/SSD_Project`

---

## 16. Final Status

The final `main` branch contains the integrated security-enhanced MediChannel application.

The seven identified vulnerabilities were remediated and retested, and legitimate functionality was regression tested.

The project also includes a working Google OpenID Connect patient authentication feature.

---

## 17. Security Notice

This repository is intended for academic use.

Do not commit or expose:

- `.env` files
- JWT tokens
- MongoDB credentials
- Internal service secrets
- Stripe secret keys
- Stripe webhook secrets
- Google client secrets
- Email credentials
- API keys
- Real patient medical information

Only test accounts and non-sensitive test data should be used for security demonstrations.
