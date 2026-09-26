
(async () => {
  const URL =
    "http://localhost:5003/api/appointments/internal/69dc6d60eed6c0308693bbf0/notification";

  const validSecret = process.env.SERVICE_SECRET;

  let passed = 0;
  let failed = 0;

  function check(name, condition, details) {
    if (condition) {
      passed++;
      console.log(`PASS | ${name} | ${details}`);
    } else {
      failed++;
      console.log(`FAIL | ${name} | ${details}`);
    }
  }

  if (!validSecret) {
    console.error(
      "SERVICE_SECRET is missing. Load the appointment-service .env file."
    );
    process.exitCode = 1;
    return;
  }

  console.log("\n============================================");
  console.log("VULN-07 REGRESSION TEST");
  console.log("Sensitive Service Secret Logging Fix");
  console.log("============================================\n");

  // TEST 1 - Missing service credential
  let response = await fetch(URL);

  check(
    "1. Missing credential rejected",
    response.status === 401,
    `Expected 401 | Got ${response.status}`
  );

  // TEST 2 - Wrong service credential
  response = await fetch(URL, {
    headers: {
      "x-service-secret": "wrong-regression-secret"
    }
  });

  check(
    "2. Wrong credential rejected",
    response.status === 401,
    `Expected 401 | Got ${response.status}`
  );

  // TEST 3 - Valid service credential
  response = await fetch(URL, {
    headers: {
      "x-service-secret": validSecret
    }
  });

  check(
    "3. Valid credential accepted",
    response.status === 200,
    `Expected 200 | Got ${response.status}`
  );

  console.log("\n============================================");
  console.log("REGRESSION TEST SUMMARY");
  console.log("============================================");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total : ${passed + failed}`);

  if (failed === 0) {
    console.log("\nVULN-07 REGRESSION TEST: PASS");
  } else {
    console.log("\nVULN-07 REGRESSION TEST: FAIL");
    process.exitCode = 1;
  }

  console.log(
    "\nIMPORTANT: Also inspect the appointment-service terminal."
  );
  console.log(
    "Confirm that no incoming or expected secret values were logged."
  );

})().catch((error) => {
  console.error("\nRegression test crashed:", error.message);
  process.exitCode = 1;
});
