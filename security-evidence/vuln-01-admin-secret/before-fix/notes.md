# VULN-01 Baseline Test

Vulnerability:
Hard-coded Admin Secret / Insecure Admin Registration

Testing method:
White-box code review + manual API testing

Tools:
VS Code + Postman

Affected service:
auth-service

Affected files:
controllers/authController.js
routes/authRoutes.js

Finding:
The admin registration logic contains the hard-coded secret "ADMIN123".

Test:
A POST request was sent to the public admin registration endpoint using the known secret.

Actual result:
An administrator account was created.

Expected secure result:
Public users should not be able to create administrator accounts using a shared hard-coded secret.

Impact:
Anyone who obtains the source code or secret could potentially create an administrator account.