// Define base types for our tool system
export interface Tool<T> {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required: readonly string[];
  };
  handler: (args: T) => Promise<InternalToolResponse>;
}

// Our internal tool response format
export interface InternalToolResponse {
  content: {
    type: string;
    text: string;
  }[];
  isError: boolean;
}

// Input types for each tool
export interface ApproveEmployeeRequestInput {
  request_number: string;
  comments?: string;
}

export interface CreateIncidentInput {
  shortDescription: string;
  caller: string;
  description?: string;
  priority?: 1 | 2 | 3 | 4;
  assignmentGroup?:
    | "Service Desk"
    | "Network Operations"
    | "Hardware Support"
    | "Application Support"
    | "Database Administration";
  assignee?: string;
  state?: "New" | "In Progress" | "On Hold" | "Resolved" | "Closed";
}
