
(async () => {
  const BASE_URL = "http://localhost:5001/api/auth";

  // Use an existing TEST administrator account.
  // Set these in PowerShell before running the script.
  const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

  const timestamp = Date.now();

  const patientEmail = `regression.patient.${timestamp}@test.com`;
  const doctorEmail = `regression.doctor.${timestamp}@test.com`;
  const newAdminEmail = `regression.admin.${timestamp}@test.com`;

  const uniqueNic = String(timestamp).slice(-12).padStart(12, "1");

  let passed = 0;
  let failed = 0;

  function printResult(name, expected, actual) {
    if (expected === actual) {
      passed++;
      console.log(`PASS | ${name} | Expected ${expected} | Got ${actual}`);
    } else {
      failed++;
      console.log(`FAIL | ${name} | Expected ${expected} | Got ${actual}`);
    }
  }

  async function request(path, options = {}) {
    const response = await fetch(BASE_URL + path, options);

    let body;

    try {
      body = await response.json();
    } catch {
      body = {};
    }

    return {
      status: response.status,
      body
    };
  }

  function post(body, token) {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    };
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      "Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD before running this test."
    );
    process.exitCode = 1;
    return;
  }

  console.log("\n============================================");
  console.log("VULN-01 REGRESSION TEST");
  console.log("Hard-coded Admin Secret Fix");
  console.log("============================================\n");

  // TEST 1 - Admin registration without JWT
  let result = await request(
    "/register/admin",
    post({
      name: "Unauthorized Admin",
      email: `unauthorized.${timestamp}@test.com`,
      password: "Password123!",
      phone: "0771111111"
    })
  );

  printResult(
    "1. Admin registration without JWT",
    401,
    result.status
  );

  // TEST 2 - Patient registration
  result = await request(
    "/register/patient",
    post({
      name: "Regression Patient",
      nic: uniqueNic,
      email: patientEmail,
      password: "Password123!",
      phone: "0772222222"
    })
  );

  printResult(
    "2. Patient registration still works",
    201,
    result.status
  );

  // TEST 3 - Patient login
  result = await request(
    "/login",
    post({
      email: patientEmail,
      password: "Password123!"
    })
  );

  printResult(
    "3. Patient login still works",
    200,
    result.status
  );

  const patientToken = result.body.token;

  // TEST 4 - Patient attempts to create an admin
  if (!patientToken) {
    failed++;
    console.log("FAIL | 4. Patient token unavailable");
  } else {
    result = await request(
      "/register/admin",
      post(
        {
          name: "Patient Created Admin",
          email: `patient.admin.${timestamp}@test.com`,
          password: "Password123!",
          phone: "0773333333"
        },
        patientToken
      )
    );

    printResult(
      "4. Patient cannot create admin",
      403,
      result.status
    );
  }

  // TEST 5 - Doctor registration
  result = await request(
    "/register/doctor",
    post({
      name: "Regression Doctor",
      email: doctorEmail,
      password: "Password123!",
      phone: "0774444444"
    })
  );

  printResult(
    "5. Doctor registration still works",
    201,
    result.status
  );

  // TEST 6 - Doctor login
  result = await request(
    "/login",
    post({
      email: doctorEmail,
      password: "Password123!"
    })
  );

  printResult(
    "6. Doctor login still works",
    200,
    result.status
  );

  const doctorToken = result.body.token;

  // TEST 7 - Doctor attempts to create an admin
  if (!doctorToken) {
    failed++;
    console.log("FAIL | 7. Doctor token unavailable");
  } else {
    result = await request(
      "/register/admin",
      post(
        {
          name: "Doctor Created Admin",
          email: `doctor.admin.${timestamp}@test.com`,
          password: "Password123!",
          phone: "0775555555"
        },
        doctorToken
      )
    );

    printResult(
      "7. Doctor cannot create admin",
      403,
      result.status
    );
  }

  // TEST 8 - Existing admin login
  result = await request(
    "/login",
    post({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  );

  printResult(
    "8. Existing admin login still works",
    200,
    result.status
  );

  const adminToken = result.body.token;

  // TEST 9 - Authorized admin creates another admin
  if (!adminToken) {
    failed++;
    console.log(
      "FAIL | 9. Admin creation skipped because admin login failed"
    );
  } else {
    result = await request(
      "/register/admin",
      post(
        {
          name: "Regression Admin",
          email: newAdminEmail,
          password: "Password123!",
          phone: "0776666666"
        },
        adminToken
      )
    );

    printResult(
      "9. Authorized admin can create another admin",
      201,
      result.status
    );
  }

  console.log("\n============================================");
  console.log("REGRESSION TEST SUMMARY");
  console.log("============================================");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total : ${passed + failed}`);

  if (failed === 0) {
    console.log("\nVULN-01 REGRESSION TEST: PASS");
  } else {
    console.log("\nVULN-01 REGRESSION TEST: FAIL");
    process.exitCode = 1;
  }

})().catch((error) => {
  console.error("\nRegression test crashed:", error.message);
  process.exitCode = 1;
});
