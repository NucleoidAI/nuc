const MCPs = [
  {
    id: "8f828016-dd2e-4f76-bad5-2a0ca9b71d6f",
    action: "GDRIVE:search",
    label: "Google Drive",
    provider: "GDRIVE",
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
    id: "019f6a14-0000-4000-8000-000000000002",
    action: "SERVICENOW:approve_employee_request",
    provider: "SERVICENOW",
    label: "ServiceNow",
    description:
      "Approve an employee onboarding request in ServiceNow by its request number. Returns the updated request details.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        request_number: {
          type: "string",
          description:
            "The ServiceNow request number to approve (e.g. REQ0010042).",
        },
        comments: {
          type: "string",
          description: "Optional approval comments.",
          nullable: true,
        },
      },
      required: ["request_number"],
    },
  },
  {
    id: "1d49fadb-93e3-43cc-88e4-f3bfc2ea4f0e",
    action: "SLACK:search",
    label: "Slack",
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
    label: "Discord",
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
    label: "Jira",
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
    label: "GitHub",
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
    label: "Grey",
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
    label: "Grey",
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
    label: "Grey",
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
    label: "Grey",
    provider: "GREY",
    description:
      "Send an email. Prefer passing 'template' + 'data' to render a predefined, nicely formatted HTML email instead of composing 'text'/'html' manually.",
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
          description:
            "The subject of the email. Not needed when 'template' is set - the template supplies its own subject.",
          nullable: true,
        },
        text: {
          type: "string",
          description:
            "The plain-text body of the email. Not needed when 'template' is set - the template supplies its own text body.",
          nullable: true,
        },
        html: {
          type: "string",
          description:
            "The HTML body of the email. Not needed when 'template' is set.",
          nullable: true,
        },
        template: {
          type: "string",
          description:
            "Name of a predefined email template to render instead of manually composing text/html. Available: 'meeting_summary_a' (summary and highlights from the full transcript only), 'meeting_summary_b' (the same plus next steps, speaker attributed).",
          nullable: true,
        },
        data: {
          type: "object",
          description:
            "Structured data to render into the template named by 'template'. For 'meeting_summary_a': { meetingName, meetingDate, summary, highlights: [string] }. For 'meeting_summary_b': the same fields plus next_steps: [string]. The LLM judge's evaluation is not rendered into the body - it is sent as an attachment.",
          nullable: true,
        },
      },
      required: ["to"],
    },
  },
  {
    id: "b7f3d8e9-4c5a-4b2d-9e8f-7a6b5c4d3e2f",
    action: "TELCO:get_address",
    label: "Telco",
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
    label: "Telco",
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
    label: "Telco",
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
    label: "Telco",
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
    label: "Telco",
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
    label: "Telco",
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
    label: "Telco",
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
    label: "Order",
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
    label: "Order",
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
    label: "Order",
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
    label: "Order",
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
    label: "Grey",
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
    id: "019f6a14-0000-4000-8000-000000000001",
    action: "ACTIVEDIRECTORY:create_employee",
    label: "Active Directory",
    provider: "ACTIVE DIRECTORY",
    description:
      "Create a new employee user account in Active Directory. Returns the created employee details.",
    direction: "OUTGOING",
    icon: "mdi:microsoft-windows",
    lib: "mcp",
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
          nullable: true,
        },
        job_role: {
          type: "string",
          description: "The job role of the employee (e.g. Software Engineer).",
          nullable: true,
        },
        manager: {
          type: "string",
          description: "The full name of the employee's manager.",
          nullable: true,
        },
        location: {
          type: "string",
          description: "The office location of the employee.",
          nullable: true,
        },
      },
      required: ["first_name", "last_name", "employee_id"],
    },
  },
  {
    id: "019f7a30-0000-4000-8000-000000000001",
    action: "SERVICENOW:create_incident",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description:
      "Create an incident in ServiceNow. Requires a short description and the caller's name. Returns the created incident details including its incident number.",
    direction: "OUTGOING",
    icon: "mdi:alert-circle-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        shortDescription: {
          type: "string",
          description: "A short summary of the incident.",
        },
        caller: {
          type: "string",
          description: "Name of the person reporting the incident.",
        },
        description: {
          type: "string",
          description: "Detailed description of the incident.",
          nullable: true,
        },
        priority: {
          type: "number",
          enum: [1, 2, 3, 4],
          description:
            "Incident priority: 1=Critical, 2=High, 3=Moderate (default), 4=Low.",
          nullable: true,
        },
        assignmentGroup: {
          type: "string",
          enum: [
            "Service Desk",
            "Network Operations",
            "Hardware Support",
            "Application Support",
            "Database Administration",
          ],
          description:
            "Group the incident is assigned to. Defaults to 'Service Desk'.",
          nullable: true,
        },
        assignee: {
          type: "string",
          description: "Name of the person the incident is assigned to.",
          nullable: true,
        },
        state: {
          type: "string",
          enum: ["New", "In Progress", "On Hold", "Resolved", "Closed"],
          description: "Incident state. Defaults to 'New'.",
          nullable: true,
        },
      },
      required: ["shortDescription", "caller"],
    },
  },
  {
    id: "019f8b01-0000-4000-8000-000000000001",
    action: "SAP:search",
    label: "SAP",
    provider: "SAP",
    description:
      "Search for business objects (orders, invoices, materials) in SAP",
    icon: "simple-icons:sap",
    oauth: {
      scope: "openid",
      tokenUrl: process.env.SAP_TOKEN_URL,
      clientId: process.env.SAP_CLIENT_ID,
      clientSecret: process.env.SAP_CLIENT_SECRET,
      redirectUri: process.env.SAP_REDIRECT_URI,
      authUrl: process.env.SAP_AUTH_URL,
    },
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to look for business objects in SAP.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "019f8b01-0000-4000-8000-000000000002",
    action: "SALESFORCE:search",
    label: "SalesForce",
    provider: "SALESFORCE",
    description:
      "Search for records (accounts, contacts, opportunities) in Salesforce",
    icon: "mdi:salesforce",
    oauth: {
      scope: "api refresh_token",
      tokenUrl: "https://login.salesforce.com/services/oauth2/token",
      clientId: process.env.SALESFORCE_CLIENT_ID,
      clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
      redirectUri: process.env.SALESFORCE_REDIRECT_URI,
      authUrl: "https://login.salesforce.com/services/oauth2/authorize",
    },
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "SOSL or text to search for records in Salesforce.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "019f8b01-0000-4000-8000-000000000003",
    action: "SERVICENOW:search",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description:
      "Search for records (incidents, requests, tasks) in ServiceNow",
    icon: "mdi:cloud-check-outline",
    oauth: {
      scope: "useraccount",
      tokenUrl: process.env.SERVICENOW_TOKEN_URL,
      clientId: process.env.SERVICENOW_CLIENT_ID,
      clientSecret: process.env.SERVICENOW_CLIENT_SECRET,
      redirectUri: process.env.SERVICENOW_REDIRECT_URI,
      authUrl: process.env.SERVICENOW_AUTH_URL,
    },
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Text or encoded query to search for records in ServiceNow.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "019f8b01-0000-4000-8000-000000000004",
    action: "AWS:search",
    label: "AWS",
    provider: "AWS",
    description:
      "Search for AWS resources (EC2, S3, Lambda) across your account",
    icon: "mdi:aws",
    oauth: {
      scope: "openid",
      tokenUrl: process.env.AWS_TOKEN_URL,
      clientId: process.env.AWS_CLIENT_ID,
      clientSecret: process.env.AWS_CLIENT_SECRET,
      redirectUri: process.env.AWS_REDIRECT_URI,
      authUrl: process.env.AWS_AUTH_URL,
    },
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to look for resources in AWS.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "019f8b01-0000-4000-8000-000000000005",
    action: "HUBSPOT:search",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Search for records (contacts, companies, deals) in HubSpot",
    icon: "mdi:hubspot",
    oauth: {
      scope: "crm.objects.contacts.read crm.objects.deals.read",
      tokenUrl: "https://api.hubapi.com/oauth/v1/token",
      clientId: process.env.HUBSPOT_CLIENT_ID,
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
      redirectUri: process.env.HUBSPOT_REDIRECT_URI,
      authUrl: "https://app.hubspot.com/oauth/authorize",
    },
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to look for records in HubSpot.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "019f8b01-0000-4000-8000-000000000006",
    action: "ORACLE:search",
    label: "Oracle",
    provider: "ORACLE",
    description: "Search for records in Oracle Cloud applications",
    icon: "simple-icons:oracle",
    oauth: {
      scope: "openid",
      tokenUrl: process.env.ORACLE_TOKEN_URL,
      clientId: process.env.ORACLE_CLIENT_ID,
      clientSecret: process.env.ORACLE_CLIENT_SECRET,
      redirectUri: process.env.ORACLE_REDIRECT_URI,
      authUrl: process.env.ORACLE_AUTH_URL,
    },
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to look for records in Oracle.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "019f8b01-0000-4000-8000-000000000007",
    action: "MICROSOFT:search",
    label: "Microsoft",
    provider: "MICROSOFT",
    description:
      "Search across Microsoft 365 (Outlook, SharePoint, OneDrive, Teams)",
    icon: "mdi:microsoft",
    oauth: {
      scope: "https://graph.microsoft.com/.default",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI,
      authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    },
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to look across Microsoft 365 content.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "069cde56-d094-4205-9d80-45b68fe7d2ea",
    action: "MICROSOFT:send_email",
    label: "Microsoft",
    provider: "MICROSOFT",
    description:
      "Send an email through Outlook on behalf of the signed-in user.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Recipient email address.",
        },
        subject: {
          type: "string",
          description: "The email subject line.",
        },
        body: {
          type: "string",
          description: "The email body content.",
        },
        cc: {
          type: "string",
          description: "Optional CC recipient email address.",
          nullable: true,
        },
      },
      required: ["to", "subject", "body"],
    },
    outputSchema: {
      type: "object",
      properties: {
        message_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["message_id", "status"],
    },
  },
  {
    id: "47e3ceae-2a41-40de-9c0f-0e34dfb897bb",
    action: "MICROSOFT:get_email_details",
    label: "Microsoft",
    provider: "MICROSOFT",
    description:
      "Get the full content and metadata of an Outlook email by message ID.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        message_id: {
          type: "string",
          description: "The ID of the email message to retrieve.",
        },
      },
      required: ["message_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        message_id: {
          type: "string",
          description: ".",
        },
        subject: {
          type: "string",
          description: ".",
        },
        from: {
          type: "string",
          description: ".",
        },
        received_date: {
          type: "string",
          description: ".",
        },
      },
      required: ["message_id", "subject"],
    },
  },
  {
    id: "af42f446-85a7-4375-8f91-a6b0b8cecba1",
    action: "MICROSOFT:create_calendar_event",
    label: "Microsoft",
    provider: "MICROSOFT",
    description: "Create a new event on the user's Outlook calendar.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "The title of the event.",
        },
        start_time: {
          type: "string",
          description: "Start time in ISO 8601 format.",
        },
        end_time: {
          type: "string",
          description: "End time in ISO 8601 format.",
        },
        attendees: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Email addresses of attendees to invite.",
        },
      },
      required: ["subject", "start_time", "end_time"],
    },
    outputSchema: {
      type: "object",
      properties: {
        event_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["event_id", "status"],
    },
  },
  {
    id: "713c0893-6220-493e-87f8-b2cd2d81d058",
    action: "MICROSOFT:get_calendar_events",
    label: "Microsoft",
    provider: "MICROSOFT",
    description:
      "Get upcoming events on the user's calendar within a date range.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Start of the date range (YYYY-MM-DD).",
        },
        end_date: {
          type: "string",
          description: "End of the date range (YYYY-MM-DD).",
        },
      },
      required: ["start_date", "end_date"],
    },
    outputSchema: {
      type: "object",
      properties: {
        events: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["events"],
    },
  },
  {
    id: "a420d417-13af-4aaa-b37f-eb72fc365335",
    action: "MICROSOFT:update_calendar_event",
    label: "Microsoft",
    provider: "MICROSOFT",
    description:
      "Update the time, subject, or attendees of an existing calendar event.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        event_id: {
          type: "string",
          description: "The ID of the event to update.",
        },
        start_time: {
          type: "string",
          description: "New start time in ISO 8601 format.",
          nullable: true,
        },
        end_time: {
          type: "string",
          description: "New end time in ISO 8601 format.",
          nullable: true,
        },
        subject: {
          type: "string",
          description: "New event title.",
          nullable: true,
        },
      },
      required: ["event_id"],
    },
  },
  {
    id: "69721577-2cba-4e84-b0f7-51b6d7be8cb0",
    action: "MICROSOFT:cancel_calendar_event",
    label: "Microsoft",
    provider: "MICROSOFT",
    description: "Cancel an existing calendar event and notify attendees.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        event_id: {
          type: "string",
          description: "The ID of the event to cancel.",
        },
        cancellation_message: {
          type: "string",
          description:
            "Optional message to include in the cancellation notice.",
          nullable: true,
        },
      },
      required: ["event_id"],
    },
  },
  {
    id: "0a550194-99b9-469d-a20b-7eb6d9bdaf85",
    action: "MICROSOFT:create_teams_meeting",
    label: "Microsoft",
    provider: "MICROSOFT",
    description:
      "Create an online Microsoft Teams meeting and get its join link.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "The meeting title.",
        },
        start_time: {
          type: "string",
          description: "Start time in ISO 8601 format.",
        },
        end_time: {
          type: "string",
          description: "End time in ISO 8601 format.",
        },
      },
      required: ["subject", "start_time", "end_time"],
    },
    outputSchema: {
      type: "object",
      properties: {
        meeting_id: {
          type: "string",
          description: ".",
        },
        join_url: {
          type: "string",
          description: ".",
        },
      },
      required: ["meeting_id", "join_url"],
    },
  },
  {
    id: "00987828-eca3-4884-9e79-0b936b4dd6b6",
    action: "MICROSOFT:send_teams_message",
    label: "Microsoft",
    provider: "MICROSOFT",
    description: "Send a message to a Microsoft Teams channel or chat.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "The ID of the Teams channel or chat to post to.",
        },
        message: {
          type: "string",
          description: "The text content of the message.",
        },
      },
      required: ["channel_id", "message"],
    },
    outputSchema: {
      type: "object",
      properties: {
        message_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["message_id"],
    },
  },
  {
    id: "71b8481f-dec9-4206-9e1a-8c46f9a3bbf9",
    action: "MICROSOFT:get_teams_channel_messages",
    label: "Microsoft",
    provider: "MICROSOFT",
    description: "Get recent messages posted in a Teams channel.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "The ID of the Teams channel.",
        },
        limit: {
          type: "number",
          description: "Max number of messages to return.",
          nullable: true,
        },
      },
      required: ["channel_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        messages: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["messages"],
    },
  },
  {
    id: "d659c62a-678f-4727-be4a-52c332c9d9a1",
    action: "MICROSOFT:create_teams_channel",
    label: "Microsoft",
    provider: "MICROSOFT",
    description:
      "Create a new channel within an existing Microsoft Teams team.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        team_id: {
          type: "string",
          description: "The ID of the team to create the channel in.",
        },
        channel_name: {
          type: "string",
          description: "Name of the new channel.",
        },
      },
      required: ["team_id", "channel_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["channel_id"],
    },
  },
  {
    id: "580a381f-4b1d-41eb-a9e6-c3d24c0b6aad",
    action: "MICROSOFT:upload_onedrive_file",
    label: "Microsoft",
    provider: "MICROSOFT",
    description: "Upload a file to the user's OneDrive at a given folder path.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        file_name: {
          type: "string",
          description: "Name of the file to upload.",
        },
        folder_path: {
          type: "string",
          description: "Destination folder path in OneDrive.",
          nullable: true,
        },
        content_base64: {
          type: "string",
          description: "Base64-encoded file content.",
        },
      },
      required: ["file_name", "content_base64"],
    },
    outputSchema: {
      type: "object",
      properties: {
        file_id: {
          type: "string",
          description: ".",
        },
        web_url: {
          type: "string",
          description: ".",
        },
      },
      required: ["file_id"],
    },
  },
  {
    id: "b682b953-dd7a-4ae3-bbe7-79badaeefe36",
    action: "MICROSOFT:download_onedrive_file",
    label: "Microsoft",
    provider: "MICROSOFT",
    description: "Download a file from the user's OneDrive by file ID.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        file_id: {
          type: "string",
          description: "The ID of the file to download.",
        },
      },
      required: ["file_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        file_id: {
          type: "string",
          description: ".",
        },
        file_name: {
          type: "string",
          description: ".",
        },
        download_url: {
          type: "string",
          description: ".",
        },
      },
      required: ["file_id", "download_url"],
    },
  },
  {
    id: "856661d6-048f-470b-a580-72bbacecb3b6",
    action: "MICROSOFT:share_onedrive_file",
    label: "Microsoft",
    provider: "MICROSOFT",
    description:
      "Create a sharing link for a OneDrive file and optionally invite specific people.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        file_id: {
          type: "string",
          description: "The ID of the file to share.",
        },
        link_type: {
          type: "string",
          description: "The type of sharing link to create.",
          enum: ["view", "edit"],
          nullable: true,
        },
        invitee_email: {
          type: "string",
          description: "Email address to invite directly.",
          nullable: true,
        },
      },
      required: ["file_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        share_url: {
          type: "string",
          description: ".",
        },
      },
      required: ["share_url"],
    },
  },
  {
    id: "f5172228-ba21-44e0-8dab-8aa4b282ff2f",
    action: "MICROSOFT:list_onedrive_files",
    label: "Microsoft",
    provider: "MICROSOFT",
    description: "List files and folders in a given OneDrive folder path.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        folder_path: {
          type: "string",
          description:
            "The folder path to list contents of. Omit for the root folder.",
          nullable: true,
        },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["items"],
    },
  },
  {
    id: "9643f55f-151e-4af2-85a2-af19b8abb88e",
    action: "MICROSOFT:create_sharepoint_list_item",
    label: "Microsoft",
    provider: "MICROSOFT",
    description: "Create a new item in a SharePoint list.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        site_id: {
          type: "string",
          description: "The ID of the SharePoint site.",
        },
        list_id: {
          type: "string",
          description: "The ID of the list to add the item to.",
        },
        fields: {
          type: "object",
          description: "Key/value pairs of field values for the new item.",
        },
      },
      required: ["site_id", "list_id", "fields"],
    },
    outputSchema: {
      type: "object",
      properties: {
        item_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["item_id"],
    },
  },
  {
    id: "d82539a5-788b-4e56-80df-633f705f4cdc",
    action: "MICROSOFT:get_sharepoint_list_items",
    label: "Microsoft",
    provider: "MICROSOFT",
    description: "Get items from a SharePoint list, optionally filtered.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        site_id: {
          type: "string",
          description: "The ID of the SharePoint site.",
        },
        list_id: {
          type: "string",
          description: "The ID of the list to query.",
        },
        filter: {
          type: "string",
          description: "Optional OData filter expression.",
          nullable: true,
        },
      },
      required: ["site_id", "list_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["items"],
    },
  },
  {
    id: "d0c40d97-ba35-492a-926e-b7e898041169",
    action: "MICROSOFT:upload_sharepoint_document",
    label: "Microsoft",
    provider: "MICROSOFT",
    description: "Upload a document to a SharePoint document library.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        site_id: {
          type: "string",
          description: "The ID of the SharePoint site.",
        },
        library_name: {
          type: "string",
          description: "Name of the document library.",
        },
        file_name: {
          type: "string",
          description: "Name of the file to upload.",
        },
        content_base64: {
          type: "string",
          description: "Base64-encoded file content.",
        },
      },
      required: ["site_id", "library_name", "file_name", "content_base64"],
    },
    outputSchema: {
      type: "object",
      properties: {
        document_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["document_id"],
    },
  },
  {
    id: "62b27862-f39c-4700-9065-6212b653013a",
    action: "MICROSOFT:create_sharepoint_site",
    label: "Microsoft",
    provider: "MICROSOFT",
    description: "Create a new SharePoint team site.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        site_name: {
          type: "string",
          description: "Name of the new SharePoint site.",
        },
        description: {
          type: "string",
          description: "Optional description for the site.",
          nullable: true,
        },
      },
      required: ["site_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        site_id: {
          type: "string",
          description: ".",
        },
        site_url: {
          type: "string",
          description: ".",
        },
      },
      required: ["site_id", "site_url"],
    },
  },
  {
    id: "b84432f5-fbd7-4932-b305-3536b3edf199",
    action: "MICROSOFT:get_user_profile",
    label: "Microsoft",
    provider: "MICROSOFT",
    description:
      "Get Azure AD / Microsoft 365 profile details for a user by email or user ID.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        user_id_or_email: {
          type: "string",
          description: "The user's email address or Azure AD object ID.",
        },
      },
      required: ["user_id_or_email"],
    },
    outputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: ".",
        },
        display_name: {
          type: "string",
          description: ".",
        },
        job_title: {
          type: "string",
          description: ".",
        },
        department: {
          type: "string",
          description: ".",
        },
      },
      required: ["user_id", "display_name"],
    },
  },
  {
    id: "32811f6a-617c-41b5-a17e-ff29d3688f68",
    action: "MICROSOFT:create_planner_task",
    label: "Microsoft",
    provider: "MICROSOFT",
    description: "Create a new task in a Microsoft Planner plan.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        plan_id: {
          type: "string",
          description: "The ID of the Planner plan.",
        },
        title: {
          type: "string",
          description: "The title of the task.",
        },
        due_date: {
          type: "string",
          description: "Due date for the task (YYYY-MM-DD).",
          nullable: true,
        },
        assigned_to: {
          type: "string",
          description: "User ID to assign the task to.",
          nullable: true,
        },
      },
      required: ["plan_id", "title"],
    },
    outputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["task_id"],
    },
  },
  {
    id: "b0b12d2f-f822-436e-b8be-0405c1e4db85",
    action: "MICROSOFT:update_planner_task_status",
    label: "Microsoft",
    provider: "MICROSOFT",
    description:
      "Update the completion percentage or bucket of a Planner task.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "The ID of the task to update.",
        },
        percent_complete: {
          type: "number",
          description: "Completion percentage from 0 to 100.",
          nullable: true,
        },
        bucket_id: {
          type: "string",
          description: "The bucket to move the task into.",
          nullable: true,
        },
      },
      required: ["task_id"],
    },
  },
  {
    id: "8f97472e-4209-4915-b551-87e9bbb1bd18",
    action: "MICROSOFT:get_onedrive_storage_usage",
    label: "Microsoft",
    provider: "MICROSOFT",
    description:
      "Get the current storage usage and quota for the user's OneDrive.",
    direction: "OUTGOING",
    icon: "mdi:microsoft",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        used_bytes: {
          type: "number",
          description: ".",
        },
        total_bytes: {
          type: "number",
          description: ".",
        },
      },
      required: ["used_bytes", "total_bytes"],
    },
  },
  {
    id: "019f8b01-0000-4000-8000-000000000008",
    action: "ATLASSIAN:search",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description: "Search across Atlassian products (Jira, Confluence)",
    icon: "mdi:atlassian",
    oauth: {
      scope: "read:jira-work read:confluence-content.all",
      tokenUrl: "https://auth.atlassian.com/oauth/token",
      clientId: process.env.ATLASSIAN_CLIENT_ID,
      clientSecret: process.env.ATLASSIAN_CLIENT_SECRET,
      redirectUri: process.env.ATLASSIAN_REDIRECT_URI,
      authUrl: "https://auth.atlassian.com/authorize",
    },
    direction: "OUTGOING",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Text to search across Atlassian products.",
        },
      },
      required: ["query"],
    },
  },
  {
    id: "d4k0j5i6-1j2h-0i9k-6l5m-4h3i2j1k0l9g",
    action: "PROJECT_NOTIFIER:notify_project_open",
    label: "Project Notifier",
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

  // ─── New enterprise mock MCPs (15 actions each) ─────────────────────────

  {
    id: "e2b3c4d5-2000-4000-8000-000000000001",
    action: "ZENDESK:create_ticket",
    label: "Zendesk",
    provider: "ZENDESK",
    description:
      "Create a new support ticket in Zendesk. Returns the created ticket details including its ticket number.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "The subject line of the ticket.",
        },
        requester_email: {
          type: "string",
          description: "Email address of the customer requesting support.",
        },
        description: {
          type: "string",
          description: "Full description of the issue.",
          nullable: true,
        },
        priority: {
          type: "string",
          description: "Ticket priority. Defaults to 'normal'.",
          enum: ["low", "normal", "high", "urgent"],
          nullable: true,
        },
      },
      required: ["subject", "requester_email"],
    },
    outputSchema: {
      type: "object",
      properties: {
        ticket_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        created_at: {
          type: "string",
          description: ".",
        },
      },
      required: ["ticket_id", "status"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000002",
    action: "ZENDESK:update_ticket_status",
    label: "Zendesk",
    provider: "ZENDESK",
    description:
      "Update the status of an existing Zendesk ticket by its ticket ID.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        ticket_id: {
          type: "string",
          description: "The ID of the ticket to update.",
        },
        status: {
          type: "string",
          description: "The new status for the ticket.",
          enum: ["open", "pending", "on-hold", "solved", "closed"],
        },
        comment: {
          type: "string",
          description: "Optional internal comment or public reply to add.",
          nullable: true,
        },
      },
      required: ["ticket_id", "status"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000003",
    action: "ZENDESK:get_customer_tickets",
    label: "Zendesk",
    provider: "ZENDESK",
    description: "Get all tickets associated with a customer's email address.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        requester_email: {
          type: "string",
          description: "Email address of the customer to look up tickets for.",
        },
      },
      required: ["requester_email"],
    },
    outputSchema: {
      type: "object",
      properties: {
        tickets: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["tickets"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000004",
    action: "ZENDESK:add_ticket_comment",
    label: "Zendesk",
    provider: "ZENDESK",
    description: "Add a public or internal comment to an existing ticket.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        ticket_id: {
          type: "string",
          description: ".",
        },
        comment: {
          type: "string",
          description: "The comment text to add.",
        },
        public: {
          type: "boolean",
          description: "Whether the comment is visible to the customer.",
          nullable: true,
        },
      },
      required: ["ticket_id", "comment"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000005",
    action: "ZENDESK:assign_ticket",
    label: "Zendesk",
    provider: "ZENDESK",
    description: "Assign a ticket to a specific agent or group.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        ticket_id: {
          type: "string",
          description: ".",
        },
        assignee: {
          type: "string",
          description: "Name or ID of the agent to assign the ticket to.",
        },
        group: {
          type: "string",
          description: "Name of the group to assign the ticket to.",
          nullable: true,
        },
      },
      required: ["ticket_id", "assignee"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000006",
    action: "ZENDESK:merge_tickets",
    label: "Zendesk",
    provider: "ZENDESK",
    description: "Merge one or more duplicate tickets into a primary ticket.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        primary_ticket_id: {
          type: "string",
          description: "The ticket to merge others into.",
        },
        ticket_ids_to_merge: {
          type: "array",
          items: {
            type: "string",
          },
          description: "IDs of the duplicate tickets to merge.",
        },
      },
      required: ["primary_ticket_id", "ticket_ids_to_merge"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000007",
    action: "ZENDESK:get_ticket_details",
    label: "Zendesk",
    provider: "ZENDESK",
    description: "Get full details of a single ticket by its ID.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        ticket_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["ticket_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        ticket_id: {
          type: "string",
          description: ".",
        },
        subject: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        priority: {
          type: "string",
          description: ".",
        },
      },
      required: ["ticket_id", "subject", "status"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000008",
    action: "ZENDESK:create_macro",
    label: "Zendesk",
    provider: "ZENDESK",
    description:
      "Create a reusable macro that applies a predefined set of actions to tickets.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Name of the macro.",
        },
        actions: {
          type: "array",
          items: {
            type: "object",
          },
          description:
            "List of actions the macro applies (e.g. set status, add comment).",
        },
      },
      required: ["title", "actions"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000009",
    action: "ZENDESK:search_knowledge_base",
    label: "Zendesk",
    provider: "ZENDESK",
    description:
      "Search the Zendesk help center knowledge base for relevant articles.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to find relevant help center articles.",
        },
      },
      required: ["query"],
    },
    outputSchema: {
      type: "object",
      properties: {
        articles: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["articles"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000010",
    action: "ZENDESK:create_kb_article",
    label: "Zendesk",
    provider: "ZENDESK",
    description: "Create a new article in the Zendesk help center.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the article.",
        },
        body: {
          type: "string",
          description: "HTML or plain text body of the article.",
        },
        section_id: {
          type: "string",
          description: "The help center section to publish the article under.",
          nullable: true,
        },
      },
      required: ["title", "body"],
    },
    outputSchema: {
      type: "object",
      properties: {
        article_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["article_id", "status"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000011",
    action: "ZENDESK:get_customer_satisfaction_score",
    label: "Zendesk",
    provider: "ZENDESK",
    description:
      "Get the CSAT (customer satisfaction) score and rating history for a ticket or agent.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        ticket_id: {
          type: "string",
          description: "The ticket ID to look up satisfaction rating for.",
          nullable: true,
        },
        agent_id: {
          type: "string",
          description:
            "The agent ID to look up average satisfaction score for.",
          nullable: true,
        },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        csat_score: {
          type: "number",
          description: ".",
        },
        rating_count: {
          type: "number",
          description: ".",
        },
      },
      required: ["csat_score"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000012",
    action: "ZENDESK:escalate_ticket",
    label: "Zendesk",
    provider: "ZENDESK",
    description:
      "Escalate a ticket to a higher support tier or specialized team.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        ticket_id: {
          type: "string",
          description: ".",
        },
        escalation_reason: {
          type: "string",
          description: "Reason for escalating the ticket.",
        },
        escalate_to_group: {
          type: "string",
          description: "The group to escalate the ticket to.",
          nullable: true,
        },
      },
      required: ["ticket_id", "escalation_reason"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000013",
    action: "ZENDESK:close_ticket",
    label: "Zendesk",
    provider: "ZENDESK",
    description: "Close a resolved ticket, optionally with a closing comment.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        ticket_id: {
          type: "string",
          description: ".",
        },
        resolution_comment: {
          type: "string",
          description: "Closing comment summarizing the resolution.",
          nullable: true,
        },
      },
      required: ["ticket_id"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000014",
    action: "ZENDESK:get_agent_workload",
    label: "Zendesk",
    provider: "ZENDESK",
    description:
      "Get the current open ticket count and workload for a support agent.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: {
          type: "string",
          description: "The ID of the agent to check workload for.",
        },
      },
      required: ["agent_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        agent_id: {
          type: "string",
          description: ".",
        },
        open_tickets: {
          type: "number",
          description: ".",
        },
        pending_tickets: {
          type: "number",
          description: ".",
        },
      },
      required: ["agent_id", "open_tickets"],
    },
  },
  {
    id: "e2b3c4d5-2000-4000-8000-000000000015",
    action: "ZENDESK:create_customer",
    label: "Zendesk",
    provider: "ZENDESK",
    description: "Create a new customer (end-user) record in Zendesk.",
    direction: "OUTGOING",
    icon: "simple-icons:zendesk",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Full name of the customer.",
        },
        email: {
          type: "string",
          description: "Email address of the customer.",
        },
        organization: {
          type: "string",
          description: "Organization the customer belongs to.",
          nullable: true,
        },
      },
      required: ["name", "email"],
    },
    outputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["customer_id"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000001",
    action: "DOCUSIGN:create_envelope",
    label: "Docusign",
    provider: "DOCUSIGN",
    description:
      "Create and send a DocuSign envelope for signature. Returns the created envelope details including its status.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        document_name: {
          type: "string",
          description: "Name of the document being sent for signature.",
        },
        signer_email: {
          type: "string",
          description: "Email address of the signer.",
        },
        signer_name: {
          type: "string",
          description: "Full name of the signer.",
        },
        email_subject: {
          type: "string",
          description: "Subject line for the signature request email.",
          nullable: true,
        },
      },
      required: ["document_name", "signer_email", "signer_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        envelope_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        sent_date: {
          type: "string",
          description: ".",
        },
      },
      required: ["envelope_id", "status"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000002",
    action: "DOCUSIGN:get_envelope_status",
    label: "Docusign",
    provider: "DOCUSIGN",
    description:
      "Get the current status of a DocuSign envelope by its envelope ID.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        envelope_id: {
          type: "string",
          description: "The ID of the envelope to check.",
        },
      },
      required: ["envelope_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        envelope_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        completed_date: {
          type: ["string", "null"],
        },
      },
      required: ["envelope_id", "status"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000003",
    action: "DOCUSIGN:void_envelope",
    label: "Docusign",
    provider: "DOCUSIGN",
    description:
      "Void an in-progress DocuSign envelope so it can no longer be signed.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        envelope_id: {
          type: "string",
          description: "The ID of the envelope to void.",
        },
        void_reason: {
          type: "string",
          description: "Reason the envelope is being voided.",
        },
      },
      required: ["envelope_id", "void_reason"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000004",
    action: "DOCUSIGN:list_envelope_recipients",
    label: "Docusign",
    provider: "DOCUSIGN",
    description:
      "List all recipients and their signing status for an envelope.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        envelope_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["envelope_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        recipients: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["recipients"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000005",
    action: "DOCUSIGN:resend_envelope",
    label: "Docusign",
    provider: "DOCUSIGN",
    description:
      "Resend the signature request email for an envelope to recipients who haven't signed yet.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        envelope_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["envelope_id"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000006",
    action: "DOCUSIGN:download_signed_document",
    label: "Docusign",
    provider: "DOCUSIGN",
    description:
      "Download the completed, signed document for a fully executed envelope.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        envelope_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["envelope_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        document_url: {
          type: "string",
          description: ".",
        },
        file_name: {
          type: "string",
          description: ".",
        },
      },
      required: ["document_url"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000007",
    action: "DOCUSIGN:create_template",
    label: "Docusign",
    provider: "DOCUSIGN",
    description:
      "Create a reusable envelope template with predefined documents and signer roles.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        template_name: {
          type: "string",
          description: "Name of the template.",
        },
        document_name: {
          type: "string",
          description: "Name of the base document for the template.",
        },
      },
      required: ["template_name", "document_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        template_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["template_id"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000008",
    action: "DOCUSIGN:get_template",
    label: "Docusign",
    provider: "DOCUSIGN",
    description: "Get the details and roles of a saved envelope template.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        template_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["template_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        template_id: {
          type: "string",
          description: ".",
        },
        template_name: {
          type: "string",
          description: ".",
        },
        roles: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["template_id", "template_name"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000009",
    action: "DOCUSIGN:add_signer_to_envelope",
    label: "Docusign",
    provider: "DOCUSIGN",
    description:
      "Add an additional signer to an envelope that hasn't been sent yet.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        envelope_id: {
          type: "string",
          description: ".",
        },
        signer_email: {
          type: "string",
          description: ".",
        },
        signer_name: {
          type: "string",
          description: ".",
        },
        routing_order: {
          type: "number",
          description:
            "Order in which this signer should sign relative to others.",
          nullable: true,
        },
      },
      required: ["envelope_id", "signer_email", "signer_name"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000010",
    action: "DOCUSIGN:get_envelope_audit_trail",
    label: "Docusign",
    provider: "DOCUSIGN",
    description:
      "Get the full audit trail (view, sign, decline events) for an envelope.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        envelope_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["envelope_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        events: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["events"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000011",
    action: "DOCUSIGN:create_bulk_send",
    label: "Docusign",
    provider: "DOCUSIGN",
    description:
      "Send the same envelope template to a large list of recipients in one batch.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        template_id: {
          type: "string",
          description: "The template to use for the bulk send.",
        },
        recipients: {
          type: "array",
          items: {
            type: "object",
          },
          description: "List of recipient name/email pairs.",
        },
      },
      required: ["template_id", "recipients"],
    },
    outputSchema: {
      type: "object",
      properties: {
        bulk_send_batch_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["bulk_send_batch_id"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000012",
    action: "DOCUSIGN:get_bulk_send_status",
    label: "Docusign",
    provider: "DOCUSIGN",
    description: "Get the completion status of a bulk send batch.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        bulk_send_batch_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["bulk_send_batch_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        batch_id: {
          type: "string",
          description: ".",
        },
        envelopes_sent: {
          type: "number",
          description: ".",
        },
        envelopes_completed: {
          type: "number",
          description: ".",
        },
      },
      required: ["batch_id", "envelopes_sent"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000013",
    action: "DOCUSIGN:correct_envelope",
    label: "Docusign",
    provider: "DOCUSIGN",
    description:
      "Correct recipient information or document content on an envelope that has already been sent but not yet completed.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        envelope_id: {
          type: "string",
          description: ".",
        },
        corrected_signer_email: {
          type: "string",
          description: ".",
          nullable: true,
        },
        corrected_signer_name: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["envelope_id"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000014",
    action: "DOCUSIGN:delete_envelope_draft",
    label: "Docusign",
    provider: "DOCUSIGN",
    description:
      "Delete an envelope that is still in draft status and has not been sent.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        envelope_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["envelope_id"],
    },
  },
  {
    id: "e3c4d5e6-3000-4000-8000-000000000015",
    action: "DOCUSIGN:get_envelope_documents",
    label: "Docusign",
    provider: "DOCUSIGN",
    description: "List all documents attached to an envelope.",
    direction: "OUTGOING",
    icon: "simple-icons:docusign",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        envelope_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["envelope_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        documents: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["documents"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000001",
    action: "NETSUITE:create_sales_order",
    label: "Netsuite",
    provider: "NETSUITE",
    description:
      "Create a sales order in NetSuite for a customer. Returns the created sales order details.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: "The NetSuite internal ID of the customer.",
        },
        item_id: {
          type: "string",
          description: "The NetSuite internal ID of the item being ordered.",
        },
        quantity: {
          type: "number",
          description: "Quantity of the item to order.",
        },
      },
      required: ["customer_id", "item_id", "quantity"],
    },
    outputSchema: {
      type: "object",
      properties: {
        sales_order_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        total_amount: {
          type: "number",
          description: ".",
        },
      },
      required: ["sales_order_id", "status"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000002",
    action: "NETSUITE:get_inventory_level",
    label: "Netsuite",
    provider: "NETSUITE",
    description: "Get current inventory level for an item across locations.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        item_id: {
          type: "string",
          description: "The NetSuite internal ID of the item.",
        },
        location: {
          type: "string",
          description: "Warehouse or location name to filter by.",
          nullable: true,
        },
      },
      required: ["item_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        item_id: {
          type: "string",
          description: ".",
        },
        quantity_on_hand: {
          type: "number",
          description: ".",
        },
        quantity_available: {
          type: "number",
          description: ".",
        },
      },
      required: ["item_id", "quantity_on_hand", "quantity_available"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000003",
    action: "NETSUITE:create_invoice",
    label: "Netsuite",
    provider: "NETSUITE",
    description: "Create an invoice in NetSuite from an existing sales order.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        sales_order_id: {
          type: "string",
          description: "The sales order ID to invoice.",
        },
        due_date: {
          type: "string",
          description: "The invoice due date (YYYY-MM-DD).",
          nullable: true,
        },
      },
      required: ["sales_order_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        amount_due: {
          type: "number",
          description: ".",
        },
      },
      required: ["invoice_id", "status"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000004",
    action: "NETSUITE:create_purchase_order",
    label: "Netsuite",
    provider: "NETSUITE",
    description: "Create a purchase order for a vendor in NetSuite.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        vendor_id: {
          type: "string",
          description: ".",
        },
        item_id: {
          type: "string",
          description: ".",
        },
        quantity: {
          type: "number",
          description: ".",
        },
      },
      required: ["vendor_id", "item_id", "quantity"],
    },
    outputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["purchase_order_id", "status"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000005",
    action: "NETSUITE:get_customer_balance",
    label: "Netsuite",
    provider: "NETSUITE",
    description:
      "Get a customer's current outstanding balance and credit limit.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["customer_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: ".",
        },
        outstanding_balance: {
          type: "number",
          description: ".",
        },
        credit_limit: {
          type: "number",
          description: ".",
        },
      },
      required: ["customer_id", "outstanding_balance"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000006",
    action: "NETSUITE:create_customer_record",
    label: "Netsuite",
    provider: "NETSUITE",
    description: "Create a new customer record in NetSuite.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: ".",
        },
        email: {
          type: "string",
          description: ".",
        },
        terms: {
          type: "string",
          description: "Payment terms (e.g. Net 30).",
          nullable: true,
        },
      },
      required: ["company_name", "email"],
    },
    outputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["customer_id"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000007",
    action: "NETSUITE:get_item_details",
    label: "Netsuite",
    provider: "NETSUITE",
    description:
      "Get item master details including pricing and unit of measure.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        item_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["item_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        item_id: {
          type: "string",
          description: ".",
        },
        name: {
          type: "string",
          description: ".",
        },
        unit_price: {
          type: "number",
          description: ".",
        },
        unit_of_measure: {
          type: "string",
          description: ".",
        },
      },
      required: ["item_id", "name", "unit_price"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000008",
    action: "NETSUITE:create_vendor_bill",
    label: "Netsuite",
    provider: "NETSUITE",
    description: "Create a vendor bill against a purchase order.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "string",
          description: ".",
        },
        amount: {
          type: "number",
          description: ".",
        },
      },
      required: ["purchase_order_id", "amount"],
    },
    outputSchema: {
      type: "object",
      properties: {
        vendor_bill_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["vendor_bill_id", "status"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000009",
    action: "NETSUITE:get_vendor_bill_status",
    label: "Netsuite",
    provider: "NETSUITE",
    description: "Get the approval and payment status of a vendor bill.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        vendor_bill_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["vendor_bill_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        vendor_bill_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["vendor_bill_id", "status"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000010",
    action: "NETSUITE:run_financial_report",
    label: "Netsuite",
    provider: "NETSUITE",
    description:
      "Run a standard financial report (e.g. P&L, Balance Sheet) for a given period.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        report_type: {
          type: "string",
          description: "The report type to run.",
          enum: ["Profit and Loss", "Balance Sheet", "Cash Flow"],
        },
        period: {
          type: "string",
          description: "The reporting period (e.g. 2026-Q2).",
        },
      },
      required: ["report_type", "period"],
    },
    outputSchema: {
      type: "object",
      properties: {
        report_id: {
          type: "string",
          description: ".",
        },
        download_url: {
          type: "string",
          description: ".",
        },
      },
      required: ["report_id"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000011",
    action: "NETSUITE:create_journal_entry",
    label: "Netsuite",
    provider: "NETSUITE",
    description: "Create a manual journal entry across GL accounts.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        debit_account: {
          type: "string",
          description: ".",
        },
        credit_account: {
          type: "string",
          description: ".",
        },
        amount: {
          type: "number",
          description: ".",
        },
      },
      required: ["debit_account", "credit_account", "amount"],
    },
    outputSchema: {
      type: "object",
      properties: {
        journal_entry_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["journal_entry_id"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000012",
    action: "NETSUITE:get_journal_entry",
    label: "Netsuite",
    provider: "NETSUITE",
    description: "Get the details of a posted journal entry.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        journal_entry_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["journal_entry_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        journal_entry_id: {
          type: "string",
          description: ".",
        },
        amount: {
          type: "number",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["journal_entry_id", "amount"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000013",
    action: "NETSUITE:update_sales_order",
    label: "Netsuite",
    provider: "NETSUITE",
    description: "Update line items or quantities on an existing sales order.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        sales_order_id: {
          type: "string",
          description: ".",
        },
        item_id: {
          type: "string",
          description: ".",
          nullable: true,
        },
        quantity: {
          type: "number",
          description: ".",
          nullable: true,
        },
      },
      required: ["sales_order_id"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000014",
    action: "NETSUITE:get_sales_order_status",
    label: "Netsuite",
    provider: "NETSUITE",
    description: "Get the fulfillment and billing status of a sales order.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        sales_order_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["sales_order_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        sales_order_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["sales_order_id", "status"],
    },
  },
  {
    id: "e4d5e6f7-4000-4000-8000-000000000015",
    action: "NETSUITE:create_credit_memo",
    label: "Netsuite",
    provider: "NETSUITE",
    description:
      "Create a credit memo against an invoice for a return or billing correction.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
        amount: {
          type: "number",
          description: ".",
        },
      },
      required: ["invoice_id", "amount"],
    },
    outputSchema: {
      type: "object",
      properties: {
        credit_memo_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["credit_memo_id"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000001",
    action: "STRIPE:create_customer",
    label: "Stripe",
    provider: "STRIPE",
    description:
      "Create a new customer record in Stripe. Returns the created customer's ID.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "The customer's email address.",
        },
        name: {
          type: "string",
          description: "The customer's full name.",
          nullable: true,
        },
      },
      required: ["email"],
    },
    outputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: ".",
        },
        created: {
          type: "string",
          description: ".",
        },
      },
      required: ["customer_id"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000002",
    action: "STRIPE:create_charge",
    label: "Stripe",
    provider: "STRIPE",
    description:
      "Create a charge against a customer's saved payment method. Returns the charge result.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: "The Stripe customer ID to charge.",
        },
        amount: {
          type: "number",
          description:
            "Amount to charge, in the smallest currency unit (e.g. cents).",
        },
        currency: {
          type: "string",
          description: "Three-letter ISO currency code (e.g. usd).",
        },
        description: {
          type: "string",
          description: "Description shown on the charge.",
          nullable: true,
        },
      },
      required: ["customer_id", "amount", "currency"],
    },
    outputSchema: {
      type: "object",
      properties: {
        charge_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        amount: {
          type: "number",
          description: ".",
        },
      },
      required: ["charge_id", "status"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000003",
    action: "STRIPE:get_payment_status",
    label: "Stripe",
    provider: "STRIPE",
    description: "Get the status of a payment or charge by its ID.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        charge_id: {
          type: "string",
          description: "The ID of the charge to look up.",
        },
      },
      required: ["charge_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        charge_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        paid: {
          type: "boolean",
          description: ".",
        },
      },
      required: ["charge_id", "status", "paid"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000004",
    action: "STRIPE:create_subscription",
    label: "Stripe",
    provider: "STRIPE",
    description:
      "Create a recurring subscription for a customer on a given price plan.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: ".",
        },
        price_id: {
          type: "string",
          description: "The Stripe price ID for the plan.",
        },
      },
      required: ["customer_id", "price_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        subscription_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["subscription_id", "status"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000005",
    action: "STRIPE:cancel_subscription",
    label: "Stripe",
    provider: "STRIPE",
    description:
      "Cancel an active subscription, either immediately or at period end.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        subscription_id: {
          type: "string",
          description: ".",
        },
        at_period_end: {
          type: "boolean",
          description:
            "Whether to cancel at the end of the billing period rather than immediately.",
          nullable: true,
        },
      },
      required: ["subscription_id"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000006",
    action: "STRIPE:get_subscription_status",
    label: "Stripe",
    provider: "STRIPE",
    description:
      "Get the current status and next billing date of a subscription.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        subscription_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["subscription_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        subscription_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        current_period_end: {
          type: "string",
          description: ".",
        },
      },
      required: ["subscription_id", "status"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000007",
    action: "STRIPE:create_refund",
    label: "Stripe",
    provider: "STRIPE",
    description: "Issue a full or partial refund for a charge.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        charge_id: {
          type: "string",
          description: ".",
        },
        amount: {
          type: "number",
          description: "Amount to refund. Omit for a full refund.",
          nullable: true,
        },
      },
      required: ["charge_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        refund_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["refund_id", "status"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000008",
    action: "STRIPE:get_refund_status",
    label: "Stripe",
    provider: "STRIPE",
    description: "Get the status of a previously issued refund.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        refund_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["refund_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        refund_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["refund_id", "status"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000009",
    action: "STRIPE:create_invoice",
    label: "Stripe",
    provider: "STRIPE",
    description:
      "Create a one-off invoice for a customer outside of a subscription.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: ".",
        },
        amount: {
          type: "number",
          description: ".",
        },
        description: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["customer_id", "amount"],
    },
    outputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["invoice_id", "status"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000010",
    action: "STRIPE:get_invoice_status",
    label: "Stripe",
    provider: "STRIPE",
    description: "Get the payment status of an invoice.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["invoice_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["invoice_id", "status"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000011",
    action: "STRIPE:attach_payment_method",
    label: "Stripe",
    provider: "STRIPE",
    description: "Attach a payment method (card, bank account) to a customer.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: ".",
        },
        payment_method_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["customer_id", "payment_method_id"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000012",
    action: "STRIPE:list_customer_payment_methods",
    label: "Stripe",
    provider: "STRIPE",
    description: "List all payment methods saved on a customer's account.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["customer_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        payment_methods: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["payment_methods"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000013",
    action: "STRIPE:create_payout",
    label: "Stripe",
    provider: "STRIPE",
    description:
      "Trigger a payout of available balance to a connected bank account.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: ".",
        },
        currency: {
          type: "string",
          description: ".",
        },
      },
      required: ["amount", "currency"],
    },
    outputSchema: {
      type: "object",
      properties: {
        payout_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["payout_id", "status"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000014",
    action: "STRIPE:get_balance",
    label: "Stripe",
    provider: "STRIPE",
    description:
      "Get the current available and pending balance on the Stripe account.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        available: {
          type: "number",
          description: ".",
        },
        pending: {
          type: "number",
          description: ".",
        },
      },
      required: ["available", "pending"],
    },
  },
  {
    id: "e5f6a7b8-5000-4000-8000-000000000015",
    action: "STRIPE:create_coupon",
    label: "Stripe",
    provider: "STRIPE",
    description:
      "Create a discount coupon that can be applied to charges or subscriptions.",
    direction: "OUTGOING",
    icon: "simple-icons:stripe",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        percent_off: {
          type: "number",
          description: "Percentage discount the coupon applies.",
          nullable: true,
        },
        duration: {
          type: "string",
          description: "How long the coupon applies.",
          enum: ["once", "repeating", "forever"],
          nullable: true,
        },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        coupon_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["coupon_id"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000001",
    action: "SNOWFLAKE:run_query",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description:
      "Run a SQL query against a Snowflake warehouse and return the result rows.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        sql: {
          type: "string",
          description: "The SQL query to execute.",
        },
        warehouse: {
          type: "string",
          description: "The Snowflake warehouse to run the query on.",
          nullable: true,
        },
      },
      required: ["sql"],
    },
    outputSchema: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
          },
        },
        row_count: {
          type: "number",
          description: ".",
        },
        query_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["rows", "row_count"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000002",
    action: "SNOWFLAKE:get_table_schema",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description: "Get the column schema for a table in Snowflake.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "The Snowflake database name.",
        },
        schema: {
          type: "string",
          description: "The schema name within the database.",
        },
        table: {
          type: "string",
          description: "The table name to describe.",
        },
      },
      required: ["database", "schema", "table"],
    },
    outputSchema: {
      type: "object",
      properties: {
        columns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
              },
              type: {
                type: "string",
              },
              nullable: {
                type: "boolean",
              },
            },
          },
        },
      },
      required: ["columns"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000003",
    action: "SNOWFLAKE:list_tables",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description: "List all tables within a database schema.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: ".",
        },
        schema: {
          type: "string",
          description: ".",
        },
      },
      required: ["database", "schema"],
    },
    outputSchema: {
      type: "object",
      properties: {
        tables: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["tables"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000004",
    action: "SNOWFLAKE:create_table",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description: "Create a new table with a given column definition.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: ".",
        },
        schema: {
          type: "string",
          description: ".",
        },
        table: {
          type: "string",
          description: ".",
        },
        columns: {
          type: "array",
          items: {
            type: "object",
          },
          description: "Column name/type definitions.",
        },
      },
      required: ["database", "schema", "table", "columns"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000005",
    action: "SNOWFLAKE:load_data_from_stage",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description:
      "Load staged files (e.g. from S3) into a target table via COPY INTO.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        stage_name: {
          type: "string",
          description: ".",
        },
        target_table: {
          type: "string",
          description: ".",
        },
      },
      required: ["stage_name", "target_table"],
    },
    outputSchema: {
      type: "object",
      properties: {
        rows_loaded: {
          type: "number",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["rows_loaded", "status"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000006",
    action: "SNOWFLAKE:get_warehouse_status",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description:
      "Get the current running/suspended state and size of a warehouse.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        warehouse: {
          type: "string",
          description: ".",
        },
      },
      required: ["warehouse"],
    },
    outputSchema: {
      type: "object",
      properties: {
        warehouse: {
          type: "string",
          description: ".",
        },
        state: {
          type: "string",
          description: ".",
        },
        size: {
          type: "string",
          description: ".",
        },
      },
      required: ["warehouse", "state"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000007",
    action: "SNOWFLAKE:resume_warehouse",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description: "Resume a suspended warehouse so it can run queries.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        warehouse: {
          type: "string",
          description: ".",
        },
      },
      required: ["warehouse"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000008",
    action: "SNOWFLAKE:suspend_warehouse",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description: "Suspend a running warehouse to stop compute billing.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        warehouse: {
          type: "string",
          description: ".",
        },
      },
      required: ["warehouse"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000009",
    action: "SNOWFLAKE:get_query_history",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description: "Get recent query execution history for a warehouse or user.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        warehouse: {
          type: "string",
          description: ".",
          nullable: true,
        },
        user: {
          type: "string",
          description: ".",
          nullable: true,
        },
        limit: {
          type: "number",
          description: "Max number of queries to return.",
          nullable: true,
        },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        queries: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["queries"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000010",
    action: "SNOWFLAKE:cancel_query",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description: "Cancel a currently running query by its query ID.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["query_id"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000011",
    action: "SNOWFLAKE:grant_role_access",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description: "Grant a role access privileges on a database object.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        role: {
          type: "string",
          description: ".",
        },
        privilege: {
          type: "string",
          description: "The privilege to grant (e.g. SELECT, INSERT).",
        },
        object_name: {
          type: "string",
          description: "The fully qualified object name.",
        },
      },
      required: ["role", "privilege", "object_name"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000012",
    action: "SNOWFLAKE:create_view",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description: "Create a view from a SQL SELECT statement.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        view_name: {
          type: "string",
          description: ".",
        },
        select_statement: {
          type: "string",
          description: ".",
        },
      },
      required: ["view_name", "select_statement"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000013",
    action: "SNOWFLAKE:get_view_definition",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description: "Get the SQL definition of an existing view.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        view_name: {
          type: "string",
          description: ".",
        },
      },
      required: ["view_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        view_name: {
          type: "string",
          description: ".",
        },
        definition: {
          type: "string",
          description: ".",
        },
      },
      required: ["view_name", "definition"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000014",
    action: "SNOWFLAKE:clone_table",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description: "Zero-copy clone a table into a new table name.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        source_table: {
          type: "string",
          description: ".",
        },
        target_table: {
          type: "string",
          description: ".",
        },
      },
      required: ["source_table", "target_table"],
    },
  },
  {
    id: "e6a7b8c9-6000-4000-8000-000000000015",
    action: "SNOWFLAKE:get_storage_usage",
    label: "Snowflake",
    provider: "SNOWFLAKE",
    description: "Get storage usage in bytes for a database or the account.",
    direction: "OUTGOING",
    icon: "simple-icons:snowflake",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        bytes_used: {
          type: "number",
          description: ".",
        },
      },
      required: ["bytes_used"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000001",
    action: "SAP:create_purchase_requisition",
    label: "SAP",
    provider: "SAP",
    description:
      "Create a purchase requisition in SAP Ariba for a supplier item. Returns the created requisition details.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        supplier_id: {
          type: "string",
          description: "The Ariba supplier ID.",
        },
        item_description: {
          type: "string",
          description:
            "Description of the item or service being requisitioned.",
        },
        quantity: {
          type: "number",
          description: "Quantity being requisitioned.",
        },
        unit_price: {
          type: "number",
          description: "Unit price of the item.",
        },
        cost_center: {
          type: "string",
          description: "Cost center to charge the requisition to.",
          nullable: true,
        },
      },
      required: ["supplier_id", "item_description", "quantity", "unit_price"],
    },
    outputSchema: {
      type: "object",
      properties: {
        requisition_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        total_amount: {
          type: "number",
          description: ".",
        },
      },
      required: ["requisition_id", "status"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000002",
    action: "SAP:approve_requisition",
    label: "SAP",
    provider: "SAP",
    description: "Approve a pending purchase requisition by its ID.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        requisition_id: {
          type: "string",
          description: "The ID of the requisition to approve.",
        },
        approver_comments: {
          type: "string",
          description: "Optional comments from the approver.",
          nullable: true,
        },
      },
      required: ["requisition_id"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000003",
    action: "SAP:get_supplier_info",
    label: "SAP",
    provider: "SAP",
    description:
      "Get supplier profile information, including qualification and risk status, by supplier ID.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        supplier_id: {
          type: "string",
          description: "The Ariba supplier ID to look up.",
        },
      },
      required: ["supplier_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        supplier_id: {
          type: "string",
          description: ".",
        },
        name: {
          type: "string",
          description: ".",
        },
        qualification_status: {
          type: "string",
          description: ".",
        },
        risk_rating: {
          type: "string",
          description: ".",
        },
      },
      required: ["supplier_id", "name", "qualification_status"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000004",
    action: "SAP:create_purchase_order",
    label: "SAP",
    provider: "SAP",
    description:
      "Create a purchase order in Ariba from an approved requisition.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        requisition_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["requisition_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["purchase_order_id", "status"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000005",
    action: "SAP:get_purchase_order_status",
    label: "SAP",
    provider: "SAP",
    description: "Get the fulfillment status of a purchase order.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["purchase_order_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["purchase_order_id", "status"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000006",
    action: "SAP:onboard_supplier",
    label: "SAP",
    provider: "SAP",
    description: "Start the onboarding workflow for a new supplier.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        supplier_name: {
          type: "string",
          description: ".",
        },
        contact_email: {
          type: "string",
          description: ".",
        },
      },
      required: ["supplier_name", "contact_email"],
    },
    outputSchema: {
      type: "object",
      properties: {
        supplier_id: {
          type: "string",
          description: ".",
        },
        onboarding_status: {
          type: "string",
          description: ".",
        },
      },
      required: ["supplier_id", "onboarding_status"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000007",
    action: "SAP:get_supplier_risk_score",
    label: "SAP",
    provider: "SAP",
    description: "Get the current risk score and flags for a supplier.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        supplier_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["supplier_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        supplier_id: {
          type: "string",
          description: ".",
        },
        risk_score: {
          type: "number",
          description: ".",
        },
      },
      required: ["supplier_id", "risk_score"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000008",
    action: "SAP:create_rfq",
    label: "SAP",
    provider: "SAP",
    description:
      "Create a Request for Quotation (RFQ) and invite suppliers to bid.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        item_description: {
          type: "string",
          description: ".",
        },
        quantity: {
          type: "number",
          description: ".",
        },
        invited_supplier_ids: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Supplier IDs invited to bid.",
        },
      },
      required: ["item_description", "quantity", "invited_supplier_ids"],
    },
    outputSchema: {
      type: "object",
      properties: {
        rfq_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["rfq_id"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000009",
    action: "SAP:get_rfq_responses",
    label: "SAP",
    provider: "SAP",
    description: "Get all supplier bid responses submitted for an RFQ.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        rfq_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["rfq_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        responses: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["responses"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000010",
    action: "SAP:award_rfq",
    label: "SAP",
    provider: "SAP",
    description: "Award an RFQ to the winning supplier bid.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        rfq_id: {
          type: "string",
          description: ".",
        },
        winning_supplier_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["rfq_id", "winning_supplier_id"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000011",
    action: "SAP:create_contract",
    label: "SAP",
    provider: "SAP",
    description: "Create a supplier contract in Ariba Contract Management.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        supplier_id: {
          type: "string",
          description: ".",
        },
        contract_value: {
          type: "number",
          description: ".",
        },
        expiration_date: {
          type: "string",
          description: "Contract expiration date (YYYY-MM-DD).",
        },
      },
      required: ["supplier_id", "contract_value", "expiration_date"],
    },
    outputSchema: {
      type: "object",
      properties: {
        contract_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["contract_id"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000012",
    action: "SAP:get_contract_status",
    label: "SAP",
    provider: "SAP",
    description:
      "Get the current status and expiration details of a supplier contract.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        contract_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["contract_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        contract_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        expiration_date: {
          type: "string",
          description: ".",
        },
      },
      required: ["contract_id", "status"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000013",
    action: "SAP:submit_invoice",
    label: "SAP",
    provider: "SAP",
    description:
      "Submit a supplier invoice against a purchase order for reconciliation.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "string",
          description: ".",
        },
        invoice_amount: {
          type: "number",
          description: ".",
        },
      },
      required: ["purchase_order_id", "invoice_amount"],
    },
    outputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["invoice_id"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000014",
    action: "SAP:get_invoice_reconciliation_status",
    label: "SAP",
    provider: "SAP",
    description:
      "Get the three-way match (PO, receipt, invoice) reconciliation status of an invoice.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["invoice_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
        reconciliation_status: {
          type: "string",
          description: ".",
        },
      },
      required: ["invoice_id", "reconciliation_status"],
    },
  },
  {
    id: "e7b8c9d0-7000-4000-8000-000000000015",
    action: "SAP:reject_requisition",
    label: "SAP",
    provider: "SAP",
    description: "Reject a pending purchase requisition with a reason.",
    direction: "OUTGOING",
    icon: "simple-icons:sap",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        requisition_id: {
          type: "string",
          description: ".",
        },
        rejection_reason: {
          type: "string",
          description: ".",
        },
      },
      required: ["requisition_id", "rejection_reason"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000001",
    action: "TWILIO:send_sms",
    label: "Twilio",
    provider: "TWILIO",
    description: "Send an SMS message to a phone number via Twilio.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description:
            "Recipient phone number in E.164 format (e.g. +15551234567).",
        },
        body: {
          type: "string",
          description: "The text content of the message.",
        },
        from: {
          type: "string",
          description: "Sender phone number or messaging service ID.",
          nullable: true,
        },
      },
      required: ["to", "body"],
    },
    outputSchema: {
      type: "object",
      properties: {
        message_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["message_id", "status"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000002",
    action: "TWILIO:make_call",
    label: "Twilio",
    provider: "TWILIO",
    description: "Initiate an outbound voice call via Twilio.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Recipient phone number in E.164 format.",
        },
        from: {
          type: "string",
          description: "Caller phone number.",
        },
        twiml_url: {
          type: "string",
          description: "URL returning TwiML instructions for the call.",
          nullable: true,
        },
      },
      required: ["to", "from"],
    },
    outputSchema: {
      type: "object",
      properties: {
        call_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["call_id", "status"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000003",
    action: "TWILIO:get_message_status",
    label: "Twilio",
    provider: "TWILIO",
    description: "Get the delivery status of a previously sent SMS message.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        message_id: {
          type: "string",
          description: "The ID of the message to check.",
        },
      },
      required: ["message_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        message_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        error_code: {
          type: ["string", "null"],
        },
      },
      required: ["message_id", "status"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000004",
    action: "TWILIO:get_call_status",
    label: "Twilio",
    provider: "TWILIO",
    description: "Get the status and duration of a previously placed call.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        call_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["call_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        call_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        duration_seconds: {
          type: "number",
          description: ".",
        },
      },
      required: ["call_id", "status"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000005",
    action: "TWILIO:send_whatsapp_message",
    label: "Twilio",
    provider: "TWILIO",
    description:
      "Send a WhatsApp message via the Twilio WhatsApp Business API.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Recipient WhatsApp number in E.164 format.",
        },
        body: {
          type: "string",
          description: ".",
        },
      },
      required: ["to", "body"],
    },
    outputSchema: {
      type: "object",
      properties: {
        message_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["message_id", "status"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000006",
    action: "TWILIO:create_conference_call",
    label: "Twilio",
    provider: "TWILIO",
    description: "Create a conference call and dial in a list of participants.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        participants: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Phone numbers to dial into the conference.",
        },
      },
      required: ["participants"],
    },
    outputSchema: {
      type: "object",
      properties: {
        conference_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["conference_id"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000007",
    action: "TWILIO:lookup_phone_number",
    label: "Twilio",
    provider: "TWILIO",
    description:
      "Look up carrier and line type information for a phone number.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        phone_number: {
          type: "string",
          description: ".",
        },
      },
      required: ["phone_number"],
    },
    outputSchema: {
      type: "object",
      properties: {
        phone_number: {
          type: "string",
          description: ".",
        },
        carrier: {
          type: "string",
          description: ".",
        },
        line_type: {
          type: "string",
          description: ".",
        },
      },
      required: ["phone_number", "line_type"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000008",
    action: "TWILIO:send_verification_code",
    label: "Twilio",
    provider: "TWILIO",
    description:
      "Send a one-time verification code to a phone number via Twilio Verify.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: ".",
        },
        channel: {
          type: "string",
          description: "Delivery channel for the code.",
          enum: ["sms", "call", "whatsapp"],
          nullable: true,
        },
      },
      required: ["to"],
    },
    outputSchema: {
      type: "object",
      properties: {
        verification_sid: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["verification_sid", "status"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000009",
    action: "TWILIO:verify_code",
    label: "Twilio",
    provider: "TWILIO",
    description:
      "Check a user-submitted verification code against a Twilio Verify request.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: ".",
        },
        code: {
          type: "string",
          description: "The code the user submitted.",
        },
      },
      required: ["to", "code"],
    },
    outputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["status"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000010",
    action: "TWILIO:purchase_phone_number",
    label: "Twilio",
    provider: "TWILIO",
    description:
      "Purchase a new phone number from Twilio's available number inventory.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        area_code: {
          type: "string",
          description: "Desired area code for the new number.",
          nullable: true,
        },
        country: {
          type: "string",
          description: "Country code to purchase the number in.",
          nullable: true,
        },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        phone_number: {
          type: "string",
          description: ".",
        },
        sid: {
          type: "string",
          description: ".",
        },
      },
      required: ["phone_number", "sid"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000011",
    action: "TWILIO:release_phone_number",
    label: "Twilio",
    provider: "TWILIO",
    description:
      "Release (deprovision) a phone number from the Twilio account.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        sid: {
          type: "string",
          description: "The SID of the phone number to release.",
        },
      },
      required: ["sid"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000012",
    action: "TWILIO:get_call_recording",
    label: "Twilio",
    provider: "TWILIO",
    description:
      "Get the recording URL for a completed call, if recording was enabled.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        call_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["call_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        recording_url: {
          type: "string",
          description: ".",
        },
        duration_seconds: {
          type: "number",
          description: ".",
        },
      },
      required: ["recording_url"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000013",
    action: "TWILIO:send_bulk_sms",
    label: "Twilio",
    provider: "TWILIO",
    description: "Send the same SMS message to a list of recipients.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "array",
          items: {
            type: "string",
          },
          description: "List of recipient phone numbers.",
        },
        body: {
          type: "string",
          description: ".",
        },
      },
      required: ["to", "body"],
    },
    outputSchema: {
      type: "object",
      properties: {
        batch_id: {
          type: "string",
          description: ".",
        },
        recipients_count: {
          type: "number",
          description: ".",
        },
      },
      required: ["batch_id", "recipients_count"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000014",
    action: "TWILIO:create_messaging_service",
    label: "Twilio",
    provider: "TWILIO",
    description:
      "Create a messaging service to manage sender pools and delivery settings for a use case.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        friendly_name: {
          type: "string",
          description: ".",
        },
      },
      required: ["friendly_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        messaging_service_sid: {
          type: "string",
          description: ".",
        },
      },
      required: ["messaging_service_sid"],
    },
  },
  {
    id: "e8c9d0e1-8000-4000-8000-000000000015",
    action: "TWILIO:get_usage_report",
    label: "Twilio",
    provider: "TWILIO",
    description:
      "Get usage and cost totals (SMS, voice minutes) for a given period.",
    direction: "OUTGOING",
    icon: "simple-icons:twilio",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Start of the reporting period (YYYY-MM-DD).",
        },
        end_date: {
          type: "string",
          description: "End of the reporting period (YYYY-MM-DD).",
        },
      },
      required: ["start_date", "end_date"],
    },
    outputSchema: {
      type: "object",
      properties: {
        total_sms: {
          type: "number",
          description: ".",
        },
        total_call_minutes: {
          type: "number",
          description: ".",
        },
        total_cost: {
          type: "number",
          description: ".",
        },
      },
      required: ["total_sms", "total_call_minutes"],
    },
  },

  // ─── Batch 2: AWS, Oracle, HubSpot, Salesforce, ServiceNow (15-20 actions each) ───

  {
    id: "2e18b55e-e3d7-4053-9f47-e7c6fa2a468a",
    action: "AWS:stop_ec2_instance",
    label: "AWS",
    provider: "AWS",
    description: "Stop a running EC2 instance by its instance ID.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        instance_id: {
          type: "string",
          description: "The ID of the instance to stop.",
        },
      },
      required: ["instance_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        instance_id: {
          type: "string",
          description: ".",
        },
        state: {
          type: "string",
          description: ".",
        },
      },
      required: ["instance_id", "state"],
    },
  },
  {
    id: "7fb4de79-b2b8-4206-b02f-69afc5574116",
    action: "AWS:get_ec2_instance_status",
    label: "AWS",
    provider: "AWS",
    description:
      "Get the current running state and health checks for an EC2 instance.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        instance_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["instance_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        instance_id: {
          type: "string",
          description: ".",
        },
        state: {
          type: "string",
          description: ".",
        },
        status_check: {
          type: "string",
          description: ".",
        },
      },
      required: ["instance_id", "state"],
    },
  },
  {
    id: "95e752bc-dc90-42a3-9394-b2c92139bc6b",
    action: "AWS:create_s3_bucket",
    label: "AWS",
    provider: "AWS",
    description: "Create a new S3 bucket in a given region.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        bucket_name: {
          type: "string",
          description: "Globally unique name for the new bucket.",
        },
        region: {
          type: "string",
          description: "AWS region to create the bucket in.",
          nullable: true,
        },
      },
      required: ["bucket_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        bucket_name: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["bucket_name", "status"],
    },
  },
  {
    id: "4be2995c-6e1c-42c7-8436-f2d92a796a58",
    action: "AWS:upload_s3_object",
    label: "AWS",
    provider: "AWS",
    description: "Upload an object to an S3 bucket at a given key.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        bucket_name: {
          type: "string",
          description: ".",
        },
        key: {
          type: "string",
          description: "The object key (path) within the bucket.",
        },
        content_base64: {
          type: "string",
          description: "Base64-encoded content to upload.",
        },
      },
      required: ["bucket_name", "key", "content_base64"],
    },
    outputSchema: {
      type: "object",
      properties: {
        bucket_name: {
          type: "string",
          description: ".",
        },
        key: {
          type: "string",
          description: ".",
        },
        etag: {
          type: "string",
          description: ".",
        },
      },
      required: ["bucket_name", "key"],
    },
  },
  {
    id: "5270af4c-b150-4d73-a471-17ab5ae5f9c6",
    action: "AWS:get_s3_object",
    label: "AWS",
    provider: "AWS",
    description: "Retrieve an object's metadata and content from an S3 bucket.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        bucket_name: {
          type: "string",
          description: ".",
        },
        key: {
          type: "string",
          description: ".",
        },
      },
      required: ["bucket_name", "key"],
    },
    outputSchema: {
      type: "object",
      properties: {
        bucket_name: {
          type: "string",
          description: ".",
        },
        key: {
          type: "string",
          description: ".",
        },
        size_bytes: {
          type: "number",
          description: ".",
        },
      },
      required: ["bucket_name", "key"],
    },
  },
  {
    id: "6be0f6ce-1d51-404a-8feb-77d48c2cb8a8",
    action: "AWS:delete_s3_object",
    label: "AWS",
    provider: "AWS",
    description: "Delete an object from an S3 bucket.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        bucket_name: {
          type: "string",
          description: ".",
        },
        key: {
          type: "string",
          description: ".",
        },
      },
      required: ["bucket_name", "key"],
    },
  },
  {
    id: "ae010ade-f04e-4012-85d6-0e65612b1540",
    action: "AWS:invoke_lambda_function",
    label: "AWS",
    provider: "AWS",
    description: "Invoke a Lambda function synchronously with a JSON payload.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        function_name: {
          type: "string",
          description: "The name or ARN of the Lambda function.",
        },
        payload: {
          type: "object",
          description: "JSON payload to pass to the function.",
        },
      },
      required: ["function_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        status_code: {
          type: "number",
          description: ".",
        },
        response_payload: {
          type: "object",
        },
      },
      required: ["status_code"],
    },
  },
  {
    id: "d85aa595-91a2-4e5f-8dcf-abeb3c4c3c73",
    action: "AWS:get_lambda_function_logs",
    label: "AWS",
    provider: "AWS",
    description:
      "Get recent CloudWatch log entries for a Lambda function invocation.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        function_name: {
          type: "string",
          description: ".",
        },
        limit: {
          type: "number",
          description: "Max number of log entries to return.",
          nullable: true,
        },
      },
      required: ["function_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        log_entries: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["log_entries"],
    },
  },
  {
    id: "b9842ff1-7f7b-4dd1-a294-0dc9b70711ee",
    action: "AWS:create_iam_user",
    label: "AWS",
    provider: "AWS",
    description: "Create a new IAM user in the AWS account.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        user_name: {
          type: "string",
          description: "The name of the IAM user to create.",
        },
      },
      required: ["user_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        user_name: {
          type: "string",
          description: ".",
        },
        arn: {
          type: "string",
          description: ".",
        },
      },
      required: ["user_name", "arn"],
    },
  },
  {
    id: "d2c8478d-3778-446d-8769-891bc628a9d0",
    action: "AWS:attach_iam_policy",
    label: "AWS",
    provider: "AWS",
    description: "Attach a managed IAM policy to a user, group, or role.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        target_name: {
          type: "string",
          description: "The name of the user, group, or role.",
        },
        policy_arn: {
          type: "string",
          description: "The ARN of the managed policy to attach.",
        },
      },
      required: ["target_name", "policy_arn"],
    },
  },
  {
    id: "c09cdb7c-c68f-4ea8-bac0-c1cb60a7af6f",
    action: "AWS:get_billing_summary",
    label: "AWS",
    provider: "AWS",
    description:
      "Get the current month's cost and usage summary for the account.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        month: {
          type: "string",
          description: "The billing month to summarize (e.g. 2026-07).",
          nullable: true,
        },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        total_cost: {
          type: "number",
          description: ".",
        },
        currency: {
          type: "string",
          description: ".",
        },
      },
      required: ["total_cost", "currency"],
    },
  },
  {
    id: "77335a06-d204-4a77-9957-1c61fe26f4cb",
    action: "AWS:create_rds_instance",
    label: "AWS",
    provider: "AWS",
    description: "Create a new RDS database instance.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        db_instance_identifier: {
          type: "string",
          description: ".",
        },
        engine: {
          type: "string",
          description: "Database engine (e.g. postgres, mysql).",
        },
        instance_class: {
          type: "string",
          description: "The RDS instance class (e.g. db.t3.medium).",
        },
      },
      required: ["db_instance_identifier", "engine", "instance_class"],
    },
    outputSchema: {
      type: "object",
      properties: {
        db_instance_identifier: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["db_instance_identifier", "status"],
    },
  },
  {
    id: "97d1cd2f-319e-450b-a5f5-70ac8e08ca67",
    action: "AWS:get_rds_instance_status",
    label: "AWS",
    provider: "AWS",
    description: "Get the availability status of an RDS instance.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        db_instance_identifier: {
          type: "string",
          description: ".",
        },
      },
      required: ["db_instance_identifier"],
    },
    outputSchema: {
      type: "object",
      properties: {
        db_instance_identifier: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["db_instance_identifier", "status"],
    },
  },
  {
    id: "8d9008d7-cc11-473f-bbaa-9cfade9acff0",
    action: "AWS:create_cloudwatch_alarm",
    label: "AWS",
    provider: "AWS",
    description:
      "Create a CloudWatch alarm that triggers on a metric threshold.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        alarm_name: {
          type: "string",
          description: ".",
        },
        metric_name: {
          type: "string",
          description: "The CloudWatch metric to monitor.",
        },
        threshold: {
          type: "number",
          description: "The threshold value that triggers the alarm.",
        },
      },
      required: ["alarm_name", "metric_name", "threshold"],
    },
    outputSchema: {
      type: "object",
      properties: {
        alarm_name: {
          type: "string",
          description: ".",
        },
        state: {
          type: "string",
          description: ".",
        },
      },
      required: ["alarm_name", "state"],
    },
  },
  {
    id: "4c7abf64-4bd8-4931-9489-a6030d93aea0",
    action: "AWS:get_cloudwatch_metrics",
    label: "AWS",
    provider: "AWS",
    description: "Get recent datapoints for a CloudWatch metric.",
    direction: "OUTGOING",
    icon: "mdi:aws",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        metric_name: {
          type: "string",
          description: ".",
        },
        namespace: {
          type: "string",
          description: "The CloudWatch namespace (e.g. AWS/EC2).",
        },
        period_minutes: {
          type: "number",
          description: "Time window in minutes to fetch datapoints for.",
          nullable: true,
        },
      },
      required: ["metric_name", "namespace"],
    },
    outputSchema: {
      type: "object",
      properties: {
        datapoints: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["datapoints"],
    },
  },
  {
    id: "3b8ae30d-1ac3-41d2-8378-721580212e29",
    action: "ORACLE:create_purchase_order",
    label: "Oracle",
    provider: "ORACLE",
    description: "Create a purchase order in Oracle Cloud Procurement.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        supplier_id: {
          type: "string",
          description: ".",
        },
        item_description: {
          type: "string",
          description: ".",
        },
        quantity: {
          type: "number",
          description: ".",
        },
      },
      required: ["supplier_id", "item_description", "quantity"],
    },
    outputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["purchase_order_id", "status"],
    },
  },
  {
    id: "7fdaff02-a33a-4532-bc24-23ac122f23eb",
    action: "ORACLE:get_purchase_order_status",
    label: "Oracle",
    provider: "ORACLE",
    description: "Get the current status of a purchase order.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["purchase_order_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["purchase_order_id", "status"],
    },
  },
  {
    id: "c86aeaf7-9216-4be9-a9eb-73c1db8284ec",
    action: "ORACLE:create_employee_record",
    label: "Oracle",
    provider: "ORACLE",
    description: "Create a new employee record in Oracle HCM Cloud.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        first_name: {
          type: "string",
          description: ".",
        },
        last_name: {
          type: "string",
          description: ".",
        },
        department: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["first_name", "last_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        employee_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["employee_id"],
    },
  },
  {
    id: "a994c11f-05d9-4fb4-a6bf-a06277ae59ff",
    action: "ORACLE:get_employee_record",
    label: "Oracle",
    provider: "ORACLE",
    description: "Get HR record details for an employee by employee ID.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        employee_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["employee_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        employee_id: {
          type: "string",
          description: ".",
        },
        full_name: {
          type: "string",
          description: ".",
        },
        department: {
          type: "string",
          description: ".",
        },
      },
      required: ["employee_id", "full_name"],
    },
  },
  {
    id: "e083a88d-ff85-4237-b593-fde914e00786",
    action: "ORACLE:run_payroll_process",
    label: "Oracle",
    provider: "ORACLE",
    description: "Trigger a payroll processing run for a given pay period.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        pay_period: {
          type: "string",
          description: ".",
        },
      },
      required: ["pay_period"],
    },
    outputSchema: {
      type: "object",
      properties: {
        payroll_run_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["payroll_run_id", "status"],
    },
  },
  {
    id: "2c68a776-8012-489f-a5aa-2ef37e9c3fb5",
    action: "ORACLE:get_gl_journal_entries",
    label: "Oracle",
    provider: "ORACLE",
    description:
      "Get general ledger journal entries for a given accounting period.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        accounting_period: {
          type: "string",
          description: ".",
        },
      },
      required: ["accounting_period"],
    },
    outputSchema: {
      type: "object",
      properties: {
        entries: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["entries"],
    },
  },
  {
    id: "115a7a51-f6fc-4fbd-89dc-3f8cfa4ac733",
    action: "ORACLE:create_gl_journal_entry",
    label: "Oracle",
    provider: "ORACLE",
    description: "Create a manual general ledger journal entry.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        debit_account: {
          type: "string",
          description: ".",
        },
        credit_account: {
          type: "string",
          description: ".",
        },
        amount: {
          type: "number",
          description: ".",
        },
      },
      required: ["debit_account", "credit_account", "amount"],
    },
    outputSchema: {
      type: "object",
      properties: {
        journal_entry_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["journal_entry_id"],
    },
  },
  {
    id: "54c4a18f-4798-46a6-a0e2-dd25327a9210",
    action: "ORACLE:get_ar_invoice_status",
    label: "Oracle",
    provider: "ORACLE",
    description: "Get the payment status of an accounts receivable invoice.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["invoice_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["invoice_id", "status"],
    },
  },
  {
    id: "d223c8ee-53bf-4d96-bc04-0fbeadfd130c",
    action: "ORACLE:create_ar_invoice",
    label: "Oracle",
    provider: "ORACLE",
    description: "Create a new accounts receivable invoice for a customer.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: ".",
        },
        amount: {
          type: "number",
          description: ".",
        },
      },
      required: ["customer_id", "amount"],
    },
    outputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["invoice_id"],
    },
  },
  {
    id: "b397167b-4cbc-4a8c-bbdf-0718df9dcd92",
    action: "ORACLE:create_ap_invoice",
    label: "Oracle",
    provider: "ORACLE",
    description: "Create a new accounts payable invoice for a vendor.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        vendor_id: {
          type: "string",
          description: ".",
        },
        amount: {
          type: "number",
          description: ".",
        },
      },
      required: ["vendor_id", "amount"],
    },
    outputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["invoice_id"],
    },
  },
  {
    id: "e46bdd85-d62a-44df-821b-63aace286c2b",
    action: "ORACLE:get_ap_invoice_status",
    label: "Oracle",
    provider: "ORACLE",
    description:
      "Get the approval and payment status of an accounts payable invoice.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["invoice_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["invoice_id", "status"],
    },
  },
  {
    id: "0e6a34f1-0065-49aa-8894-9dd45b5ed8d6",
    action: "ORACLE:create_sales_order",
    label: "Oracle",
    provider: "ORACLE",
    description: "Create a sales order in Oracle Cloud SCM.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: ".",
        },
        item_id: {
          type: "string",
          description: ".",
        },
        quantity: {
          type: "number",
          description: ".",
        },
      },
      required: ["customer_id", "item_id", "quantity"],
    },
    outputSchema: {
      type: "object",
      properties: {
        sales_order_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["sales_order_id"],
    },
  },
  {
    id: "064b0daa-5615-47b6-8715-9f9de98dc616",
    action: "ORACLE:get_inventory_balance",
    label: "Oracle",
    provider: "ORACLE",
    description: "Get on-hand inventory balance for an item at a warehouse.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        item_id: {
          type: "string",
          description: ".",
        },
        warehouse: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["item_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        item_id: {
          type: "string",
          description: ".",
        },
        quantity_on_hand: {
          type: "number",
          description: ".",
        },
      },
      required: ["item_id", "quantity_on_hand"],
    },
  },
  {
    id: "5683c6e6-f687-403f-8ef7-dcd54d8bcc01",
    action: "ORACLE:create_expense_report",
    label: "Oracle",
    provider: "ORACLE",
    description: "Create a new expense report for an employee.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        employee_id: {
          type: "string",
          description: ".",
        },
        total_amount: {
          type: "number",
          description: ".",
        },
      },
      required: ["employee_id", "total_amount"],
    },
    outputSchema: {
      type: "object",
      properties: {
        expense_report_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["expense_report_id"],
    },
  },
  {
    id: "67c2cab9-6370-45e1-b672-efef48339b56",
    action: "ORACLE:approve_expense_report",
    label: "Oracle",
    provider: "ORACLE",
    description: "Approve a submitted expense report.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        expense_report_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["expense_report_id"],
    },
  },
  {
    id: "ec0730e3-8b1d-4a0a-8f3e-333a69d06f35",
    action: "ORACLE:get_financial_period_status",
    label: "Oracle",
    provider: "ORACLE",
    description: "Get whether a financial accounting period is open or closed.",
    direction: "OUTGOING",
    icon: "simple-icons:oracle",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        accounting_period: {
          type: "string",
          description: ".",
        },
      },
      required: ["accounting_period"],
    },
    outputSchema: {
      type: "object",
      properties: {
        accounting_period: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["accounting_period", "status"],
    },
  },
  {
    id: "aaafe618-55dc-4119-b888-3afb84c0f3e5",
    action: "HUBSPOT:create_contact",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Create a new contact record in HubSpot.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: ".",
        },
        first_name: {
          type: "string",
          description: ".",
          nullable: true,
        },
        last_name: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["email"],
    },
    outputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["contact_id"],
    },
  },
  {
    id: "6b105cf2-54e6-43d5-bd89-099536bf59d2",
    action: "HUBSPOT:update_contact",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Update properties on an existing contact record.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "string",
          description: ".",
        },
        properties: {
          type: "object",
          description: "Key/value pairs of properties to update.",
        },
      },
      required: ["contact_id", "properties"],
    },
  },
  {
    id: "834e92a9-179f-4bee-965e-5eb4afa1b278",
    action: "HUBSPOT:get_contact_details",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Get full property details for a contact by ID.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["contact_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "string",
          description: ".",
        },
        email: {
          type: "string",
          description: ".",
        },
        lifecycle_stage: {
          type: "string",
          description: ".",
        },
      },
      required: ["contact_id", "email"],
    },
  },
  {
    id: "a531aadc-f989-463e-886f-7276f3f0ba1f",
    action: "HUBSPOT:create_company",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Create a new company record in HubSpot.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: ".",
        },
        domain: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        company_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["company_id"],
    },
  },
  {
    id: "0f4f560b-24b1-4719-8cd2-62ef806347ff",
    action: "HUBSPOT:create_deal",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Create a new deal in a sales pipeline.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        deal_name: {
          type: "string",
          description: ".",
        },
        amount: {
          type: "number",
          description: ".",
          nullable: true,
        },
        pipeline_stage: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["deal_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        deal_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["deal_id"],
    },
  },
  {
    id: "bbd4cdfe-1f71-49b1-8e5a-89336c25dbc5",
    action: "HUBSPOT:update_deal_stage",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Move a deal to a new pipeline stage.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        deal_id: {
          type: "string",
          description: ".",
        },
        new_stage: {
          type: "string",
          description: ".",
        },
      },
      required: ["deal_id", "new_stage"],
    },
  },
  {
    id: "3e341d27-620c-48a7-9695-67911f83c006",
    action: "HUBSPOT:get_deal_details",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Get details of a deal including amount and stage.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        deal_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["deal_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        deal_id: {
          type: "string",
          description: ".",
        },
        amount: {
          type: "number",
          description: ".",
        },
        stage: {
          type: "string",
          description: ".",
        },
      },
      required: ["deal_id", "stage"],
    },
  },
  {
    id: "22d1c794-4a7d-44d0-a02e-f18ff5c9293e",
    action: "HUBSPOT:create_task",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Create a follow-up task associated with a contact or deal.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: ".",
        },
        due_date: {
          type: "string",
          description: ".",
          nullable: true,
        },
        associated_contact_id: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["title"],
    },
    outputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["task_id"],
    },
  },
  {
    id: "2cbd6486-f7e5-4127-b821-ce91c3123271",
    action: "HUBSPOT:log_email_activity",
    label: "HubSpot",
    provider: "HUBSPOT",
    description:
      "Log a sent or received email activity on a contact's timeline.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "string",
          description: ".",
        },
        subject: {
          type: "string",
          description: ".",
        },
        direction: {
          type: "string",
          description: "Whether the email was sent or received.",
          enum: ["EMAIL_SENT", "EMAIL_RECEIVED"],
          nullable: true,
        },
      },
      required: ["contact_id", "subject"],
    },
  },
  {
    id: "6d9abdf2-c11e-4b97-b1df-4d1b012bb587",
    action: "HUBSPOT:create_marketing_email",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Create a new marketing email in HubSpot's email tool.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: ".",
        },
        content_html: {
          type: "string",
          description: ".",
        },
      },
      required: ["subject", "content_html"],
    },
    outputSchema: {
      type: "object",
      properties: {
        email_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["email_id"],
    },
  },
  {
    id: "c39e60e0-fc8c-4f1e-afdc-570349048be9",
    action: "HUBSPOT:get_email_campaign_stats",
    label: "HubSpot",
    provider: "HUBSPOT",
    description:
      "Get open, click, and bounce statistics for a marketing email campaign.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        email_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["email_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        opens: {
          type: "number",
          description: ".",
        },
        clicks: {
          type: "number",
          description: ".",
        },
        bounces: {
          type: "number",
          description: ".",
        },
      },
      required: ["opens", "clicks"],
    },
  },
  {
    id: "24a27fa8-7b5b-4926-b862-6db086974caa",
    action: "HUBSPOT:create_form",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Create a new lead capture form.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        form_name: {
          type: "string",
          description: ".",
        },
      },
      required: ["form_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        form_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["form_id"],
    },
  },
  {
    id: "57b6d9f5-c326-4282-af4e-d26274e49962",
    action: "HUBSPOT:get_form_submissions",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Get recent submissions for a given form.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        form_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["form_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        submissions: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["submissions"],
    },
  },
  {
    id: "0b9f8e8d-7227-44a5-b42d-253a1511b365",
    action: "HUBSPOT:enroll_contact_in_workflow",
    label: "HubSpot",
    provider: "HUBSPOT",
    description:
      "Enroll a contact in an automated marketing or sales workflow.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "string",
          description: ".",
        },
        workflow_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["contact_id", "workflow_id"],
    },
  },
  {
    id: "5238aafb-9a81-404d-bdf6-90054cb110b9",
    action: "HUBSPOT:create_ticket",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Create a support ticket in HubSpot's Service Hub.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: ".",
        },
        contact_id: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["subject"],
    },
    outputSchema: {
      type: "object",
      properties: {
        ticket_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["ticket_id"],
    },
  },
  {
    id: "949b12af-965d-4fd7-a18f-ca1528d8fa80",
    action: "HUBSPOT:get_pipeline_summary",
    label: "HubSpot",
    provider: "HUBSPOT",
    description: "Get a summary of open deal value grouped by pipeline stage.",
    direction: "OUTGOING",
    icon: "mdi:hubspot",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        pipeline_id: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        stages: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["stages"],
    },
  },
  {
    id: "58ba208b-2438-48e8-99b8-8a7655116d87",
    action: "SALESFORCE:create_lead",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Create a new lead record in Salesforce.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        first_name: {
          type: "string",
          description: ".",
          nullable: true,
        },
        last_name: {
          type: "string",
          description: ".",
        },
        company: {
          type: "string",
          description: ".",
        },
      },
      required: ["last_name", "company"],
    },
    outputSchema: {
      type: "object",
      properties: {
        lead_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["lead_id"],
    },
  },
  {
    id: "f8bb9460-65da-4637-8e92-efd8a9aabc1f",
    action: "SALESFORCE:convert_lead",
    label: "SalesForce",
    provider: "SALESFORCE",
    description:
      "Convert a qualified lead into an account, contact, and opportunity.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        lead_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["lead_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        account_id: {
          type: "string",
          description: ".",
        },
        contact_id: {
          type: "string",
          description: ".",
        },
        opportunity_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["account_id", "contact_id"],
    },
  },
  {
    id: "67160372-c720-46c4-a0b3-775064d5d83d",
    action: "SALESFORCE:create_account",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Create a new account (company) record.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: ".",
        },
      },
      required: ["name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        account_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["account_id"],
    },
  },
  {
    id: "af692126-a39c-4f84-b3db-d0d9d1e4ac57",
    action: "SALESFORCE:create_contact",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Create a new contact record associated with an account.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        first_name: {
          type: "string",
          description: ".",
          nullable: true,
        },
        last_name: {
          type: "string",
          description: ".",
        },
        account_id: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["last_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["contact_id"],
    },
  },
  {
    id: "8ba807ba-f711-4da8-b9fd-d7e2179183ee",
    action: "SALESFORCE:create_case",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Create a new support case for a customer.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: ".",
        },
        contact_id: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["subject"],
    },
    outputSchema: {
      type: "object",
      properties: {
        case_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["case_id"],
    },
  },
  {
    id: "68ac14f5-de20-4f32-b032-3fdff9322717",
    action: "SALESFORCE:update_case_status",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Update the status of an existing support case.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        case_id: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["case_id", "status"],
    },
  },
  {
    id: "555ce9a4-b1e2-438b-92a6-69cae8b4298e",
    action: "SALESFORCE:get_case_details",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Get full details of a support case.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        case_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["case_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        case_id: {
          type: "string",
          description: ".",
        },
        subject: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["case_id", "status"],
    },
  },
  {
    id: "ac62e546-7274-440b-b105-aed19fbfefd5",
    action: "SALESFORCE:create_campaign",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Create a new marketing campaign record.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        campaign_name: {
          type: "string",
          description: ".",
        },
      },
      required: ["campaign_name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        campaign_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["campaign_id"],
    },
  },
  {
    id: "11894e59-3966-450d-ac2d-3e65ee574a82",
    action: "SALESFORCE:add_lead_to_campaign",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Add a lead as a member of a campaign.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: {
          type: "string",
          description: ".",
        },
        lead_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["campaign_id", "lead_id"],
    },
  },
  {
    id: "21f46206-dc5d-443c-9c96-e2620bcf9e84",
    action: "SALESFORCE:create_task",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Create a follow-up task associated with a record.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: ".",
        },
        related_to_id: {
          type: "string",
          description: ".",
          nullable: true,
        },
        due_date: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["subject"],
    },
    outputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["task_id"],
    },
  },
  {
    id: "da2e4509-3cf7-425e-af80-f663adf245a2",
    action: "SALESFORCE:log_activity",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Log a call or meeting activity on a record's timeline.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        related_to_id: {
          type: "string",
          description: ".",
        },
        activity_type: {
          type: "string",
          description: ".",
          enum: ["Call", "Meeting", "Email"],
        },
        notes: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["related_to_id", "activity_type"],
    },
  },
  {
    id: "2a85d2cb-bf70-43fe-9297-be64971bd4c3",
    action: "SALESFORCE:run_report",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Run a saved Salesforce report and return summary results.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        report_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["report_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        report_id: {
          type: "string",
          description: ".",
        },
        row_count: {
          type: "number",
          description: ".",
        },
      },
      required: ["report_id", "row_count"],
    },
  },
  {
    id: "fdf01a03-6a2b-4f87-8857-67fd24d6f51d",
    action: "SALESFORCE:get_forecast_summary",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Get the current sales forecast summary for a period.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: ".",
        },
      },
      required: ["period"],
    },
    outputSchema: {
      type: "object",
      properties: {
        forecast_amount: {
          type: "number",
          description: ".",
        },
      },
      required: ["forecast_amount"],
    },
  },
  {
    id: "4cae696d-0228-4c08-bd19-7643fbf340a8",
    action: "SALESFORCE:create_quote",
    label: "SalesForce",
    provider: "SALESFORCE",
    description: "Create a price quote associated with an opportunity.",
    direction: "OUTGOING",
    icon: "mdi:salesforce",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        opportunity_id: {
          type: "string",
          description: ".",
        },
        total_amount: {
          type: "number",
          description: ".",
          nullable: true,
        },
      },
      required: ["opportunity_id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    id: "4dd4ac37-87b6-479f-b765-8b7107bc1597",
    action: "SERVICENOW:update_incident_status",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description: "Update the state of an existing incident.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        incident_number: {
          type: "string",
          description: ".",
        },
        state: {
          type: "string",
          description: ".",
          enum: ["New", "In Progress", "On Hold", "Resolved", "Closed"],
        },
      },
      required: ["incident_number", "state"],
    },
  },
  {
    id: "9f720004-01b1-49c4-9973-c6ea17ce9a5d",
    action: "SERVICENOW:get_incident_details",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description: "Get full details of an incident by its incident number.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        incident_number: {
          type: "string",
          description: ".",
        },
      },
      required: ["incident_number"],
    },
    outputSchema: {
      type: "object",
      properties: {
        incident_number: {
          type: "string",
          description: ".",
        },
        short_description: {
          type: "string",
          description: ".",
        },
        state: {
          type: "string",
          description: ".",
        },
      },
      required: ["incident_number", "state"],
    },
  },
  {
    id: "1ffc814f-67f4-4eeb-a9ed-04716b3c73b2",
    action: "SERVICENOW:create_change_request",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description:
      "Create a change request for a planned infrastructure or application change.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        short_description: {
          type: "string",
          description: ".",
        },
        requested_by: {
          type: "string",
          description: ".",
        },
      },
      required: ["short_description", "requested_by"],
    },
    outputSchema: {
      type: "object",
      properties: {
        change_number: {
          type: "string",
          description: ".",
        },
      },
      required: ["change_number"],
    },
  },
  {
    id: "9bfa0246-f417-462c-8fe1-66f50528ec17",
    action: "SERVICENOW:approve_change_request",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description: "Approve a pending change request by its change number.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        change_number: {
          type: "string",
          description: ".",
        },
      },
      required: ["change_number"],
    },
  },
  {
    id: "ff0cad2d-90d7-4032-8955-7159eb270f9c",
    action: "SERVICENOW:create_problem_record",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description: "Create a problem record for root-cause investigation.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        short_description: {
          type: "string",
          description: ".",
        },
      },
      required: ["short_description"],
    },
    outputSchema: {
      type: "object",
      properties: {
        problem_number: {
          type: "string",
          description: ".",
        },
      },
      required: ["problem_number"],
    },
  },
  {
    id: "dc31af0c-87d4-49b4-a9ba-415da718ab70",
    action: "SERVICENOW:link_problem_to_incident",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description: "Link an existing problem record to a related incident.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        problem_number: {
          type: "string",
          description: ".",
        },
        incident_number: {
          type: "string",
          description: ".",
        },
      },
      required: ["problem_number", "incident_number"],
    },
  },
  {
    id: "c286c661-be8d-4b8d-afa2-1e56a7f31f09",
    action: "SERVICENOW:create_catalog_request",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description:
      "Submit a request from the service catalog (e.g. new laptop, software access).",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        catalog_item: {
          type: "string",
          description: ".",
        },
        requested_by: {
          type: "string",
          description: ".",
        },
      },
      required: ["catalog_item", "requested_by"],
    },
    outputSchema: {
      type: "object",
      properties: {
        request_number: {
          type: "string",
          description: ".",
        },
      },
      required: ["request_number"],
    },
  },
  {
    id: "8abfa539-094c-4f29-9778-885b769ab8b5",
    action: "SERVICENOW:get_catalog_request_status",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description: "Get the fulfillment status of a service catalog request.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        request_number: {
          type: "string",
          description: ".",
        },
      },
      required: ["request_number"],
    },
    outputSchema: {
      type: "object",
      properties: {
        request_number: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
      },
      required: ["request_number", "status"],
    },
  },
  {
    id: "8c970c64-47fd-49f1-8e97-2097d1547195",
    action: "SERVICENOW:create_knowledge_article",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description: "Create a new knowledge base article.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: ".",
        },
        body: {
          type: "string",
          description: ".",
        },
      },
      required: ["title", "body"],
    },
    outputSchema: {
      type: "object",
      properties: {
        article_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["article_id"],
    },
  },
  {
    id: "dc3c023e-c98d-4e10-950b-0fbfabb18d7b",
    action: "SERVICENOW:search_cmdb_ci",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description:
      "Search the Configuration Management Database (CMDB) for configuration items.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to find configuration items.",
        },
      },
      required: ["query"],
    },
    outputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["items"],
    },
  },
  {
    id: "2cb46043-4bd1-43e9-af86-a5a727349e76",
    action: "SERVICENOW:update_cmdb_ci",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description: "Update attributes on a configuration item in the CMDB.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        ci_id: {
          type: "string",
          description: ".",
        },
        attributes: {
          type: "object",
          description: "Key/value pairs of attributes to update.",
        },
      },
      required: ["ci_id", "attributes"],
    },
  },
  {
    id: "539d3524-f650-408b-8b63-f0839f6a3422",
    action: "SERVICENOW:create_service_request",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description: "Create a general IT service request not tied to the catalog.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        short_description: {
          type: "string",
          description: ".",
        },
        requested_by: {
          type: "string",
          description: ".",
        },
      },
      required: ["short_description", "requested_by"],
    },
    outputSchema: {
      type: "object",
      properties: {
        request_number: {
          type: "string",
          description: ".",
        },
      },
      required: ["request_number"],
    },
  },
  {
    id: "52d20d03-5dc4-4c3d-a659-493e41053185",
    action: "SERVICENOW:get_sla_breach_report",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description:
      "Get a report of tickets that have breached or are approaching SLA deadlines.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        assignment_group: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        breached_tickets: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["breached_tickets"],
    },
  },
  {
    id: "785f3c37-9825-4bd3-a06e-d64c1648eb98",
    action: "SERVICENOW:assign_incident",
    label: "ServiceNow",
    provider: "SERVICENOW",
    description: "Assign an incident to a specific agent or assignment group.",
    direction: "OUTGOING",
    icon: "mdi:cloud-check-outline",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        incident_number: {
          type: "string",
          description: ".",
        },
        assignee: {
          type: "string",
          description: ".",
          nullable: true,
        },
        assignment_group: {
          type: "string",
          description: ".",
          nullable: true,
        },
      },
      required: ["incident_number"],
    },
  },
  {
    id: "2c4a422a-da00-489e-b324-b27299731fa1",
    action: "ATLASSIAN:create_jira_issue",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description:
      "Create a new issue in a Jira project. Returns the created issue key.",
    direction: "OUTGOING",
    icon: "mdi:atlassian",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        project_key: {
          type: "string",
          description: "The key of the Jira project (e.g. ENG).",
        },
        summary: {
          type: "string",
          description: "Short summary of the issue.",
        },
        issue_type: {
          type: "string",
          description: "The type of issue to create. Defaults to 'Task'.",
          enum: ["Task", "Bug", "Story", "Epic", "Sub-task"],
          nullable: true,
        },
        description: {
          type: "string",
          description: "Full description of the issue.",
          nullable: true,
        },
        priority: {
          type: "string",
          description: "Issue priority.",
          enum: ["Highest", "High", "Medium", "Low", "Lowest"],
          nullable: true,
        },
      },
      required: ["project_key", "summary"],
    },
    outputSchema: {
      type: "object",
      properties: {
        issue_key: {
          type: "string",
          description: ".",
        },
        url: {
          type: "string",
          description: ".",
        },
      },
      required: ["issue_key"],
    },
  },
  {
    id: "92b06cce-e5f1-4f6c-ac56-15aa2fc56039",
    action: "ATLASSIAN:get_jira_issue",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description: "Get the full details of a Jira issue by its issue key.",
    direction: "OUTGOING",
    icon: "mdi:atlassian",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        issue_key: {
          type: "string",
          description: "The Jira issue key (e.g. ENG-123).",
        },
      },
      required: ["issue_key"],
    },
    outputSchema: {
      type: "object",
      properties: {
        issue_key: {
          type: "string",
          description: ".",
        },
        summary: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: ".",
        },
        assignee: {
          type: "string",
          description: ".",
        },
      },
      required: ["issue_key", "summary", "status"],
    },
  },
  {
    id: "91c8f3a2-3f35-49e4-a376-fa7835078ea1",
    action: "ATLASSIAN:update_jira_issue",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description:
      "Update the summary, description, or priority of an existing Jira issue.",
    direction: "OUTGOING",
    icon: "mdi:atlassian",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        issue_key: {
          type: "string",
          description: ".",
        },
        summary: {
          type: "string",
          description: "New summary for the issue.",
          nullable: true,
        },
        description: {
          type: "string",
          description: "New description for the issue.",
          nullable: true,
        },
        priority: {
          type: "string",
          description: "New priority for the issue.",
          enum: ["Highest", "High", "Medium", "Low", "Lowest"],
          nullable: true,
        },
      },
      required: ["issue_key"],
    },
  },
  {
    id: "984ed1bd-f6c9-4ab2-bd5a-4e1d5cd4dd83",
    action: "ATLASSIAN:transition_jira_issue",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description:
      "Move a Jira issue to a different workflow status (e.g. In Progress, Done).",
    direction: "OUTGOING",
    icon: "mdi:atlassian",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        issue_key: {
          type: "string",
          description: ".",
        },
        status: {
          type: "string",
          description: "The target workflow status.",
          enum: ["To Do", "In Progress", "In Review", "Blocked", "Done"],
        },
        comment: {
          type: "string",
          description: "Optional comment to add with the transition.",
          nullable: true,
        },
      },
      required: ["issue_key", "status"],
    },
  },
  {
    id: "2aa58751-52b6-4920-bb35-7e560acd73f9",
    action: "ATLASSIAN:assign_jira_issue",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description: "Assign a Jira issue to a specific user.",
    direction: "OUTGOING",
    icon: "mdi:atlassian",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        issue_key: {
          type: "string",
          description: ".",
        },
        assignee: {
          type: "string",
          description:
            "Account ID or email of the user to assign the issue to.",
        },
      },
      required: ["issue_key", "assignee"],
    },
  },
  {
    id: "5b1d2a2f-e153-4acf-9f3e-b42c09d46597",
    action: "ATLASSIAN:add_jira_comment",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description: "Add a comment to an existing Jira issue.",
    direction: "OUTGOING",
    icon: "mdi:atlassian",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        issue_key: {
          type: "string",
          description: ".",
        },
        comment: {
          type: "string",
          description: "The comment text to add.",
        },
      },
      required: ["issue_key", "comment"],
    },
    outputSchema: {
      type: "object",
      properties: {
        comment_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["comment_id"],
    },
  },
  {
    id: "fd85a848-b67c-4cba-84ea-9d727fd041fa",
    action: "ATLASSIAN:search_jira_issues",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description: "Search Jira issues using a JQL query.",
    direction: "OUTGOING",
    icon: "mdi:atlassian",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        jql: {
          type: "string",
          description:
            "JQL query to run (e.g. project = ENG AND status = 'In Progress').",
        },
        limit: {
          type: "number",
          description: "Max number of issues to return.",
          nullable: true,
        },
      },
      required: ["jql"],
    },
    outputSchema: {
      type: "object",
      properties: {
        issues: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["issues"],
    },
  },
  {
    id: "9c8c7c76-1c59-41f4-9be7-de1b115acad6",
    action: "ATLASSIAN:link_jira_issues",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description:
      "Create a link between two Jira issues (e.g. blocks, relates to, duplicates).",
    direction: "OUTGOING",
    icon: "mdi:atlassian",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        inward_issue_key: {
          type: "string",
          description: "The issue the link originates from.",
        },
        outward_issue_key: {
          type: "string",
          description: "The issue the link points to.",
        },
        link_type: {
          type: "string",
          description: "The type of link between the issues.",
          enum: ["Blocks", "Relates", "Duplicates", "Clones"],
          nullable: true,
        },
      },
      required: ["inward_issue_key", "outward_issue_key"],
    },
  },
  {
    id: "680d4c0c-d87f-4db9-9b4e-d5ff33d31f98",
    action: "ATLASSIAN:create_jira_sprint",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description: "Create a new sprint on a Jira board.",
    direction: "OUTGOING",
    icon: "mdi:atlassian",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        board_id: {
          type: "string",
          description: "The ID of the Jira board to create the sprint on.",
        },
        name: {
          type: "string",
          description: "Name of the sprint.",
        },
        start_date: {
          type: "string",
          description: "Sprint start date (YYYY-MM-DD).",
          nullable: true,
        },
        end_date: {
          type: "string",
          description: "Sprint end date (YYYY-MM-DD).",
          nullable: true,
        },
      },
      required: ["board_id", "name"],
    },
    outputSchema: {
      type: "object",
      properties: {
        sprint_id: {
          type: "string",
          description: ".",
        },
      },
      required: ["sprint_id"],
    },
  },
  {
    id: "2def1557-c359-4465-a838-80625b51bac8",
    action: "ATLASSIAN:create_confluence_page",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description: "Create a new page in a Confluence space.",
    direction: "OUTGOING",
    icon: "mdi:atlassian",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        space_key: {
          type: "string",
          description: "The key of the Confluence space (e.g. DOCS).",
        },
        title: {
          type: "string",
          description: "Title of the page.",
        },
        body: {
          type: "string",
          description: "HTML or storage-format body of the page.",
        },
        parent_page_id: {
          type: "string",
          description: "Optional parent page to nest this page under.",
          nullable: true,
        },
      },
      required: ["space_key", "title", "body"],
    },
    outputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: ".",
        },
        url: {
          type: "string",
          description: ".",
        },
      },
      required: ["page_id"],
    },
  },
  {
    id: "05ea7c44-6bf0-4394-8e58-f4010dae234d",
    action: "ATLASSIAN:update_confluence_page",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description: "Update the title or body of an existing Confluence page.",
    direction: "OUTGOING",
    icon: "mdi:atlassian",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: "The ID of the page to update.",
        },
        title: {
          type: "string",
          description: "New title for the page.",
          nullable: true,
        },
        body: {
          type: "string",
          description: "New body content for the page.",
          nullable: true,
        },
      },
      required: ["page_id"],
    },
  },
  {
    id: "310dc352-9030-4d72-a25a-2124aa391832",
    action: "ATLASSIAN:search_confluence_pages",
    label: "Atlassian",
    provider: "ATLASSIAN",
    description: "Search Confluence pages by text, optionally within a space.",
    direction: "OUTGOING",
    icon: "mdi:atlassian",
    lib: "mcp",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Text to search for in Confluence pages.",
        },
        space_key: {
          type: "string",
          description: "Optional space key to limit the search to.",
          nullable: true,
        },
      },
      required: ["query"],
    },
    outputSchema: {
      type: "object",
      properties: {
        pages: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      required: ["pages"],
    },
  },
];
export default MCPs;
