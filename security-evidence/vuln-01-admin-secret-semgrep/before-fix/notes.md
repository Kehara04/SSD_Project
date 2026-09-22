# VULN-01 Semgrep Baseline Test

## Vulnerability
Hard-coded Admin Secret / Insecure Admin Registration

## Tool
Semgrep Community Edition

## Testing Type
Static Application Security Testing (SAST)

## Affected Service
auth-service

## Affected File
`src/controllers/authController.js`

## Affected Endpoint
`POST /api/auth/register/admin`

## Finding
The administrator registration logic compared the user supplied
`adminSecret` against a hard-coded string value.

Example vulnerable logic:

`adminSecret !== "ADMIN123"`

## Detection Method
The auth-service source code was scanned using Semgrep.

A project-specific Semgrep rule was used to detect the hard-coded
administrator registration credential.

## Security Risk
If the fixed secret becomes known, an unauthorized user could use it
to create an administrator account.

## Baseline Result
Semgrep detected the hard-coded administrator secret.

## Status
VULNERABLE