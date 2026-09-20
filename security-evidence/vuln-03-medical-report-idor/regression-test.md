# VULN-03 Regression Testing

## Test 1 - Authorized access

User:
Doctor A

Request:
GET /api/reports/doctor/<PATIENT_A_REPORT_ID>

Expected:
200 OK

Actual:
200 OK

Result:
PASS

---

## Test 2 - Unauthorized patient report

User:
Doctor A

Request:
GET /api/reports/doctor/<PATIENT_B_REPORT_ID>

Expected:
403 Forbidden

Actual:
403 Forbidden

Result:
PASS

---

## Test 3 - Authorized Doctor B access

User:
Doctor B

Request:
GET /api/reports/doctor/<PATIENT_B_REPORT_ID>

Expected:
200 OK

Actual:
200 OK

Result:
PASS

---

## Test 4 - No authentication

Request:
GET /api/reports/doctor/<REPORT_ID>

Authorization:
None

Expected:
401 Unauthorized

Actual:
401 Unauthorized

Result:
PASS