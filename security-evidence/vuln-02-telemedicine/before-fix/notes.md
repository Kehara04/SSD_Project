Vulnerability:
Unauthenticated Telemedicine Endpoints

Testing method:
Black-box API authorization testing

Tool:
Postman

Affected service:
telemedicine-service

Test:
Sent a request to the telemedicine endpoint without an Authorization header.

Actual result:
The request was accepted and telemedicine data/action was available.

Expected secure result:
Unauthenticated users should receive 401 Unauthorized.

Security impact:
An unauthorized user may access or modify sensitive telemedicine sessions.