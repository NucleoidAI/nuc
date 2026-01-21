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
export interface AddressToolInput {
  bbk_no: string;
}

export interface InventoryToolInput {
  bbk_no: string;
}

export interface ProductManagementSystemInput {
  speed: string;
}

export interface AddressToBBKInput {
  address: string;
}

export interface PortAllocationInput {
  serial_number: string; // Device serial number
}

export interface PortConnectionInput {
  assignment_id: string; // Port assignment ID
}

export interface ConfigurationInput {
  serial_number: string; // Device serial number
}

export interface PortConnectionWithTechnicalSupportInput {
  assignment_id: string; // Port assignment ID
}
