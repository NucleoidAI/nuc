import {
  APPROVED_REQUEST,
  CREATED_ACCOUNT,
  MANAGER_EMAIL,
  NEW_EMPLOYEE,
  REQUEST_NUMBER,
  onboardingRequest,
} from "./fixtures/onboarding";
import {
  ONBOARDING_AGENT_ID,
  ONBOARDING_BLUEPRINT_ID,
  SESSION,
} from "./fixtures/ids";

import event from "./mocks/events";
import { mcp } from "./mocks/mcp";

const recipients = () =>
  mcp
    .tool("GREY:send_email")
    .calls.map((call) => String(call.to ?? ""))
    .join(" ");

describe("Onboarding Agent", () => {
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

    mcp
      .tool("GREY:send_email")
      .returns({
        success: true,
        messageId: "<e2e-onboarding@greycollar.test>",
      });

    await event.publish("SESSION_USER_MESSAGED", {
      agentId: ONBOARDING_AGENT_ID,
      sessionId: SESSION.onboarding,
      content: onboardingRequest(),
    });

    const created = await event.waitFor(
      "TASK_CREATED",
      (payload) => payload.sessionId === SESSION.onboarding
    );

    expect(created.blueprintId).toBe(ONBOARDING_BLUEPRINT_ID);

    const accountStep = await event.waitFor(
      "STEP_ADDED",
      (payload) =>
        payload.taskId === created.taskId &&
        payload.action === "ACTIVEDIRECTORY:create_employee"
    );

    const approvalStep = await event.waitFor(
      "STEP_ADDED",
      (payload) =>
        payload.taskId === created.taskId &&
        payload.action === "SERVICENOW:approve_employee_request"
    );

    expect(accountStep.stepId).not.toBe(approvalStep.stepId);

    const completedTask = await event.waitFor(
      "TASK_COMPLETED",
      (payload) => payload.taskId === created.taskId
    );

    expect(completedTask.taskId).toBe(created.taskId);

    expect(mcp.tool("ACTIVEDIRECTORY:create_employee").lastCall).toMatchObject({
      employee_id: NEW_EMPLOYEE.employee_id,
    });

    expect(
      mcp.tool("SERVICENOW:approve_employee_request").lastCall
    ).toMatchObject({ request_number: REQUEST_NUMBER });

    expect(mcp.tool("GREY:send_email").calls.length).toBeGreaterThanOrEqual(2);
    expect(recipients()).toContain(MANAGER_EMAIL);
    expect(recipients()).toContain(NEW_EMPLOYEE.email);
  }, 900_000);

  it("does not approve the ServiceNow request when the Active Directory account cannot be created", async () => {
    mcp
      .tool("ACTIVEDIRECTORY:create_employee")
      .fails({
        error: "employee_id E10501 already exists in Active Directory",
      });

    mcp.tool("SERVICENOW:approve_employee_request").expectsNoCalls();

    mcp
      .tool("GREY:send_email")
      .returns({
        success: true,
        messageId: "<e2e-onboarding-2@greycollar.test>",
      });

    await event.publish("SESSION_USER_MESSAGED", {
      agentId: ONBOARDING_AGENT_ID,
      sessionId: SESSION.onboardingFailure,
      content: onboardingRequest(),
    });

    const created = await event.waitFor(
      "TASK_CREATED",
      (payload) => payload.sessionId === SESSION.onboardingFailure
    );

    expect(created.blueprintId).toBe(ONBOARDING_BLUEPRINT_ID);

    await event.waitFor(
      "STEP_ADDED",
      (payload) =>
        payload.taskId === created.taskId &&
        payload.action === "ACTIVEDIRECTORY:create_employee"
    );

    const settled = await event.waitFor(
      "STEP_FAILED",
      (payload) =>
        payload.taskId === created.taskId &&
        payload.action === "ACTIVEDIRECTORY:create_employee"
    );

    expect(String(settled.result)).toContain("already exists");
    expect(mcp.tool("SERVICENOW:approve_employee_request").calls).toHaveLength(
      0
    );
  }, 900_000);
});
