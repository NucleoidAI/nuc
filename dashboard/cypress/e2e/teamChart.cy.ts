describe("Organization chart", () => {
  beforeEach(() => {
    cy.fixture("organizations/team.json").then((teams) => {
      cy.wrap(teams.id).as("teamId");
      cy.platformSetup(teams.id, "organizations/team.json");
      cy.viewport(1280, 720);
    });
    cy.fixture("organizations/team.json").as("project");

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

    cy.fixture("teamChart/create/agent.get.json").as("newAgents");
    cy.fixture("teamChart/create/agent.post.json").as("createdAgent");

    cy.intercept("GET", "/api/blueprints", {
      fixture: "agent-page/blueprints/blueprints.json",
    });

    cy.fixture("teamChart/agents.json").as("agent");
  });
  it("adds new agent", function () {
    cy.visit("/");

    cy.intercept("GET", `/api/agents`, {
      fixture: `/teamChart/agents.json`,
    });

    cy.setAgentIntercept();

    cy.getBySel("organization-button").click();

    cy.getBySel("team-chart").should("be.visible");

    cy.getBySel("add-agent-button").should("be.visible");

    cy.getBySel("add-agent-button").eq(0).click();

    cy.intercept("GET", `/api/organizations/${this.project.organizationId}`, {
      fixture: "organizations/organization.get.json",
    });

    cy.createAgentViaDialog(this.createdAgent, this.newAgents);

    cy.waitEvent("AGENT_ADDED");
  });

  it("opens blueprint drawer", function () {
    cy.visit("/team");

    cy.intercept("GET", `/api/agents`, {
      fixture: `/teamChart/agents.json`,
    });

    cy.setAgentIntercept();

    cy.getBySel("team-chart").should("be.visible");

    cy.fixture("agent-page/blueprints/blueprints.json").then((blueprints) => {
      cy.intercept(
        "GET",
        `/api/blueprints/ba6f7911-e232-469d-9060-2881852f6e59`,
        blueprints[0]
      );
    });

    cy.getBySel("blueprint-button").click();
  });

  it("opens agent page", function () {
    cy.visit("/team");

    cy.intercept("GET", `/api/agents`, {
      fixture: `/teamChart/agents.json`,
    });

    cy.setAgentIntercept();

    cy.getBySel("team-chart").should("be.visible");

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.getBySel("agent-page-button").should("be.visible");
    cy.getBySel("agent-page-button").eq(0).click();

  });

  it("opens knowledge base page", function () {
    cy.visit("/team");

    cy.intercept("GET", `/api/agents`, {
      fixture: `/teamChart/agents.json`,
    });

    cy.setAgentIntercept();

    cy.getBySel("team-chart").should("be.visible");

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.intercept("GET", `/api/knowledge?agentId=00db1bd4-4829-40f2-8b99-d2e42342157e`, {
      fixture: "agent-page/knowledges/knowledges.json",
    });

    cy.getBySel("knowledge-base-button").should("be.visible");
    cy.getBySel("knowledge-base-button").eq(0).click();
  });

  it("opens blueprints page", function () {
    cy.visit("/team");

    cy.intercept("GET", `/api/agents`, {
      fixture: `/teamChart/agents.json`,
    });

    cy.setAgentIntercept();

    cy.getBySel("team-chart").should("be.visible");

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.intercept("GET", `/api/blueprints`, {
      fixture: "agent-page/blueprints/blueprints.json",
    });

    cy.intercept("GET", `/api/blueprints/ba6f7911-e232-469d-9060-2881852f6e59`, {
      fixture: "agent-page/blueprints/blueprints.json",
    });

     cy.fixture("agent-page/blueprints/blueprints.json").then((blueprints) => {
      cy.intercept(
        "GET",
        `/api/blueprints/ba6f7911-e232-469d-9060-2881852f6e59`,
        blueprints[0]
      );
    });

    cy.intercept("GET", `/api/agents/00db1bd4-4829-40f2-8b99-d2e42342157e/blueprints`, {
      fixture: "agent-page/blueprints/blueprints.json",
    });

    cy.getBySel("blueprints-button").should("be.visible");
    cy.getBySel("blueprints-button").eq(0).click();
  });

  it("opens tasks page", function () {
    cy.visit("/team");

    cy.intercept("GET", `/api/agents`, {
      fixture: `/teamChart/agents.json`,
    });

    cy.setAgentIntercept();

    cy.getBySel("team-chart").should("be.visible");

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.intercept("GET", `/api/tasks?agentId=00db1bd4-4829-40f2-8b99-d2e42342157e`, {
      fixture: "agent-page/tasks/tasks.json",
    });

     cy.intercept("GET", `/api/tasks/aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1/steps`, {
      fixture: "agent-page/tasks/task.steps.json",
    });

    cy.getBySel("tasks-button").should("be.visible");
    cy.getBySel("tasks-button").eq(0).click();
  });
});
