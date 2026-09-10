import { COMPLIANCE_AGENT_ID, COMPLIANCE_BLUEPRINT_ID, NODE } from "./ids";

/**
 * The "Order and Compliance" flow as a supervisor reshapes it when a product
 * turns out to have no certificate on file: after the knowledge lookup the
 * flow branches, and the uncertified branch hands the task over to the
 * compliance manager's "Compliance Certificate Request" blueprint.
 *
 * This mirrors what the supervising drawer produces in the dashboard
 * (see `PATCH /supervisings/:id/demo`).
 */
function supervisedHandoffNodes() {
  return [
    {
      id: NODE.findProduct,
      type: "NORMAL",
      properties: {
        label: "Find Product",
        icon: "mdi:magnify",
        action: "ORDER:find_product",
        description: "Search and retrieve the product details",
      },
      next: [NODE.knowledgeLookup],
    },
    {
      id: NODE.knowledgeLookup,
      type: "NORMAL",
      properties: {
        label: "Check Certificate",
        icon: "mdi:book-search",
        action: "PLATFORM:knowledge_lookup",
        description:
          "Look up the agent's knowledge base to find the product's compliance certificate.",
      },
      next: [NODE.certificateExists],
    },
    {
      id: NODE.certificateExists,
      type: "CONDITION",
      properties: {
        label: "If certificate exists",
        icon: "mdi:source-branch",
        action: "PLATFORM:decision",
        description:
          "Branch on whether the knowledge base holds a certificate for this product.",
        parameters: {
          condition:
            "The knowledge base contains a compliance certificate for the selected product",
          true: [NODE.assignCertificate],
          false: [NODE.handoff],
        },
      },
      true: [NODE.assignCertificate],
      false: [NODE.handoff],
    },
    {
      id: NODE.handoff,
      type: "HANDOFF",
      properties: {
        label: "Handoff to compliant_manager",
        icon: "mdi:account-arrow-right",
        action: "PLATFORM:handoff",
        description: "Transfer this task to another agent's blueprint.",
        targetAgentId: COMPLIANCE_AGENT_ID,
        targetBlueprintId: COMPLIANCE_BLUEPRINT_ID,
        parameters: {
          targetAgentId: COMPLIANCE_AGENT_ID,
          targetBlueprintId: COMPLIANCE_BLUEPRINT_ID,
        },
      },
    },
    {
      id: NODE.assignCertificate,
      type: "NORMAL",
      properties: {
        label: "Assign Certificate",
        icon: "mdi:certificate-outline",
        action: "ORDER:assign_certificate",
        description: "Assign a compliance certificate to the product",
      },
      next: [NODE.createPurchaseOrder],
    },
    {
      id: NODE.createPurchaseOrder,
      type: "NORMAL",
      properties: {
        label: "Create Purchase Order",
        icon: "mdi:file-document-plus",
        action: "ORDER:create_po",
        description: "Create a Purchase Order for the certified product",
      },
      next: [NODE.sendEmail],
    },
    {
      id: NODE.sendEmail,
      type: "NORMAL",
      properties: {
        label: "Send Email",
        icon: "mdi:email",
        action: "GREY:send_email",
        description:
          "Send email notification about the completed purchase order",
      },
      next: null,
    },
  ];
}

export { supervisedHandoffNodes };
