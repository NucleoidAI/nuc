import {
  APPROVED_REQUEST,
  CREATED_ACCOUNT,
  MANAGER_EMAIL,
  NEW_EMPLOYEE,
  REQUEST_NUMBER,
  onboardingRequest,
} from "./fixtures/onboarding";
import {
  ONBOARDING_BLUEPRINT_ID,
  ONBOARDING_TEAM_ID,
  SESSION,
  TEAM_ID,
} from "./fixtures/ids";

import event from "./mocks/events";
import { mcp } from "./mocks/mcp";
import supertest from "supertest";

const recipients = () =>
  mcp
    .tool("GREY:send_email")
    .calls.map((call) => String(call.to ?? ""))
    .join(" ");

describe("Onboarding Agent", () => {
  beforeAll(() => {
    process.env.PROJECT_ID = ONBOARDING_TEAM_ID;
  });

  afterAll(() => {
    process.env.PROJECT_ID = TEAM_ID;
  });

  afterEach(event.releaseAll);

  it("creates the account, approves the ServiceNow request and notifies the manager and the employee", async () => {
    mcp
      .tool("ACTIVEDIRECTORY:create_employee")
      .expects({
        first_name: NEW_EMPLOYEE.first_name,
        last_name: NEW_EMPLOYEE.last_name,
        employee_id: NEW_EMPLOYEE.employee_id,
      })
      .returns(CREATED_ACCOUNT);

    mcp
      .tool("SERVICENOW:approve_employee_request")
      .expects({ request_number: REQUEST_NUMBER })
      .returns(APPROVED_REQUEST);

    mcp.tool("GREY:send_email").returns({
      success: true,
      messageId: "<e2e-onboarding@greycollar.test>",
    });

    await supertest(app)
      .post(`/sessions/${SESSION.onboarding}`)
      .send({ content: onboardingRequest() })
      .expect(200);

    const created = await event.waitFor(
      "TASK_CREATED",
      (payload) => payload.sessionId === SESSION.onboarding,
    );

    expect(created.blueprintId).toBe(ONBOARDING_BLUEPRINT_ID);

    const accountStep = await event.waitFor(
      "STEP_ADDED",
      (payload) =>
        payload.taskId === created.taskId &&
        payload.action === "ACTIVEDIRECTORY:create_employee",
    );

    const approvalStep = await event.waitFor(
      "STEP_ADDED",
      (payload) =>
        payload.taskId === created.taskId &&
        payload.action === "SERVICENOW:approve_employee_request",
    );

    expect(accountStep.stepId).not.toBe(approvalStep.stepId);

    const completedTask = await event.waitFor(
      "TASK_COMPLETED",
      (payload) => payload.taskId === created.taskId,
    );

    expect(completedTask.taskId).toBe(created.taskId);

    expect(mcp.tool("ACTIVEDIRECTORY:create_employee").lastCall).toMatchObject({
      employee_id: NEW_EMPLOYEE.employee_id,
    });

    expect(
      mcp.tool("SERVICENOW:approve_employee_request").lastCall,
    ).toMatchObject({ request_number: REQUEST_NUMBER });

    expect(mcp.tool("GREY:send_email").calls.length).toBeGreaterThanOrEqual(2);
    expect(recipients()).toContain(MANAGER_EMAIL);
    expect(recipients()).toContain(NEW_EMPLOYEE.email);
  }, 900_000);
});
