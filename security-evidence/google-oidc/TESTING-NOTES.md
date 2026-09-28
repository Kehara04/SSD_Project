
# Google OpenID Connect – Testing Evidence

## Feature

Google OpenID Connect (OIDC) authentication was integrated into MediChannel to allow patients to sign in using their Google accounts.

The feature provides an alternative to traditional email/password authentication while retaining the existing MediChannel patient dashboard and application session.

## Implementation

The patient Google authentication implementation includes:

- Authorization Code Flow with PKCE.
- State and nonce validation.
- Google ID token verification.
- Patient identification using the verified Google `sub` claim.
- Patient-only account creation.
- Prevention of automatic email-based account linking.
- Short-lived, single-use login ticket exchange.
- MediChannel JWT issuance after successful authentication.

The existing email/password login remains available.

## Test Environment

| Component | Configuration |
|---|---|
| Frontend | http://localhost:5173 |
| Authentication service | http://localhost:5001 |
| Database | MongoDB |
| Identity provider | Google |
| API testing tool | Postman |
| Browser | Google Chrome |

## Positive Tests

| ID | Test Scenario | Actual Result | Evidence |
|---|---|---|---|
| OIDC-01 | Google login option displayed | Continue with Google button displayed on the MediChannel login page. | `positive-tests/01-login-screen.png` |
| OIDC-02 | Google account selection | Google account selection screen opened after initiating authentication. | `positive-tests/02-google-account-selection.png` |
| OIDC-03 | Successful Google patient login | Authentication completed and the Patient Dashboard opened. | `positive-tests/03-patient-dashboard.png` |
| OIDC-04 | Google patient account stored in MongoDB | The patient account record was inspected in the database. | `positive-tests/04-patient-database-record.png` |
| OIDC-05 | Returning Google patient login | The patient successfully signed in again using Continue with Google. | `positive-tests/05-returning-google-login.png` |

## Negative Tests

| ID | Test Scenario | Actual Result | Evidence |
|---|---|---|---|
| OIDC-06 | Invalid login ticket submitted to the exchange endpoint | HTTP 400 Bad Request – "Invalid login ticket". | `negative-tests/01-invalid-ticket.png` |
| OIDC-07 | Google-only patient attempts email/password login | HTTP 401 Unauthorized – "Invalid credentials". | `negative-tests/02-local-password-rejected.png` |

## Security Controls

The implementation includes several security measures:

1. **PKCE:** Binds the authorization code exchange to the original authentication request.
2. **State validation:** Protects the authentication transaction against unauthorized callback requests.
3. **Nonce validation:** Associates the returned ID token with the original login request.
4. **ID token verification:** Validates the authentication result received from Google.
5. **Google subject identification:** Uses the verified `sub` claim to identify returning Google users.
6. **Patient-only registration:** New Google accounts are not automatically assigned doctor or administrator privileges.
7. **Single-use login ticket:** The frontend exchanges a temporary ticket for the MediChannel JWT instead of receiving the JWT in a redirect URL.

These controls are documented in the implementation code. The manual test results above cover the executed scenarios and should not be interpreted as independent verification of every security control.

## Test Conclusion

The executed tests confirmed that patients can authenticate using Google OpenID Connect and access the MediChannel Patient Dashboard.

The invalid-ticket test confirmed that the exchange endpoint rejects malformed login tickets. The password-login test confirmed that a Google-only patient cannot authenticate using an arbitrary password through the traditional login endpoint.

The implementation retains the existing email/password authentication functionality while providing Google authentication as an additional patient login option.

## Evidence Handling

- Google client secrets, JWTs, and temporary login tickets must not be exposed in screenshots.
- Personal identifiers should be masked where they are not required to demonstrate the test.
- Test accounts should not contain real patient medical information.
- Actual execution results are documented separately from security controls identified through source-code review.
