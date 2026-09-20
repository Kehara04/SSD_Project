# VULN-03 Medical Report IDOR

## Testing method
Manual negative authorization testing

## Tool
Postman

## User
Doctor A

## Test
Doctor A changed the medical report identifier from an authorized
patient report to Patient B's report.

## Before-fix result
The server returned HTTP 200 and disclosed Patient B's medical report.

## Expected secure behavior
The server should return HTTP 403 Forbidden because Doctor A does not
have an authorized doctor-patient relationship with Patient B.

## Impact
An authenticated doctor could access medical information belonging to
patients outside their authorized relationship.