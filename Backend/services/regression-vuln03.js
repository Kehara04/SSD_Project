(async () => {
  const baseUrl = "http://localhost:5002/api/reports/doctor";

  const tests = [
    {
      label: "1. No token -> Patient A report",
      url: `${baseUrl}/${process.env.PATIENT_A_REPORT_ID}`,
      headers: {},
      expected: 401
    },
    {
      label: "2. Doctor A -> authorized Patient A report",
      url: `${baseUrl}/${process.env.PATIENT_A_REPORT_ID}`,
      headers: {
        Authorization: `Bearer ${process.env.DOCTOR_A_TOKEN}`
      },
      expected: 200
    },
    {
      label: "3. Doctor A -> unauthorized Patient B report",
      url: `${baseUrl}/${process.env.PATIENT_B_REPORT_ID}`,
      headers: {
        Authorization: `Bearer ${process.env.DOCTOR_A_TOKEN}`
      },
      expected: 403
    },
    {
      label: "4. Doctor B -> authorized Patient B report",
      url: `${baseUrl}/${process.env.PATIENT_B_REPORT_ID}`,
      headers: {
        Authorization: `Bearer ${process.env.DOCTOR_B_TOKEN}`
      },
      expected: 200
    },
    {
      label: "5. Doctor A -> unauthorized Patient B open endpoint",
      url: `${baseUrl}/${process.env.PATIENT_B_REPORT_ID}/open`,
      headers: {
        Authorization: `Bearer ${process.env.DOCTOR_A_TOKEN}`
      },
      expected: 403
    }
  ];

  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        headers: test.headers,
        redirect: "manual"
      });

      const body = await response.text();

      const result =
        response.status === test.expected
          ? "PASS"
          : "FAIL";

      console.log("\n--------------------------------");
      console.log(test.label);
      console.log("Expected:", test.expected);
      console.log("Actual:", response.status);
      console.log("Result:", result);
      console.log("Response:", body.substring(0, 300));
    } catch (error) {
      console.log("\n--------------------------------");
      console.log(test.label);
      console.log("Result: ERROR");
      console.log(error.message);
    }
  }
})().catch(console.error);