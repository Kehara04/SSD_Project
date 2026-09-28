# VULN-07 After-Fix Retest

## Vulnerability
Sensitive Service Secrets Written to Logs

## Fix Applied
Sensitive credential values were removed from the service authentication logs.

The middleware no longer logs:

- incoming service secrets
- expected service secrets

A generic authentication failure message is used instead.

## Retest 1 - Wrong Service Credential

### Test
Sent a request to a protected internal endpoint using an invalid test service credential.

### Expected Result
The request should be rejected and the credential must not appear in logs.

### Actual Result
The request was rejected with `401 Unauthorized`.

The application logged only a generic authentication failure message.

The credential value did not appear in the logs.

### Status
PASS

## Retest 2 - Missing Service Credential

### Test
Sent the same request without a service credential.

### Expected Result
The request should be rejected and no sensitive value should be logged.

### Actual Result
The request was rejected with `401 Unauthorized`.

No service secret was written to the logs.

### Status
PASS

## Retest 3 - Valid Service Credential

### Test
Sent a request using a valid test service credential.

### Expected Result
The service authentication check should succeed while the credential remains absent from application logs.

### Actual Result
The request passed the service-authentication check.

The valid credential was not written to the logs.

### Status
PASS

## Security Improvement
Service authentication remains functional while credentials are no longer exposed through application/container logging.

## Final Status
FIXED