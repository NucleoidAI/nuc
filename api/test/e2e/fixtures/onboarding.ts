const MANAGER_EMAIL = "halilcengel@greycollar.ai";

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
    requestNumber: REQUEST_NUMBER,
    firstName: NEW_EMPLOYEE.first_name,
    lastName: NEW_EMPLOYEE.last_name,
    employeeId: NEW_EMPLOYEE.employee_id,
    department: NEW_EMPLOYEE.department,
    jobRole: NEW_EMPLOYEE.job_role,
    manager: NEW_EMPLOYEE.manager,
    location: NEW_EMPLOYEE.location,
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
