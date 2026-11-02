describe("Organization chart", () => {
  beforeEach(() => {
    cy.fixture("organizations/team.json").then((team) => {
      cy.platformSetup(team.id, "organizations/team.json");
      cy.viewport(1280, 720);
    });
    cy.fixture("organizations/team.json").as("project");

    cy.fixture("teamChart/create/agent.get.json").as("newAgents");
    cy.fixture("teamChart/create/agent.post.json").as("createdAgent");
    cy.fixture("teamChart/agents.json").as("agents");

    cy.setAgentIntercept();

    cy.intercept("GET", `/api/projects/add6dfa4-45ba-4da2-bc5c-5a529610b52f`, {
      fixture: "organizations/team.json",
    });

    cy.intercept(
      "GET",
      `/api/organizations/dfb990bb-81dd-4584-82ce-050eb8f6a12f`,
      {
        fixture: "organizations/organization.json",
      }
    );

    cy.intercept("GET", `/api/agents`, {
      fixture: "teamChart/agents.json",
    });

    cy.intercept("GET", "/api/blueprints", {
      fixture: "agent-page/blueprints/blueprints.json",
    });
  });

  it("adds new agent", function () {
    cy.visit("/");

    cy.getBySel("organization-button").click();

    cy.getBySel("team-chart").should("be.visible");

    cy.getBySel("add-agent-button").should("be.visible");

    cy.intercept("GET", `/api/organizations/${this.project.organizationId}`, {
      fixture: "organizations/organization.get.json",
    });

    cy.getBySel("add-agent-button").first().click();

    cy.createAgentViaDialog(this.createdAgent, this.newAgents);

    cy.waitEvent("AGENT_ADDED");
  });

  it("opens blueprint drawer", function () {
    cy.fixture("agent-page/blueprints/blueprints.json").then((blueprints) => {
      cy.intercept(
        "GET",
        `/api/blueprints/ba6f7911-e232-469d-9060-2881852f6e59`,
        blueprints[0]
      );
    });

    cy.intercept("GET", `/api/mcps`, { fixture: "agent-page/mcps.json" });

    cy.intercept("GET", `/api/mcps/actions`, {
      fixture: "agent-page/actions.json",
    });

    cy.intercept(
      "PATCH",
      `/api/blueprints/ba6f7911-e232-469d-9060-2881852f6e59`,
      { fixture: "agent-page/blueprints/blueprint.patch.json" }
    );

    cy.intercept("POST", `/api/blueprints/generate`, {
      statusCode: 200,
      body: { description: "", skill: "" },
    });

    cy.visit("/team");

    cy.getBySel("team-chart").should("be.visible");

    cy.getBySel("blueprint-button").click();

    cy.getBySel("blueprint-flow-canvas").should("be.visible");
  });

  it("opens agent page", function () {
    cy.intercept("GET", `/api/agents/${this.agents[0].id}`, this.agents[0]);

    cy.visit("/team");

    cy.getBySel("team-chart").should("be.visible");

    cy.getBySel("agent-page-button").should("be.visible");
    cy.getBySel("agent-page-button").first().click();

    cy.getBySel("tab-profile").should("have.attr", "aria-selected", "true");
  });

  it("opens knowledge base page", function () {
    cy.intercept("GET", `/api/agents/${this.agents[0].id}`, this.agents[0]);

    cy.intercept(
      "GET",
      `/api/knowledge?agentId=00db1bd4-4829-40f2-8b99-d2e42342157e`,
      {
        fixture: "agent-page/knowledges/knowledges.json",
      }
    );

    cy.visit("/team");

    cy.getBySel("team-chart").should("be.visible");

    cy.getBySel("knowledge-base-button").should("be.visible");
    cy.getBySel("knowledge-base-button").first().click();

    cy.getBySel("tab-knowledge-base").should(
      "have.attr",
      "aria-selected",
      "true"
    );
  });

  it("opens blueprints page", function () {
    cy.intercept("GET", `/api/agents/${this.agents[0].id}`, this.agents[0]);

    cy.fixture("agent-page/blueprints/blueprints.json").then((blueprints) => {
      cy.intercept(
        "GET",
        `/api/blueprints/ba6f7911-e232-469d-9060-2881852f6e59`,
        blueprints[0]
      );
    });

    cy.intercept(
      "GET",
      `/api/agents/00db1bd4-4829-40f2-8b99-d2e42342157e/blueprints`,
      {
        fixture: "agent-page/blueprints/blueprints.json",
      }
    );

    cy.visit("/team");

    cy.getBySel("team-chart").should("be.visible");

    cy.getBySel("blueprints-button").should("be.visible");
    cy.getBySel("blueprints-button").first().click();

    cy.getBySel("tab-blueprints").should("have.attr", "aria-selected", "true");
  });

  it("opens tasks page", function () {
    cy.intercept("GET", `/api/agents/${this.agents[0].id}`, this.agents[0]);

    cy.intercept(
      "GET",
      `/api/tasks?agentId=00db1bd4-4829-40f2-8b99-d2e42342157e`,
      {
        fixture: "agent-page/tasks/tasks.json",
      }
    );

    cy.intercept(
      "GET",
      `/api/tasks/aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1/steps`,
      {
        fixture: "agent-page/tasks/task.steps.json",
      }
    );

    cy.visit("/team");

    cy.getBySel("team-chart").should("be.visible");

    cy.getBySel("tasks-button").should("be.visible");
    cy.getBySel("tasks-button").first().click();

    cy.getBySel("tab-tasks").should("have.attr", "aria-selected", "true");
  });
});
