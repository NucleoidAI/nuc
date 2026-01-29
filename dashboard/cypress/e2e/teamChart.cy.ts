import config from "../../config";

describe("Organization chart", () => {
  beforeEach(() => {
    cy.fixture("organizations/team.json").then((teams) => {
      cy.wrap(teams.id).as("teamId");
      cy.platformSetup(teams.id, "organizations/team.json", config);
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

    cy.fixture("agents-page/create/agents.team.get.json").as(
      "newAgents"
    );
    cy.fixture("agents-page/create/agent.team.post.json").as(
      "createdAgent"
    );

    cy.intercept("GET", "/api/blueprints", {
      fixture: "blueprints/blueprints.get.json",
    });

    cy.fixture("agents-page/agent.json").as("agent");
  });
  it("adds new agent", function () {
    cy.visit("/");

    cy.setAgentIntercept();

    cy.intercept("GET", "/api/engines", {
      fixture: "agents-page/engines.json",
    });

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

    cy.setAgentIntercept();

    cy.getBySel("team-chart").should("be.visible");

    cy.getBySel("blueprint-button").click();
  });

  it("opens agent page", function () {
    cy.visit("/team");

    cy.setAgentIntercept();

    cy.getBySel("team-chart").should("be.visible");

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.getBySel("agent-page-button").click();
  });
});
