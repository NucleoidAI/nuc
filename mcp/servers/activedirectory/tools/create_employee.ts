import { CreateEmployeeInput, Tool } from "./types";

import logger from "../../../logger/logger.js";

const AD_API_BASE_URL =
  process.env.ACTIVE_DIRECTORY_API_URL || "http://localhost:5200";

export const createEmployeeTool: Tool<CreateEmployeeInput> = {
  name: "ACTIVEDIRECTORY:create_employee",
  description:
    "Create a new employee user account in Active Directory. Returns the created employee details.",
  inputSchema: {
    type: "object",
    properties: {
      first_name: {
        type: "string",
        description: "The first name of the employee.",
      },
      last_name: {
        type: "string",
        description: "The last name of the employee.",
      },
      employee_id: {
        type: "string",
        description: "The employee ID (e.g. E10501).",
      },
      department: {
        type: "string",
        description: "The department the employee belongs to.",
      },
      job_role: {
        type: "string",
        description: "The job role of the employee (e.g. Software Engineer).",
      },
      manager: {
        type: "string",
        description: "The full name of the employee's manager.",
      },
      location: {
        type: "string",
        description: "The office location of the employee.",
      },
    },
    required: ["first_name", "last_name", "employee_id"],
  },
  handler: async (args: CreateEmployeeInput) => {
    try {
      logger.info(
        {
          tool: "ACTIVEDIRECTORY:create_employee",
          employee_id: args.employee_id,
        },
        "Creating employee in Active Directory",
      );

      const response = await fetch(`${AD_API_BASE_URL}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: args.first_name,
          lastName: args.last_name,
          employeeId: args.employee_id,
          department: args.department,
          jobRole: args.job_role,
          manager: args.manager,
          location: args.location,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.warn(
          {
            tool: "ACTIVEDIRECTORY:create_employee",
            employee_id: args.employee_id,
            status: response.status,
          },
          "Failed to create employee in Active Directory",
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: result.error || "Failed to create employee",
              }),
            },
          ],
          isError: true,
        };
      }

      logger.info(
        {
          tool: "ACTIVEDIRECTORY:create_employee",
          employee_id: args.employee_id,
        },
        "Employee created in Active Directory",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error(
        {
          tool: "ACTIVEDIRECTORY:create_employee",
          err: error instanceof Error ? error : new Error(String(error)),
          employee_id: args.employee_id,
        },
        "Failed to create employee in Active Directory",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  },
};
