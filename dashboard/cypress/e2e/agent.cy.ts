describe("Agent page", () => {
  beforeEach(() => {
    cy.fixture("agents-page/teams.json").then((teams) => {
      cy.platformSetup(teams[0].id, "agents-page/teams.json");
      cy.viewport(1280, 720);
    });

    cy.fixture("agents-page/agents.json").as("agents");
    cy.fixture("agents-page/agent.json").as("agent");

    cy.setAgentIntercept();
  });

  it("visits agents list and opens the agent drawer", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.visit("/agents");

    cy.getBySel("agent-card").should("have.length", 2);

    cy.getBySel("agent-card-more-vert").first().click();

    cy.getBySel("agent-card-menu-view").click();

    cy.getBySel("tab-profile").should("be.visible");
    cy.getBySel("tab-knowledge-base").should("be.visible");
  });

  it("opens the edit menu from the agent card", function () {
    cy.visit("/agents");

    cy.getBySel("agent-card-more-vert").first().click();

    cy.getBySel("agent-card-menu-edit").click();

    cy.getBySel("name").should("be.visible");
  });

  it("opens the delete confirmation from the agent card", function () {
    cy.visit("/agents");

    cy.getBySel("agent-card-more-vert").first().click();

    cy.getBySel("agent-card-menu-delete").click();

    cy.getBySel("confirm").should("be.visible");
  });

  it("adds a URL knowledge item", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.empty.json",
    });

    cy.knowledgeBaseIntercept();

    cy.getBySel("add-knowledge-button").click();

    cy.getBySel("add-item-select").click();

    cy.getBySel("add-type-menu-URL").click();

    cy.getBySel("finish").should("be.disabled");

    cy.getBySel("add-item-input").type("https://www.google.com");

    cy.intercept("POST", `/api/knowledge`, {
      fixture: "agent-page/knowledges/create/knowledge.url.post.json",
    });
    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.json",
    });

    cy.getBySel("finish").click();

    cy.waitEvent("KNOWLEDGE_CREATED");

    cy.getBySel("delete-knowledge-button").should("have.length", 4);
  });

  it("adds a Text knowledge item", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.empty.json",
    });

    cy.knowledgeBaseIntercept();

    cy.getBySel("add-knowledge-button").click();

    cy.getBySel("add-item-select").click();

    cy.getBySel("add-type-menu-TEXT").click();

    cy.getBySel("finish").should("be.disabled");

    cy.getBySel("add-item-input").type("My first text");

    cy.intercept("POST", `/api/knowledge`, {
      fixture: "agent-page/knowledges/create/knowledge.text.post.json",
    });
    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.json",
    });

    cy.getBySel("finish").click();

    cy.waitEvent("KNOWLEDGE_CREATED");

    cy.getBySel("delete-knowledge-button").should("have.length", 4);
  });

  it("adds a QA knowledge item", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.empty.json",
    });

    cy.knowledgeBaseIntercept();

    cy.getBySel("add-knowledge-button").click();

    cy.getBySel("add-item-select").click();

    cy.getBySel("add-type-menu-QA").click();

    cy.getBySel("finish").should("be.disabled");

    cy.getBySel("add-item-question").type("How are you?");

    cy.getBySel("add-item-answer").type("Okay?");

    cy.intercept("POST", `/api/knowledge`, {
      fixture: "agent-page/knowledges/create/knowledge.qa.post.json",
    });
    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.json",
    });

    cy.getBySel("finish").click();

    cy.waitEvent("KNOWLEDGE_CREATED");

    cy.getBySel("delete-knowledge-button").should("have.length", 4);
  });

  it("adds a Data knowledge item", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.empty.json",
    });

    cy.knowledgeBaseIntercept();

    cy.getBySel("add-knowledge-button").click();

    cy.getBySel("add-item-select").click();

    cy.getBySel("add-type-menu-DATA").click();

    cy.getBySel("finish").should("be.disabled");

    cy.getBySel("add-item-input").type('{"key":"value"}', {
      parseSpecialCharSequences: false,
    });

    cy.intercept("POST", `/api/knowledge`, {
      fixture: "agent-page/knowledges/create/knowledge.data.post.json",
    });
    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.json",
    });

    cy.getBySel("finish").click();

    cy.waitEvent("KNOWLEDGE_CREATED");

    cy.getBySel("delete-knowledge-button").should("have.length", 4);
  });

  it("deletes a URL knowledge item", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.json",
    });

    cy.knowledgeBaseIntercept();

    cy.getBySel("type-select").click();

    cy.getBySel("type-menu-URL").click();

    cy.getBySel("delete-knowledge-button").eq(0).click();

    cy.intercept(
      "DELETE",
      `/api/knowledge/11111111-1111-4111-8111-111111111111`,
      { fixture: "agent-page/knowledges/delete/knowledge.url.delete.json" }
    );

    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.empty.json",
    });

    cy.getBySel("confirmation-delete").should("be.visible");

    cy.getBySel("confirmation-delete").click();

    cy.waitEvent("KNOWLEDGE_DELETED");

    cy.getBySel("delete-knowledge-button").should("not.exist");
  });

  it("deletes a Text knowledge item", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.json",
    });

    cy.knowledgeBaseIntercept();

    cy.getBySel("type-select").click();

    cy.getBySel("type-menu-TEXT").click();

    cy.getBySel("delete-knowledge-button").eq(0).click();

    cy.intercept(
      "DELETE",
      `/api/knowledge/22222222-2222-4222-8222-222222222222`,
      { fixture: "agent-page/knowledges/delete/knowledge.text.delete.json" }
    );

    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.empty.json",
    });

    cy.getBySel("confirmation-delete").should("be.visible");

    cy.getBySel("confirmation-delete").click();

    cy.waitEvent("KNOWLEDGE_DELETED");

    cy.getBySel("delete-knowledge-button").should("not.exist");
  });

  it("deletes a QA knowledge item", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.json",
    });

    cy.knowledgeBaseIntercept();

    cy.getBySel("type-select").click();

    cy.getBySel("type-menu-QA").click();

    cy.getBySel("delete-knowledge-button").eq(0).click();

    cy.intercept(
      "DELETE",
      `/api/knowledge/33333333-3333-4333-8333-333333333333`,
      { fixture: "agent-page/knowledges/delete/knowledge.qa.delete.json" }
    );

    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.empty.json",
    });

    cy.getBySel("confirmation-delete").should("be.visible");

    cy.getBySel("confirmation-delete").click();

    cy.waitEvent("KNOWLEDGE_DELETED");

    cy.getBySel("delete-knowledge-button").should("not.exist");
  });

  it("deletes a Data knowledge item", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.json",
    });

    cy.knowledgeBaseIntercept();

    cy.getBySel("type-select").click();

    cy.getBySel("type-menu-DATA").click();

    cy.getBySel("delete-knowledge-button").eq(0).click();

    cy.intercept(
      "DELETE",
      `/api/knowledge/44444444-4444-4444-8444-444444444444`,
      { fixture: "agent-page/knowledges/delete/knowledge.data.delete.json" }
    );

    cy.intercept("GET", `/api/knowledge?agentId=${this.agent.id}`, {
      fixture: "agent-page/knowledges/knowledges.empty.json",
    });

    cy.getBySel("confirmation-delete").should("be.visible");

    cy.getBySel("confirmation-delete").click();

    cy.waitEvent("KNOWLEDGE_DELETED");

    cy.getBySel("delete-knowledge-button").should("not.exist");
  });

  it("opens a blueprint flow from the blueprints tab", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/agents/${this.agent.id}/blueprints`, {
      fixture: "agent-page/blueprints/blueprints.json",
    });

    cy.fixture("agent-page/blueprints/blueprints.json").then((blueprints) => {
      cy.intercept(
        "GET",
        `/api/blueprints/ba6f7911-e232-469d-9060-2881852f6e59`,
        blueprints[0]
      );
    });

    cy.visit(`/agents`);
    cy.getBySel("agent-card-more-vert").first().click();
    cy.getBySel("agent-card-menu-view").click();
    cy.getBySel("tab-blueprints").should("be.visible");
    cy.getBySel("tab-blueprints").click();

    cy.intercept(
      "PATCH",
      `/api/blueprints/ba6f7911-e232-469d-9060-2881852f6e59`,
      { fixture: "agent-page/blueprints/blueprint.patch.json" }
    );

    cy.intercept("GET", `/api/blueprints`, {
      fixture: "agent-page/blueprints/blueprints.json",
    });

    cy.intercept("GET", `/api/mcps`, { fixture: "agent-page/mcps.json" });

    cy.intercept("GET", `/api/mcps/actions`, {
      fixture: "agent-page/actions.json",
    });

    cy.getBySel("edit-icon").should("be.visible");
    cy.getBySel("edit-icon").first().click();

    cy.getBySel("blueprint-flow-canvas").should("be.visible");
  });

  it("opens the resolve supervise flow from the supervisings tab", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/agents/${this.agent.id}/supervisings`, {
      fixture: "agent-page/supervisings/supervisings.json",
    });

    cy.visit(`/agents`);
    cy.getBySel("agent-card-more-vert").first().click();
    cy.getBySel("agent-card-menu-view").click();
    cy.getBySel("tab-supervisings").should("be.visible");
    cy.getBySel("tab-supervisings").click();

    cy.getBySel("supervise-card").should("be.visible");

    cy.getBySel("resolve-supervise-button").click();

    cy.getBySel("blueprint-drawer-layout").should("be.visible");
  });

  it("selects a task and opens its task flow", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/tasks?agentId=${this.agent.id}`, {
      fixture: "agent-page/tasks/tasks.json",
    });
    cy.intercept(
      "GET",
      `/api/tasks/aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1/steps`,
      { fixture: "agent-page/tasks/task.steps.json" }
    );

    cy.visit(`/agents`);
    cy.getBySel("agent-card-more-vert").first().click();
    cy.getBySel("agent-card-menu-view").click();
    cy.getBySel("tab-tasks").should("be.visible");
    cy.getBySel("tab-tasks").click();

    cy.getBySel("task-list-item").first().click();

    cy.getBySel("task-flow-button").click();

    cy.getBySel("task-flow-dialog").should("be.visible");
  });

  it("expands and minimizes the task details panel", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/tasks?agentId=${this.agent.id}`, {
      fixture: "agent-page/tasks/tasks.json",
    });
    cy.intercept(
      "GET",
      `/api/tasks/aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1/steps`,
      { fixture: "agent-page/tasks/task.steps.json" }
    );

    cy.visit(`/agents`);
    cy.getBySel("agent-card-more-vert").first().click();
    cy.getBySel("agent-card-menu-view").click();
    cy.getBySel("tab-tasks").should("be.visible");
    cy.getBySel("tab-tasks").click();

    cy.getBySel("task-list-item").first().click();

    cy.getBySel("task-details-toggle-expand")
      .should("have.attr", "aria-label", "Expand")
      .click();

    cy.getBySel("task-details-toggle-expand")
      .should("have.attr", "aria-label", "Minimize")
      .click();

    cy.getBySel("task-details-toggle-expand").should(
      "have.attr",
      "aria-label",
      "Expand"
    );
  });

  it("adds a channel from the channels tab", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/channels`, {
      fixture: "agent-page/channels/channels.empty.json",
    });
    cy.intercept("GET", `/api/blueprints`, {
      fixture: "agent-page/blueprints/blueprints.json",
    });

    cy.visit(`/agents`);
    cy.getBySel("agent-card-more-vert").first().click();
    cy.getBySel("agent-card-menu-view").click();
    cy.getBySel("tab-channels").should("be.visible");
    cy.getBySel("tab-channels").click();

    cy.getBySel("add-channel-button").click();

    cy.getBySel("open-add-channel-menu-button").click();

    cy.getBySel("add-channel-option-slack").click();

    cy.getBySel(
      "channel-blueprint-option-tbp-ba6f7911-e232-469d-9060-2881852f6e59"
    ).click();

    cy.intercept("POST", `/api/channels`, {
      fixture: "agent-page/channels/channels.json",
    }).as("createChannel");

    cy.intercept("GET", `/api/channels`, {
      fixture: "agent-page/channels/channels.json",
    });

    cy.getBySel("channel-wizard-connect-button").click();

    cy.wait("@createChannel");

    cy.getBySel("channel-wizard-connect-button").should("not.exist");
  });

  it("lists MCP servers from the mcps tab", function () {
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept("GET", `/api/mcp-providers`, {
      fixture: "agent-page/mcp/mcp-providers.json",
    });
    cy.intercept("GET", `/api/mcp-servers`, {
      fixture: "agent-page/mcp/mcp-servers.empty.json",
    });
    cy.intercept("GET", `/api/agents/${this.agent.id}/mcp-servers`, {
      fixture: "agent-page/mcp/mcp-servers.json",
    });

    cy.visit(`/agents`);
    cy.getBySel("agent-card-more-vert").first().click();
    cy.getBySel("agent-card-menu-view").click();
    cy.getBySel("tab-mcps").should("be.visible");
    cy.getBySel("tab-mcps").click();

    cy.getBySel("mcp-server-card").should("have.length", 1);
  });
});
