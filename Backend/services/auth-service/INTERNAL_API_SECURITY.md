# Internal auth API security

The user lookup, NIC lookup, NIC availability, basic-profile update, and approved-doctor routes require service credentials. They are available only on the auth service's private listener at port 5011, under `/api/internal`.

The public listener on port 5001 does not mount these routes. It returns 404 for them even when a valid service credential is supplied. Normal login and registration remain on port 5001.

## Service authentication

The private router requires `x-service-secret` with a dedicated `AUTH_INTERNAL_SECRET`. A user Bearer token is not a service credential. This secret is independent of the login JWT secret and the existing `SERVICE_SECRET` used by other APIs.

- Missing or incorrect service credential: 401.
- Valid credential: the request reaches the internal controller and normal validation applies.
- Missing, short, or placeholder server credential: the server refuses startup. The middleware also fails closed with 503 if configuration becomes unavailable.
- Credential comparison uses constant-time comparison of SHA-256 digests.

Patient, doctor, and appointment services attach the credential to their auth-internal requests. The patient service's medical-report lookup calls are included.

This implements the shared-service-credential option, not mTLS or signed service JWTs. The trusted services share access to the internal routes; this does not provide separate per-service permissions. The private transport currently uses HTTP. Production environments requiring encryption between workloads should terminate TLS internally or enable service-mesh mTLS as well.

## Local Docker configuration

Compose mounts `Backend/services/.secrets/auth-internal-secret` read-only as a Docker secret into only auth, patient, doctor, and appointment containers. The credential is generated locally, ignored by Git, and not printed in application logs. The changed services' Docker build contexts exclude `.env` files.

For a fresh checkout, create the credential once from `Backend/services`:

```bash
mkdir -p .secrets
chmod 700 .secrets
(umask 077; openssl rand -hex 32 > .secrets/auth-internal-secret)
```

Do not rerun this generation command unless rotating the credential. To activate a new or rotated credential, recreate all four services together:

```bash
docker compose up -d --build --force-recreate --no-deps auth-service patient-service doctor-service appointment-service
```

Compose sets the client URL to `http://auth-service:5011`. Port 5011 has no host port mapping. Port 5001 is published only on `127.0.0.1` for local login and API testing.

For execution outside Docker, set `AUTH_INTERNAL_SECRET_FILE` to the credential file path in all four processes, or securely inject `AUTH_INTERNAL_SECRET`. Set `AUTH_INTERNAL_SERVICE_URL` to the private listener's address in the three callers. Never put this credential in frontend variables or source code.

## Kubernetes configuration

The manifests now:

- Source `AUTH_INTERNAL_SECRET` from `backend-secret` for the four services.
- Configure callers with `AUTH_INTERNAL_SERVICE_URL=http://auth-service:5011`.
- Make the auth Service ClusterIP instead of NodePort, with ports 5001 and 5011.
- Keep the ingress auth backend on public port 5001 only. There is no ingress backend for the private listener.
- Add a NetworkPolicy allowing private port 5011 only from patient, doctor, and appointment pods in the same namespace. Port 5001 remains reachable for public API consumers.

Before deployment, populate the new Secret key with an independently generated random credential using your secret-management workflow. `backend-secret.example.yaml` deliberately contains a rejected placeholder. Apply the updated manifests and roll out the four services together. NetworkPolicy enforcement requires a compatible cluster network plugin.

These Kubernetes changes have been prepared and their YAML parsed locally; they have not been applied to a cluster in this task. No ingress or gateway should forward to port 5011. The application's separate listeners prevent `/api/internal` from reaching an internal controller through public port 5001 regardless of a URL rewrite.

## Verification and evidence

From `Backend/services`:

```bash
docker compose exec -T auth-service npm test
```

The suite has 29 individual cases (30 including the parent group), using controller stubs to avoid real reads or writes. It checks every internal route with missing, wrong, user-only, and valid service credentials; confirms the public listener cannot reach those controllers; and checks invalid server configuration fails closed.

Live read-only checks after rebuilding confirmed:

| Check | Result |
| --- | --- |
| Internal path through public port 5001 | 404 |
| Private listener without credential | 401 |
| Private listener with incorrect credential | 401 |
| Patient service with configured credential | 200 |
| Doctor service with configured credential | 200 |
| Appointment service with configured credential | 200 |

The authenticated live checks used the NIC-availability route with a synthetic test value and did not display user records or change data.

For Postman evidence on the host, retry the previous URLs such as `http://localhost:5001/api/internal/users/<test-user-id>`. Expect 404 now, not 401: the internal API is no longer on that listener. Requests to host port 5011 should fail to connect because it is not published. Private authentication checks should run within an authorized backend container; do not expose the port publicly just to test it.
