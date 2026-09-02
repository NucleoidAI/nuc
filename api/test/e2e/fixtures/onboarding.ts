const MANAGER_EMAIL = "manager@onboarding.invalid";

const REQUEST_NUMBER = "REQ0010042";

const NEW_EMPLOYEE = {
  first_name: "Ada",
  last_name: "Lovelace",
  employee_id: "E10501",
  department: "Engineering",
  job_role: "Software Engineer",
  manager: "Halil Cengel",
  location: "Istanbul",
  email: "ada.lovelace@greycollar.ai",
};

const CREATED_ACCOUNT = {
  employee: {
    ...NEW_EMPLOYEE,
    sam_account_name: "ada.lovelace",
    user_principal_name: "ada.lovelace@greycollar.ai",
    distinguished_name: "CN=Ada Lovelace,OU=Engineering,DC=greycollar,DC=ai",
    temporary_password: "Welcome!2026",
    request_number: REQUEST_NUMBER,
  },
};

const APPROVED_REQUEST = {
  request: {
    request_number: REQUEST_NUMBER,
    state: "approved",
    approver: "Halil Cengel",
    approved_at: "2026-07-14T10:05:00.000Z",
  },
};

function onboardingRequest(): string {
  return JSON.stringify({
    intent: "onboard_employee",
    request_number: REQUEST_NUMBER,
    employee: NEW_EMPLOYEE,
  });
}

export {
  APPROVED_REQUEST,
  CREATED_ACCOUNT,
  MANAGER_EMAIL,
  NEW_EMPLOYEE,
  REQUEST_NUMBER,
  onboardingRequest,
};
