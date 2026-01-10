const Integrations = [
  {
    id: "8f828016-dd2e-4f76-bad5-2a0ca9b71d6f",
    action: "GDRIVE:search",
    provider: "GOOGLE DRIVE",
    description: "Search for files in Google Drive",
    oauth: {
      scope: "https://www.googleapis.com/auth/drive.metadata.readonly",
      tokenUrl: "https://oauth2.googleapis.com/token",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientScript: "https://accounts.google.com/gsi/client",
    },
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find files in Google Drive.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "1d49fadb-93e3-43cc-88e4-f3bfc2ea4f0e",
    action: "SLACK:search",
    provider: "SLACK",
    description: "Search for messages in Slack",
    oauth: {
      scope: "search:read",
      tokenUrl: "https://slack.com/api/oauth.v2.access",
    },
    direction: "INCOMING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to look for messages or files in Slack.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "9e35c8d5-df44-44d9-8f9e-b4f4f3b1043d",
    action: "DISCORD:search",
    provider: "DISCORD",
    description: "Search for messages in Discord",
    oauth: {
      scope: "messages.read",
      tokenUrl: "https://discord.com/api/oauth2/token",
    },
    direction: "INCOMING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Keyword to search within Discord messages.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "a0e40e76-1b2a-4a13-947f-939a9ad354b4",
    action: "JIRA:search",
    provider: "JIRA",
    description: "Search for issues in JIRA",
    oauth: {
      scope: "read:jira-work",
      tokenUrl: "https://auth.atlassian.com/oauth/token",
    },
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "JQL or text to search for issues in JIRA.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "fa1eec4e-35c0-4e0c-8b1b-36c0a4ea95ee",
    action: "GITHUB:search",
    provider: "GITHUB",
    description: "Search for repositories on GitHub",
    oauth: {
      scope: "repo",
      tokenUrl: "https://github.com/login/oauth/access_token",
    },
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to look for repositories on GitHub.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "31ea5f17-045d-47d0-b9d3-ffc5d8f7b4cb",
    action: "GREY:check_product_count",
    provider: "GREY",
    description: "Check product count",
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "The ID of the product to check the count of.",
        },
      },
      required: ["productId"],
    },
  },
  {
    id: "90627148-0d9c-405f-90a4-48be9935eb3b",
    action: "GREY:create_order",
    provider: "GREY",
    description: "Create an order",
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "The ID of the product to create an order for.",
        },
        quantity: {
          type: "number",
          description: "The quantity of the product to create an order for.",
        },
      },
      required: ["productId", "quantity"],
    },
  },
  {
    id: "f8c49eb7-a1e3-45a8-a3c7-576b8082b036",
    action: "GREY:reduce_product_count",
    provider: "GREY",
    description: "Reduce product count",
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "The ID of the product to reduce the count of.",
        },
        quantity: {
          type: "number",
          description: "The quantity of the product to reduce the count of.",
        },
      },
      required: ["productId", "quantity"],
    },
  },
  {
    id: "019ae325-2257-77df-97fa-e8808943634f",
    action: "GREY:send_email",
    provider: "GREY",
    description: "Send an email",
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "The email address of the recipient.",
        },
        subject: {
          type: "string",
          description: "The subject of the email.",
        },
        text: {
          type: "string",
          description: "The body of the email.",
        },
      },
      required: ["to", "subject", "text"],
    },
  },
  {
    id: "b7f3d8e9-4c5a-4b2d-9e8f-7a6b5c4d3e2f",
    action: "TURK_TELEKOM:get_address",
    provider: "TURK_TELEKOM",
    description: "Get address information by BBK number",
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        bbk_no: {
          type: "string",
          description: "The BBK number to look up the address for.",
        },
      },
      required: ["bbk_no"],
    },
  },
  {
    id: "e0h6g1f2-7f8d-6e5g-2h1i-0d9e8f7g6h5c",
    action: "TURK_TELEKOM:get_bbk_by_address",
    provider: "TURK_TELEKOM",
    description:
      "Get BBK number by address. Supports partial address matching.",
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description:
            "The address to look up the BBK number for. Can be a partial address.",
        },
      },
      required: ["address"],
    },
  },
  {
    id: "c8f4e9d0-5d6b-4c3e-0f9g-8b7c6d5e4f3a",
    action: "TURK_TELEKOM:get_inventory",
    provider: "TURK_TELEKOM",
    description: "Get infrastructure inventory information by BBK number",
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        bbk_no: {
          type: "string",
          description:
            "The BBK number to look up the infrastructure inventory for.",
        },
      },
      required: ["bbk_no"],
    },
  },
  {
    id: "d9g5f0e1-6e7c-5d4f-1g0h-9c8d7e6f5g4b",
    action: "TURK_TELEKOM:get_product_by_speed",
    provider: "TURK_TELEKOM",
    description: "Get product information by speed limit",
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        speed: {
          type: "string",
          description:
            "The speed limit to look up the product for (e.g., '1gbps', '100mbps', '50mbps').",
        },
      },
      required: ["hiz_limiti"],
    },
  },
  {
    id: "a1h7g2f3-8g9e-7f6h-3i2j-1e0f9g8h7i6d",
    action: "TURK_TELEKOM:port_tahsis",
    provider: "TURK_TELEKOM",
    description: "Assign a port to a customer using device serial number",
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        serial_number: {
          type: "string",
          description: "The device serial number to assign a port for.",
        },
      },
      required: ["serial_number"],
    },
  },
  {
    id: "b2i8h3g4-9h0f-8g7i-4j3k-2f1g0h9i8j7e",
    action: "TURK_TELEKOM:port_baglanti",
    provider: "TURK_TELEKOM",
    description: "Connect/activate a port using port assignment ID",
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        assignment_id: {
          type: "string",
          description: "The port assignment ID to connect/activate.",
        },
      },
      required: ["assignment_id"],
    },
  },
  {
    id: "d4k0j5i6-1j2h-0i9k-6l5m-4h3i2j1k0l9g",
    action: "TURK_TELEKOM:port_baglanti_with_technical_support",
    provider: "TURK_TELEKOM",
    description:
      "Connect/activate a port with technical support escalation using port assignment ID",
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        assignment_id: {
          type: "string",
          description:
            "The port assignment ID to connect/activate with technical support.",
        },
      },
      required: ["assignment_id"],
    },
  },
  {
    id: "c3j9i4h5-0i1g-9h8j-5k4l-3g2h1i0j9k8f",
    action: "TURK_TELEKOM:configuration",
    provider: "TURK_TELEKOM",
    description: "Configure port settings using device serial number",
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        serial_number: {
          type: "string",
          description: "The device serial number to configure.",
        },
      },
      required: ["serial_number"],
    },
  },
];
export default Integrations;
