# VULN-03 — Medical Report IDOR

## 1. Vulnerability Overview

**Vulnerability ID:** VULN-03
**Vulnerability Name:** Insecure Direct Object Reference (IDOR)
**Category:** Broken Object-Level Authorization (BOLA)
**Affected Service:** Patient Service
**Testing Tool:** Bruno API Client and Bruno CLI
**Testing Method:** Manual Negative Authorization Testing and Automated API Regression Testing

### Description

The MediChannel application allowed authenticated doctors to access medical reports belonging to unrelated patients by modifying the report ID, patient ID, or NIC in API requests.

Although the application verified that the requester was authenticated and had the doctor role, it did not verify whether the doctor had an authorized appointment relationship with the requested patient.

This could allow unauthorized access to sensitive medical information.

## 2. Affected Source Code

**File:** `Backend/services/patient-service/src/controllers/reportController.js`

The following doctor-facing endpoints were affected:

| HTTP Method | Endpoint                                 |
| ----------- | ---------------------------------------- |
| GET         | `/api/reports/doctor/:id`                |
| GET         | `/api/reports/doctor/:id/open`           |
| GET         | `/api/reports/doctor/patient/:patientId` |
| GET         | `/api/reports/doctor/patient/nic/:nic`   |

## 3. Before-Fix Reproduction

### Test Environment

Two doctors and two patients were used for testing.

* Doctor A had an authorized appointment relationship with Patient A.
* Doctor B had an authorized appointment relationship with Patient B.
* Doctor A had no authorized appointment relationship with Patient B.

### Testing Procedure

1. Logged in as Doctor A and obtained a valid JWT.
2. Accessed Patient A's medical report.
3. Replaced the report identifier with Patient B's report ID.
4. Repeated the request using Doctor A's JWT.
5. Tested the document-opening endpoint and other patient lookup endpoints.

### Observed Results

| Test                                         | Before-Fix Result                      |
| -------------------------------------------- | -------------------------------------- |
| Doctor A accesses Patient B's report         | 200 OK                                 |
| Doctor A opens Patient B's report            | 302 Found — redirected to the document |
| Doctor A accesses Patient B using patient ID | 200 OK                                 |
| Doctor A accesses Patient B using NIC        | 200 OK                                 |

These results demonstrated that role-level authorization alone was insufficient to prevent unauthorized access.

### Before-Fix Evidence

Screenshots are stored in:

`before-fix/`

They demonstrate unauthorized report retrieval, document opening, and the original vulnerable controller implementation.

## 4. Root Cause

The original implementation verified that the logged-in user had the doctor role but retrieved reports directly using user-controlled identifiers.

It did not verify whether the doctor was assigned to the patient through an authorized appointment.

Consequently, an authenticated doctor could access reports belonging to unrelated patients.

## 5. Remediation and Code Changes

Implemented server-side object-level authorization using appointment relationship verification.

The following reusable functions were introduced:

* `doctorHasPatientAccess()`
* `ensureDoctorPatientAccess()`

The authorization logic retrieves the authenticated doctor's appointments from the appointment service.

Access is granted only when the doctor has an approved or completed appointment relationship with the requested patient.

The authorization check was applied to all four doctor-facing report endpoints.

For individual report requests, the patient identifier is obtained from the stored report rather than trusted from the client.

The document-opening endpoint also performs authorization before redirecting to Cloudinary.

Unauthorized access now returns HTTP 403 Forbidden.

## 6. After-Fix Retesting

The original unauthorized requests were repeated using Bruno.

### Results

| Test                         | Expected Result | Actual Result |
| ---------------------------- | --------------- | ------------- |
| Doctor A → Patient A         | 200             | 200           |
| Doctor A → Patient B         | 403             | 403           |
| Doctor A → Patient B `/open` | 403             | 403           |
| Doctor A → Patient B by NIC  | 403             | 403           |
| Doctor B → Patient B         | 200             | 200           |
| No authentication            | 401             | 401           |

The retest confirmed that unauthorized access was blocked while legitimate medical report access remained functional.

## 7. Automated Regression Testing

Automated API regression testing was performed using Bruno CLI.

Each request contains a JavaScript test asserting its expected HTTP response status.

### Execution Summary

| Metric         | Result     |
| -------------- | ---------- |
| Overall Status | PASS       |
| Requests       | 6/6 Passed |
| Tests          | 6/6 Passed |
| Duration       | 5143 ms    |

The six automated tests verified authorized access, unauthorized access, NIC-based access control, document-opening protection, and missing authentication.

### Execution Command

```powershell
npx @usebruno/cli run --env Local `
  --env-var doctorAToken="$env:DOCTOR_A_TOKEN" `
  --env-var doctorBToken="$env:DOCTOR_B_TOKEN"
```

JWT values are supplied through local environment variables rather than committed to the repository.

## 8. After-Fix Evidence

Screenshots are stored in:

`after-fix/`

Evidence includes unauthorized requests returning 403, legitimate access returning 200, the automated Bruno execution summary, and the updated authorization code.


## 9. Final Status

**Status: Fixed and verified through Bruno API regression testing.**

The original unauthorized report-access requests are rejected, and legitimate doctor-patient report access remains functional.
