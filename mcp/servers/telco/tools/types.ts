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
  device_serial_number: string; // Device serial number
  bbk_no: string; // BBK number
  port_no: string; // Port number
  speed: string; // Speed
}

export interface PortConnectionInput {
  assignment_id: string; // Port assignment ID
}

export interface ConfigurationInput {
  port_no: string; // Port number
  device_serial_number: string; // Device serial number
  hgw_serial_no: string; // HGW serial number
  device_card_no: string; // Device card number
  device_tid: string; // Device TID
  speed: string; // Speed
}

export interface PortConnectionWithTechnicalSupportInput {
  assignment_id: string; // Port assignment ID
}
