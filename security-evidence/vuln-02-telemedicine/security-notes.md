# Telemedicine session authentication and authorization fix

Date: 17 September 2026

## Original issue

The telemedicine service exposed four session routes without authentication or authorization middleware. Callers could reach the controllers without a login token. The controllers also did not verify that the caller was the appointment's or session's assigned patient or doctor.

Base URL for local Postman requests: `http://localhost:5004/api/sessions`.

| Method | Route | Operation |
| --- | --- | --- |
| POST | `/` | Create a session or return an existing session |
| GET | `/appointment/:appointmentId` | Retrieve a session and meeting URL |
| PUT | `/:id/join` | Set the session to active and return the meeting URL |
| PUT | `/:id/end` | Mark the session completed and attempt a completion notification |

The `:id` parameter is the session's `_id`, not the appointment ID.

The user collected pre-fix evidence in Postman before implementation. Unauthenticated access could disclose session details and meeting URLs, and allow unauthorized session creation or status changes.

## Authentication changes

Reused the project's existing `authenticate` middleware from `src/middleware/authMiddleware.js`. No separate JWT authentication implementation was introduced.

The session router now applies authentication before all four routes:

```js
router.use(authenticate);
router.use(authorize("patient", "doctor"));
```

The existing middleware reads `Authorization: Bearer <token>`, verifies the token using `JWT_SECRET`, and places its verified claims on `req.user`.

Missing tokens return **401 Unauthorized**:

```json
{ "message": "Unauthorized: No token provided" }
```

Invalid, expired, or incorrectly signed tokens return **401 Unauthorized**:

```json
{ "message": "Unauthorized: Invalid token" }
```

## Authorization changes

Reused the existing `authorize` middleware to restrict session routes to the `patient` and `doctor` roles. Admin and other roles are not granted access through these routes.

Added an `isParticipant` helper in the session controller. It checks the verified JWT identity against the participant ID for that user's role:

- A patient must have `req.user.id` equal to the resource's `patientId`.
- A doctor must have `req.user.id` equal to the resource's `doctorId`.
- Missing identities or unsupported roles do not pass.

For **creation**, the controller first retrieves the appointment through the existing internal appointment-service endpoint. It authorizes the caller against that trusted appointment, rather than accepting the participant IDs supplied in the request body as proof of permission. The existing body-ID consistency checks remain. New sessions store the participant IDs from the appointment response. If a session already exists, its participant ownership is also checked before it is returned.

For **retrieval, joining, and ending**, the controller checks the stored session's participants before returning session details, changing status, saving timestamps, or attempting a completion notification.

An authenticated user without the required role or ownership receives **403 Forbidden**:

```json
{ "message": "Forbidden: Access denied" }
```

Both assigned participants can create, read, join, and end their session. This change does not make ending a session doctor-only.

## Files changed or added

Paths are relative to the repository root.

| File | Change |
| --- | --- |
| `Backend/services/telemedicine-service/src/routes/sessionRoutes.js` | Apply existing authentication and role middleware to all session routes |
| `Backend/services/telemedicine-service/src/controllers/sessionController.js` | Enforce appointment/session ownership before disclosure or side effects |
| `Backend/services/telemedicine-service/package.json` | Set `npm test` to run `node --test` |
| `Backend/services/telemedicine-service/test/sessionAuthentication.test.js` | Add authentication regression tests |
| `Backend/services/telemedicine-service/test/sessionAuthorization.test.js` | Add role and ownership regression tests |

The frontend already attaches the Bearer token to its telemedicine API client, so no frontend authentication change was needed.

## Validation performed

The tests ran successfully in an isolated Docker container with the external network disabled. Database operations and downstream HTTP calls were replaced with test doubles to avoid changing real appointments or sending notifications.

- **20 authentication cases:** all four routes with missing, malformed, expired, incorrectly signed, and valid tokens. Rejected requests were verified not to invoke controllers.
- **36 authorization cases:** assigned patients/doctors, unrelated patients/doctors, mismatched roles and identities, admin users, missing identity claims, spoofed body IDs, permitted creation, and ownership checks when returning an existing session from POST.
- Rejected authorization requests were checked for absence of writes, status changes, and notifications.
- **56 individual cases passed.** Node reported 58 passing tests when the two parent test groups were included.
- `git diff --check` passed.

The telemedicine Docker image was rebuilt and its container restarted. Live checks after the authentication change confirmed that all four endpoints returned 401 without a token. After the authorization change, the running rebuilt service was checked again and still rejected an unauthenticated GET with 401. The 403 ownership behavior was verified by the automated tests; the screenshot files below provide the user's Postman evidence for review.

From `Backend/services`, the service can be rebuilt and tests rerun with:

```bash
docker compose up -d --build --no-deps telemedicine-service
docker compose exec -T telemedicine-service npm test
```

## Postman verification

1. Log in using a registered test user's credentials. Select POST and enter only this URL in Postman's URL field:

   ```text
   http://localhost:5001/api/auth/login
   ```

   Select Body → raw → JSON:

   ```json
   {
     "email": "test-user@example.com",
     "password": "your-test-user-password"
   }
   ```

2. Copy the returned `token`. For session requests, select Authorization → Bearer Token and paste the token without an additional `Bearer` prefix.
3. With No Auth and no manually supplied authentication header, repeat the four session requests. Expect 401.
4. Log in as a different registered patient or doctor who does not belong to the test session. Use their valid token with the original appointment/session IDs. Expect 403. For POST, supply the original appointment's matching participant IDs so the request is otherwise valid.
5. Use the assigned patient's or doctor's token. A valid GET for the existing session should return 200. Creation and state-changing requests should proceed if their normal prerequisites are satisfied.

Use disposable test sessions for join/end checks: they change state, and ending can attempt a notification. For screenshots, capture the method, URL, authentication configuration, response status, and response body. Redact passwords, usable tokens, and personal data before sharing evidence.

## Evidence files

These links index the existing screenshot files; their filenames are descriptive labels, not additional automated test assertions.

### Before the fix

- [Routes without authentication](before-fix/01-routes-no-auth.png)
- [Create session without authentication](before-fix/create-session-no-auth.png)
- [Unauthenticated POST](before-fix/no-auth-post-session.png)
- [Retrieve created session without authentication](before-fix/get-no-auth-created-session.png)
- [Join session without authentication](before-fix/no-auth-join-session.png)
- [End session without authentication](before-fix/no-auth-session-end-time.png)

### After the fix

- [Unauthenticated POST](after-fix/no-auth-post-session.png)
- [Unauthenticated GET](after-fix/no-auth-get-session.png)
- [Unauthenticated join](after-fix/no-auth-join-session.png)
- [Unauthenticated end](after-fix/no-auth-end-session.png)
- [Different user's Bearer token — 403 evidence](after-fix/wrong-bearer-403.png)
- [Authorized doctor access](after-fix/authorized-doctor-access.png)

## Scope and limitations

This fix protects the telemedicine HTTP API using JWT identity, role, and resource ownership. It does not implement video-provider room admission controls, revoke meeting URLs already disclosed before the fix, or add session lifecycle restrictions. Access to an existing meeting URL at the video provider is a separate concern.

The earlier Docker daemon and MongoDB authentication failures were environment issues encountered while preparing the evidence. They are separate from API authentication and authorization. Docker service hostnames are used between containers; Postman on the host uses `localhost` and the published service port.
