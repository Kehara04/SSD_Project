# VULN-04 Before-Fix Test

Vulnerability:
Unauthenticated Internal User APIs

Testing method:
Automated DAST + manual verification

Automated tool:
OWASP ZAP via Docker

Target:
http://localhost:5001

Manual validation:
GET /api/internal/users/:id

Authentication:
None

Actual result:
The internal user endpoint was accessible without service authentication.

Expected secure result:
The endpoint should reject unauthenticated external requests.

Security impact:
An external caller may access or modify internal user data.