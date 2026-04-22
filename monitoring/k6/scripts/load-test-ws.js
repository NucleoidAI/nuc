import { check } from "k6";
import http from "k6/http";

export const options = {
  scenarios: {
    load_test: {
      executor: "constant-arrival-rate",
      rate: __ENV.RATE ? parseInt(__ENV.RATE) : 10, // requests per second (use RATE env var for prod)
      timeUnit: "1s",
      duration: __ENV.DURATION || "30s",
      preAllocatedVUs: __ENV.VUS ? parseInt(__ENV.VUS) : 20,
      maxVUs: __ENV.MAX_VUS ? parseInt(__ENV.MAX_VUS) : 50,
    },
  },
  tags: {
    test_type: "load",
    environment: __ENV.ENVIRONMENT || "local",
  },
};

const BASE_URL = "http://localhost:3001";

export default function () {
  const payload = JSON.stringify({
    agentId: "00db1bd4-4829-40f2-8b99-d2e42342157e",
    content: "Hello",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer dcf0ac50d784ea9837ebf2e1a57d70d9",
    },
  };

  const res = http.post(`${BASE_URL}/test-chat`, payload, params);

  console.log(`Status: ${res.status}`);
  console.log(`Response body: ${res.body}`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  }) || console.error(`Request failed with status ${res.status}: ${res.body}`);
}
