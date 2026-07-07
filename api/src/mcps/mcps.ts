const MCPs = [
  {
    id: "8f828016-dd2e-4f76-bad5-2a0ca9b71d6f",
    action: "GDRIVE:search",
    provider: "GOOGLE DRIVE",
    description: "Search for files in Google Drive",
    icon: "mdi:google-drive",
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
    icon: "mdi:slack",
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
    icon: "mdi:discord",
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
    icon: "mdi:jira",
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
    icon: "mdi:github",
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
    icon: "mdi:counter",
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
    icon: "mdi:cart-plus",
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
    icon: "mdi:counter",
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
    icon: "mdi:email-send",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "The email address of the recipient.",
          nullable: true,
        },
        subject: {
          type: "string",
          description: "The subject of the email.",
          nullable: true,
        },
        text: {
          type: "string",
          description: "The body of the email.",
          nullable: true,
        },
      },
      required: ["to", "subject", "text"],
    },
  },
  {
    id: "b7f3d8e9-4c5a-4b2d-9e8f-7a6b5c4d3e2f",
    action: "TELCO:get_address",
    provider: "TELCO",
    description: "Get address information by BBK number",
    direction: "OUTGOING",
    lib: "mcp",
    icon: "mdi:map",
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
    outputSchema: {
      type: "object",
      properties: {
        address: { type: "string" },
      },
      required: ["address"],
    },
  },
  {
    id: "e0h6g1f2-7f8d-6e5g-2h1i-0d9e8f7g6h5c",
    action: "TELCO:get_bbk_by_address",
    provider: "TELCO",
    description:
      "Get BBK number by address. Supports partial address matching.",
    direction: "OUTGOING",
    icon: "mdi:map-marker",
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
    outputSchema: {
      type: "object",
      properties: {
        bbk_no: { type: "string" },
      },
      required: ["bbk_no"],
    },
  },
  {
    id: "c8f4e9d0-5d6b-4c3e-0f9g-8b7c6d5e4f3a",
    action: "TELCO:get_inventory",
    provider: "TELCO",
    description: "Get infrastructure inventory information by BBK number",
    direction: "OUTGOING",
    lib: "mcp",
    icon: "mdi:server",
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
    outputSchema: {
      type: "object",
      properties: {
        infrastructure_type: { type: "string" },
        topology: { type: "string" },
        upstream_device_name: { type: "string" },
        upstream_device_card_no: { type: "string" },
        upstream_device_port_no: { type: "string" },
        device_serial_number: { type: "string" },
        port_available: { type: "string" },
        hgw_serial_no: { type: "string" },
      },
      required: [
        "infrastructure_type",
        "topology",
        "upstream_device_name",
        "upstream_device_card_no",
        "upstream_device_port_no",
        "device_serial_number",
        "port_available",
        "hgw_serial_no",
      ],
    },
  },
  {
    id: "d9g5f0e1-6e7c-5d4f-1g0h-9c8d7e6f5g4b",
    action: "TELCO:get_product_by_speed",
    provider: "TELCO",
    description: "Get product information by speed limit",
    direction: "OUTGOING",
    icon: "mdi:speedometer",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        speed_limit: {
          type: "string",
          description:
            "The speed limit to look up the product for (e.g., '1gbps', '100mbps', '50mbps').",
        },
      },
      required: ["speed_limit"],
    },
    outputSchema: {
      type: "object",
      properties: {
        speed_profile: { type: "string" },
        product_description: { type: "string" },
      },
      required: ["speed_profile", "product_description"],
    },
  },
  {
    id: "a1h7g2f3-8g9e-7f6h-3i2j-1e0f9g8h7i6d",
    action: "TELCO:port_allocation",
    provider: "TELCO",
    description: "Assign a port to a customer using device serial number",
    direction: "OUTGOING",
    lib: "mcp",
    icon: "mdi:link",
    inputSchema: {
      type: "object",
      properties: {
        device_serial_number: {
          type: "string",
          description: "The device serial number to assign a port for.",
        },
        bbk_no: {
          type: "string",
          description: "The BBK number to assign a port for.",
        },
        speed_limit: {
          type: "string",
          description: "The speed limit to assign a port for.",
        },
      },
      required: ["device_serial_number", "bbk_no", "speed_limit"],
    },
    outputSchema: {
      type: "object",
      properties: {
        assignment_id: { type: "string" },
        bbk_no: { type: "string" },
        customer_no: { type: "string" },
        port_no: { type: "string" },
        status: { type: "string" },
        assignment_date: { type: "string" },
        speed_limit: { type: "string" },
        device_serial_number: { type: "string" },
      },
      required: [
        "assignment_id",
        "bbk_no",
        "customer_no",
        "port_no",
        "status",
        "assignment_date",
        "speed_limit",
      ],
    },
  },
  {
    id: "b2i8h3g4-9h0f-8g7i-4j3k-2f1g0h9i8j7e",
    action: "TELCO:port_connection",
    provider: "TELCO",
    description: "Connect/activate a port using port assignment ID",
    direction: "OUTGOING",
    icon: "mdi:ethernet",
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
    outputSchema: {
      type: "object",
      properties: {
        connection_id: { type: "string" },
        status: { type: "string" },
        connection_date: { type: ["string", "null"] },
        port_status: { type: "string" },
        signal_strength: { type: ["string", "null"] },
        assignment_id: { type: "string" },
      },
      required: ["connection_id", "status", "port_status"],
    },
  },
  {
    id: "c3j9i4h5-0i1g-9h8j-5k4l-3g2h1i0j9k8f",
    action: "TELCO:configuration",
    provider: "TELCO",
    description: "Configure port settings using device serial number",
    direction: "OUTGOING",
    icon: "mdi:cog",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        device_serial_number: {
          type: "string",
          description: "The device serial number to configure.",
        },
        port_no: {
          type: "string",
          description: "The port number to configure.",
        },
        device_tid: {
          type: "string",
          description: "The device TID to configure.",
        },
        hgw_serial_no: {
          type: "string",
          description: "The HGW serial number to configure.",
        },
        device_card_no: {
          type: "string",
          description: "The device card number to configure.",
        },
        speed_limit: {
          type: "string",
          description: "The speed limit to configure.",
        },
        speed_profile: {
          type: "string",
          description: "The speed profile to configure.",
        },
      },
      required: [
        "device_serial_number",
        "port_no",
        "device_tid",
        "hgw_serial_no",
        "device_card_no",
        "speed_limit",
        "speed_profile",
      ],
    },
    outputSchema: {
      type: "object",
      properties: {
        connection_id: { type: "string" },
        vlan_id: { type: "string" },
        ip_address: { type: ["string", "null"] },
        subnet_mask: { type: ["string", "null"] },
        gateway: { type: ["string", "null"] },
        dns_primary: { type: ["string", "null"] },
        dns_secondary: { type: ["string", "null"] },
        service_profile: { type: "string" },
        qos_profile: { type: "string" },
        status: { type: "string" },
        configuration_date: { type: ["string", "null"] },
        assignment_id: { type: "string" },
      },
      required: [
        "connection_id",
        "vlan_id",
        "service_profile",
        "qos_profile",
        "status",
      ],
    },
  },
  {
    id: "a1b2c3d4-e5f6-4a1b-8001-100000000001",
    action: "ORDER:find_product",
    provider: "ORDER",
    description: "Find a product by its ID or name. Returns product details.",
    direction: "OUTGOING",
    icon: "mdi:magnify",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description: "The product ID to search for (e.g. prd-1).",
        },
        name: {
          type: "string",
          description: "The product name to search for (e.g. product-1).",
        },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description: "The ID of the found product.",
        },
        name: {
          type: "string",
          description: "The name of the found product.",
        },
      },
    },
  },
  {
    id: "a1b2c3d4-e5f6-4a1b-8002-100000000002",
    action: "ORDER:assign_certificate",
    provider: "ORDER",
    description:
      "Assign a compliance certificate to a product. Certificate must be a valid type (e.g. FFC, CE).",
    direction: "OUTGOING",
    icon: "mdi:certificate-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description: "The product ID to assign the certificate to.",
        },
        certificate: {
          type: "string",
          description: "The certificate type to assign (e.g. FFC, CE).",
          nullable: true,
        },
      },
      required: ["product_id", "certificate"],
    },
  },
  {
    id: "a1b2c3d4-e5f6-4a1b-8005-100000000005",
    action: "ORDER:get_product_vendor",
    provider: "ORDER",
    description:
      "Get the vendor information for a product by its ID. Returns vendor details including name and email.",
    direction: "OUTGOING",
    icon: "mdi:domain",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description: "The product ID to look up the vendor for (e.g. prd-1).",
        },
      },
      required: ["product_id"],
    },
  },
  {
    id: "a1b2c3d4-e5f6-4a1b-8003-100000000003",
    action: "ORDER:create_po",
    provider: "ORDER",
    description:
      "Create a Purchase Order (PO) for a product. Returns the created purchase order details.",
    direction: "OUTGOING",
    icon: "mdi:file-document-plus",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description: "The ID of the product to create the PO for.",
        },
        city: {
          type: "string",
          description: "The city where the order will be delivered.",
        },
        quantity: {
          type: "number",
          description: "The quantity of the product to order.",
        },
      },
      required: ["product_id", "city", "quantity"],
    },
  },
  {
    id: "b8f1a2c3-d4e5-4f6a-9b0c-1d2e3f4a5b6c",
    action: "GREY:knowledge_lookup",
    provider: "GREY",
    description:
      "Look up all knowledge entries for this agent. Returns every knowledge item including TEXT, QA, and DATA types. Always use this before making decisions that depend on facts that may have been updated by a supervisor, such as product certificates or policies.",
    direction: "OUTGOING",
    icon: "mdi:book-search",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    id: "d4k0j5i6-1j2h-0i9k-6l5m-4h3i2j1k0l9g",
    action: "PROJECT_NOTIFIER:notify_project_open",
    provider: "PROJECT_NOTIFIER",
    description:
      "Sends a notification to the configured endpoint when a project is opened (for testing)",
    direction: "OUTGOING",
    icon: "mdi:projector-screen",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The ID of the project being opened.",
        },
        projectName: {
          type: "string",
          description: "The name of the project being opened.",
        },
        timestamp: {
          type: "string",
          description: "ISO timestamp when the project was opened.",
        },
      },
      required: [],
    },
  },
];
export default MCPs;
