# VULN-01 After-Fix Retest

## Vulnerability
Hard-coded Admin Secret / Insecure Admin Registration

## Testing Method
Manual API authorization testing

## Tools
Postman + VS Code

## Affected Service
auth-service

## Affected Files
- `src/controllers/authController.js`
- `src/routes/authRoutes.js`

## Fix Applied
The hard-coded `ADMIN123` secret was removed from the admin registration logic.

The `/register/admin` endpoint is now protected using:
- JWT authentication
- admin role authorization

Only an authenticated user with the `admin` role can create another administrator account.

The `adminSecret` field is no longer required or accepted for authorization.

---

## Retest 1 - No Authentication

### Test
Sent a POST request to the admin registration endpoint without a JWT token.

### Result
The request was rejected with:

`401 Unauthorized`

### Expected Result
Unauthenticated users must not be able to create administrator accounts.

### Status
PASS

---

## Retest 2 - Patient Account

### Test
Logged in as a patient and used the patient JWT token to call the admin registration endpoint.

### Result
The request was rejected with:

`403 Forbidden`

### Expected Result
Authenticated non-admin users must not be able to create administrator accounts.

### Status
PASS

---

## Retest 3 - Authorized Admin

### Test
Logged in as an existing administrator and used the admin JWT token to call the admin registration endpoint.

### Result
The administrator account was created successfully.

### Expected Result
Only authenticated administrators should be allowed to create another administrator.

### Status
PASS

---

## Before Fix

Before the remediation, admin registration depended on the following hard-coded shared secret:

`ADMIN123`

A user who knew the secret could submit it to the public admin registration endpoint and create an administrator account.

---

## After Fix

Admin creation now follows:

Authenticated User
→ JWT Validation
→ Admin Role Check
→ Admin Registration

The old hard-coded secret is no longer used.

---

## Security Improvement

The remediation removes the shared hard-coded credential and replaces it with server-side authentication and role-based authorization.

This reduces the risk of unauthorized privilege escalation through exposure of the source code or the shared admin secret.

## Final Status
FIXED