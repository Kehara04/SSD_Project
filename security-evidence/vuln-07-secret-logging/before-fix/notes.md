# VULN-07 Baseline Test

## Vulnerability
Sensitive Service Secrets Written to Logs

## Testing Method
White-box code review + runtime log inspection

## Tools
VS Code + PowerShell + Docker logs

## Affected Service
appointment-service

## Affected File
`src/middleware/serviceAuth.js`

## Protected Endpoint
`GET /api/appointments/internal/:id/notification`

## Test Performed
A request was sent with an invalid `x-service-secret` value:

`wrong-test-secret`

## Actual Result
The request was correctly rejected with HTTP 401.

However, the application logs exposed both:

- the incoming credential
- the configured expected service credential

Example log behavior:

`incomingSecret: wrong-test-secret`

`expectedSecret: [service secret exposed]`

## Expected Secure Result
Authentication credentials must never be written to application or container logs.

## Security Impact
Anyone with access to application logs could obtain the internal service credential and impersonate a trusted service.

## Baseline Status
VULNERABLE