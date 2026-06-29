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

export interface InternalToolResponse {
  content: {
    type: string;
    text: string;
  }[];
  isError: boolean;
}

export interface FindProductInput {
  product_id?: string;
  name?: string;
}

export interface CheckProductCertificateInput {
  product_id: string;
}

export interface AssignCertificateInput {
  product_id: string;
  certificate: string;
}

export interface CreatePOInput {
  product_id: string;
  city: string;
  quantity: number;
}

export interface GetProductVendorInput {
  product_id: string;
}
