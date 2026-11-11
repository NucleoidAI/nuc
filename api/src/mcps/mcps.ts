const MCPs = [
  {
    id: "1d49fadb-93e3-43cc-88e4-f3bfc2ea4f0e",
    action: "SLACK:search",
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    id: "019f8b01-0000-4000-8000-000000000001",
    action: "SAP:search",
    mock: true,
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
    mock: true,
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
    id: "019f8b01-0000-4000-8000-000000000004",
    action: "AWS:search",
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    id: "e6a7b8c9-6000-4000-8000-000000000001",
    action: "SNOWFLAKE:run_query",
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    id: "2c4a422a-da00-489e-b324-b27299731fa1",
    action: "ATLASSIAN:create_jira_issue",
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
    mock: true,
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
