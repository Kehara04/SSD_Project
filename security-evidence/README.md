# Security evidence

This directory records the investigation and verification of missing service authentication on the auth service's internal API. It contains before-fix Postman captures, after-fix Postman and terminal checks, and targeted ZAP verification through Docker.

The recorded after-fix checks show missing and incorrect service credentials receiving 401, a valid credential receiving 200, and tested internal routes receiving 404 through the public listener. This evidence covers this specific remediation, not an overall security certification of the project.

## Evidence index

| Location | Purpose |
| --- | --- |
| [Internal-API/before-fix](Internal-API/before-fix/) | Original Postman requests and successful responses demonstrating the reported exposure |
| [Internal-API/after-fix](Internal-API/after-fix/) | Public-route checks, service-authentication verification, and regression-test output |
| [ZAP-after-fix/notes.md](ZAP-after-fix/notes.md) | Docker/ZAP setup, reproduction steps, observed results, and evidence limitations |

## Original finding

Internal endpoints were reachable through the public auth API on port 5001. The before-fix tests were recorded as requests without authentication and returned user information, approved-doctor information, and a successful user-profile update. This exposed both information disclosure and unauthorized modification risks to callers able to reach those endpoints.

| Request | Captured result | Evidence |
| --- | --- | --- |
| `GET /api/internal/users/:id` | 200 with user details | [User lookup](<Internal-API/before-fix/get user-no auth.png>) |
| `GET /api/internal/users/by-nic/:nic` | 200 with user details | [NIC lookup](<Internal-API/before-fix/get-NIC-no auth.png>) |
| `PATCH /api/internal/users/:id/basic` | 200 with the submitted test name in the returned user | [User update](<Internal-API/before-fix/patch-user-no auth.png>) |
| `GET /api/internal/doctors/approved` | 200 with doctor records | [Approved doctors](Internal-API/before-fix/get-approved-doctors.png) |

The screenshots show successful requests and responses; not all show the Authorization or Headers panels. The unauthenticated test conditions are recorded by the test context and filenames rather than fully visible in every capture. User identifiers and personal details are intentionally not transcribed here.

### Before-fix Postman procedure and findings

The recorded test procedure used `http://localhost:5001` as the base URL, selected **No Auth** in Postman, and sent requests without a service credential. The examples below use placeholders for the records visible in the original screenshots. They describe the historical tests; they are not instructions to restore the vulnerable implementation.

**PM-B01 — Read a user by ID**

```http
GET http://localhost:5001/api/internal/users/<TEST_USER_ID>
```

The response was **200 OK** and contained a `user` object with identity and contact fields, role, and account status. A caller able to reach the endpoint could retrieve information intended for internal service use. See [the original user lookup](<Internal-API/before-fix/get user-no auth.png>).

**PM-B02 — Read a user by NIC**

```http
GET http://localhost:5001/api/internal/users/by-nic/<TEST_NIC>
```

The response was **200 OK** and returned a user record, including personal and account fields. This demonstrated lookup by a personal identifier. This is the **by-NIC lookup** endpoint, which differs from the **NIC availability check** used in the later ZAP tests. See [the original NIC lookup](<Internal-API/before-fix/get-NIC-no auth.png>).

**PM-B03 — Modify basic user information**

```http
PATCH http://localhost:5001/api/internal/users/<TEST_USER_ID>/basic
Content-Type: application/json

{"name":"Unauthorized Update Test"}
```

The response was **200 OK** and returned the submitted test name in the user record. This demonstrates an accepted update, extending the finding beyond information disclosure to unauthorized modification. The screenshot does not independently establish subsequent database state or restoration of the original name. See [the original update request and response](<Internal-API/before-fix/patch-user-no auth.png>).

**PM-B04 — Retrieve approved doctors**

```http
GET http://localhost:5001/api/internal/doctors/approved
```

The response was **200 OK** with doctor records, including contact and account fields. See [the original approved-doctor response](Internal-API/before-fix/get-approved-doctors.png).

The security issue is that operations intended for trusted backend services were accepted through the public listener without the intended service credential. These captures do not establish that the development server was reachable from the public internet.

## Implemented remediation

The current implementation separates the public and internal Express applications:

- [Public app](../Backend/services/auth-service/src/app.js): mounts public auth/admin routes and does not mount `/api/internal`.
- [Internal app](../Backend/services/auth-service/src/internalApp.js) and [server startup](../Backend/services/auth-service/src/server.js): serve internal routes on the separate listener, port 5011 by default; startup rejects absent or weak service credentials.
- [Internal routes](../Backend/services/auth-service/src/routes/internalRoutes.js): apply service authentication before all internal handlers.
- [Service authentication middleware](../Backend/services/auth-service/src/middleware/serviceAuth.js): rejects absent or incorrect `x-service-secret` values with 401, compares fixed-length credential digests using a timing-safe comparison, and returns 503 if credential configuration is unavailable.
- [Compose configuration](../Backend/services/docker-compose.yml): mounts the shared local secret into participating services and directs their internal auth requests to `http://auth-service:5011`. Port 5011 has no host port mapping in this configuration. Public port 5001 is bound to host loopback.

The credential authenticates possession of the shared service secret. It does not establish a separate identity or separate permissions for each service.

### Secret configuration and service callers

The local secret file is `Backend/services/.secrets/auth-internal-secret`. Compose mounts it at `/run/secrets/auth_internal_secret` and supplies that path through `AUTH_INTERNAL_SECRET_FILE` to auth, patient, doctor, and appointment services. The `.secrets/` directory is ignored by [the services Git ignore file](../Backend/services/.gitignore).

The [secret-loading helper](../Backend/services/auth-service/src/utils/internalServiceAuth.js) reads and trims the file when a file path is configured, otherwise uses `AUTH_INTERNAL_SECRET`. It rejects missing values, values shorter than 32 characters, and recognized placeholder strings. The server checks this configuration before opening its listeners. If credential configuration becomes unavailable during request handling, the middleware rejects the request with 503 instead of allowing access.

Patient, doctor, and appointment callers send `x-service-secret` and use `AUTH_INTERNAL_SERVICE_URL` for these internal calls. The header is a backend service credential, not a user's login password or JWT. All participating containers must use the same configured value.

### Before-and-after behavior

| Aspect | Before fix | After fix |
| --- | --- | --- |
| Internal route placement | Reachable on the public listener, port 5001 | Mounted on the separate internal listener, port 5011 |
| Public access to tested internal paths | Successful responses, including user reads and an update | 404 because the public application does not register those routes |
| Requests without a service credential | Reported unauthenticated Postman requests succeeded | Internal middleware returns 401 |
| Requests with an incorrect service credential | No before-fix capture for this case | Internal middleware returns 401 |
| Valid service credential | No distinct before-fix credential test | Internal NIC-check request returns 200 |
| Missing or weak server credential | No before-fix evidence for this condition | Startup validation rejects it; middleware regression cases return 503 |

A 404 on port 5001 and a 401 on port 5011 demonstrate different controls: route separation and service authentication, respectively.

## After-fix evidence

| Check | Recorded result | Evidence |
| --- | --- | --- |
| Public approved-doctor route | 404 | [Postman: doctors blocked](<Internal-API/after-fix/confirm public access is blocked.png>) |
| Public user lookup without authentication | 404 | [Postman: user lookup blocked](<Internal-API/after-fix/confirm public access is blocked1.png>) |
| Internal NIC-check request: no / wrong / valid credential | 401 / 401 / 200; valid response `{"exists":false}` | [Container verification](<Internal-API/after-fix/verify private authentication.png>) |
| Automated regression output | 30 tests reported, 30 passed, 0 failed | [Regression output](<Internal-API/after-fix/regression test.png>) |
| ZAP manual credential checks and public route check | 401 / 401 / 200 / 404 | [ZAP results and screenshot links](ZAP-after-fix/notes.md) |

The regression screenshot includes the parent test in the reported count and shows 29 nested subtests. Its visible cases include public-route exclusion and rejection of unconfigured or weak credentials. The saved results are historical evidence; the tests were not rerun when this README was prepared on 22 September 2026.

### After-fix Postman checks

Repeat the following read-only requests in Postman with **Authorization → No Auth**, with no service-secret header:

| ID | Request | Observed result | Interpretation |
| --- | --- | --- | --- |
| PM-A01 | `GET http://localhost:5001/api/internal/doctors/approved` | 404; `Route not found: /api/internal/doctors/approved` | Approved-doctor internal route is absent from the public listener |
| PM-A02 | `GET http://localhost:5001/api/internal/users/<TEST_USER_ID>` | 404 with the requested path in the route-not-found message | Public user lookup no longer returns a user record |

Evidence: [PM-A01](<Internal-API/after-fix/confirm public access is blocked.png>) and [PM-A02](<Internal-API/after-fix/confirm public access is blocked1.png>).

These captures show application responses, rather than connection failures. Desktop Postman cannot directly reach `localhost:5011` under the normal Compose configuration because that port is not published. The following container-based checks exercise the internal listener without adding a host port mapping.

### After-fix service-to-service check

The saved terminal check ran from `patient-service` and sent three requests to:

```text
http://auth-service:5011/api/internal/users/check-nic/security-test
```

| Credential condition | Recorded response |
| --- | --- |
| No header | `401 {"message":"Unauthorized: Service credential required"}` |
| `x-service-secret: wrong` | `401 {"message":"Unauthorized: Invalid service credential"}` |
| Header supplied by `getInternalServiceHeaders()` | `200 {"exists":false}` |

The valid case confirms that the configured service credential permits the tested operation. It is a positive control against incorrectly treating a completely unavailable endpoint as a successful security fix. See [the command and its output](<Internal-API/after-fix/verify private authentication.png>).

To repeat from `Backend/services` without displaying the secret:

```bash
docker compose exec -T patient-service node -e '
const { getInternalServiceHeaders } = require("./src/utils/internalServiceAuth");
(async () => {
  const url = process.env.AUTH_INTERNAL_SERVICE_URL +
    "/api/internal/users/check-nic/security-test";
  for (const [label, headers, expected] of [
    ["No credential", {}, 401],
    ["Wrong credential", {"x-service-secret": "wrong"}, 401],
    ["Valid service credential", getInternalServiceHeaders(), 200]
  ]) {
    const response = await fetch(url, { headers });
    console.log(label, response.status, await response.text());
    if (response.status !== expected) process.exitCode = 1;
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
'
```

This reproduction version additionally exits unsuccessfully if a status differs from the expectation; the original screenshot records a version that prints the results.

### Automated regression coverage

The current [regression test source](../Backend/services/auth-service/test/internalServiceAuth.test.js) exercises these five routes:

| Method | Internal path |
| --- | --- |
| GET | `/api/internal/users/:id` |
| PATCH | `/api/internal/users/:id/basic` |
| GET | `/api/internal/users/by-nic/:nic` |
| GET | `/api/internal/users/check-nic/:nic` |
| GET | `/api/internal/doctors/approved` |

For each route, the test checks no credential (401), an incorrect credential (401), a user-JWT-only header (401), a valid service credential (200), and public-listener access even with a service credential (404). It also asserts that rejected requests do not invoke the controller and that the tested internal responses do not echo the secret. Four additional cases check missing, empty, short, and placeholder server credentials, expecting 503.

This accounts for 25 route cases plus four configuration cases: 29 nested tests, with the parent included in Node's reported total of 30. The [saved output](<Internal-API/after-fix/regression test.png>) reports 30 passed and zero failed.

The tests use stub controllers and a test-only secret. They verify route and middleware behavior without exercising MongoDB or actually updating a user. The JWT-only case demonstrates that a bearer header does not substitute for the service secret; it does not validate a real user's login session.

To repeat from the repository root with dependencies installed:

```bash
npm --prefix Backend/services/auth-service test
```

### After-fix ZAP setup and procedure

The ZAP evidence was collected using the Manual Request Editor through Docker/Webswing. The saved HTTP response dates are 21 September 2026. This was targeted manual testing, not an automated active scan.

For a new ZAP container on the application's `services_default` network:

```bash
docker run -d --name zap-security-test \
  --network services_default \
  -u zap \
  -p 127.0.0.1:8080:8080 \
  -p 127.0.0.1:8090:8090 \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-webswing.sh
```

If the named container already exists, use `docker start zap-security-test` and confirm it is on the application network. Open `http://localhost:8080/zap/` and choose **Tools → Manual Request Editor**. ZAP uses `auth-service` as the target hostname; `localhost` inside ZAP would refer to the ZAP container. No host mapping for port 5011 is needed.

Send this base request, ending the headers with a blank line:

```http
GET http://auth-service:5011/api/internal/users/check-nic/security-test HTTP/1.1
Host: auth-service:5011

```

1. Send it without a credential.
2. Add `x-service-secret: wrong` and resend.
3. Replace `wrong` with the actual local service secret and resend. Do not include that value in shared evidence.
4. Remove the credential header and change both the URL and Host to port 5001; resend to test route separation.

### ZAP observed results and evidence

| ID | Condition | Expected | Observed | Screenshot |
| --- | --- | --- | --- | --- |
| ZAP-A01 | Port 5011, missing credential | 401 | 401; `Unauthorized: Service credential required` | [Missing credential](<ZAP-after-fix/test without a credential.png>) |
| ZAP-A02 | Port 5011, incorrect credential | 401 | 401; `Unauthorized: Invalid service credential` | [Incorrect credential](<ZAP-after-fix/Test with an incorrect credential.png>) |
| ZAP-A03 | Port 5011, valid service credential | 200 | 200 OK | [Valid credential](<ZAP-after-fix/Test with the valid credential.png>) |
| ZAP-A04 | Port 5001, internal NIC-check route | 404 | 404; `Route not found: /api/internal/users/check-nic/security-test` | [Public route blocked](<ZAP-after-fix/Verify the public port blocks internal routes.png>) |

All four recorded response statuses match the expected outcomes. The ZAP images show response panels, so the request/header conditions are associated through the filenames and recorded procedure. ZAP-A03 shows the 200 response header but does not show the JSON body; the separate container check supplies the visible `{"exists":false}` result. Do not present that body as visible in the ZAP screenshot.

The additional [curl screenshot](ZAP-after-fix/curl-check-user-no-auth.png) shows a host-side `GET http://localhost:5001/api/internal/users/<TEST_USER_ID>` returning 404. It corroborates public-route removal but is command-line evidence, not a ZAP result.

Detailed ZAP notes are available in [ZAP-after-fix/notes.md](ZAP-after-fix/notes.md). Tool references: [ZAP Docker/Webswing](https://www.zaproxy.org/docs/docker/webswing/) and [Manual Request Editor](https://www.zaproxy.org/docs/desktop/addons/requester/dialogs/).

## Coverage and evidence handling

Together, the captures support the remediation of the tested internal API exposure while preserving legitimate service access. The available manual after-fix evidence does not repeat every original operation, including the PATCH request. A response from one route is not proof of coverage for every route, although the current source applies the middleware to the entire internal router.

There is no full automated ZAP scan report in this directory. Admin login, other services, broader authorization, and isolation from networks outside Docker are outside this evidence set. The ZAP response headers date those captures to 21 September 2026; no exact application commit or ZAP image digest was saved alongside them.

Before sharing evidence outside the project, redact names, NICs, email addresses, phone numbers, tokens, and service secrets. The existing before-fix images contain personal fields. Keep the local `.secrets` directory out of version control and retain redacted request-and-response pairs for future runs.
