import config from "../../config";

describe("Agents page", () => {
  beforeEach(() => {
    cy.fixture("agents-page/teams.json").then((teams) => {
      cy.wrap(teams[1].id).as("teamId");
      cy.platformSetup(teams[1].id, "agents-page/team.json", config);
      cy.viewport(1280, 720);
    });

    cy.fixture("agents-page/agents.json").as("agents");

    cy.fixture("agents-page/create/agents.get.json").as("newAgents");
    cy.fixture("agents-page/create/agent.post.json").as("createdAgent");
    cy.fixture("agents-page/edit/agents.get.json").as("agentsWithEditedAgent");
    cy.fixture("agents-page/edit/agent.put.json").as("editedAgent");

    cy.fixture("agents-page/delete/agents.get.json").as(
      "agentsWithDeletedAgent"
    );
  });

  it("add a new agent", function () {
    cy.visit("/agents");

    cy.setAgentIntercept();

    cy.getBySel("add-new-button").click();

    cy.waitEvent("AGENT_WIZARD_OPENED");

    cy.createAgentViaDialog(this.createdAgent, this.newAgents);

    cy.waitEvent("AGENT_ADDED");

    cy.getBySel("agent-card").should("have.length", 3);

    this.newAgents.forEach((agent, index) => {
      cy.verifyAgentCard(agent, index);
    });
  });

  it("edits a agent", function () {
    cy.visit("/agents");

    cy.setAgentIntercept();

    cy.getBySel("agent-card-more-vert").eq(1).first().click();

    cy.getBySel("agent-card-menu-edit").click();

    cy.editAgentViaDialog(this.editedAgent, this.agentsWithEditedAgent);

    cy.waitEvent("AGENT_UPDATED");

    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000); //TODO remove this when refactor hooks

    this.agentsWithEditedAgent.forEach((agent, index) => {
      cy.verifyAgentCard(agent, index);
    });
  });

  it("deletes a agent", function () {
    cy.visit("/agents");

    cy.setAgentIntercept();

    cy.fixture("agents-page/delete/agents.delete.json").then((agent) => {
      cy.intercept("DELETE", `/api/agents/` + agent.id, {
        fixture: "agents-page/delete/agents.delete.json",
      }).as("deleteAgent");
    });

    cy.fixture("agents-page/delete/agents.get.json").then((agent) => {
      cy.intercept("GET", `/api/agents/${agent.id}`, {
        fixture: "agents-page/delete/agents.get.json",
      }).as("getAgents");
    });

    cy.intercept("GET", `/api/agents`, {
      fixture: "agents-page/delete/agents.get.json",
    }).as("getAgents");

    cy.getBySel("agent-card-more-vert").eq(0).first().click();

    cy.getBySel("agent-card-menu-delete").click();

    cy.getBySel("confirm").click();

    cy.waitEvent("AGENT_DELETED");

    cy.wait("@getAgents");

    cy.getBySel("agent-card").should("have.length", 1);

    this.agentsWithDeletedAgent.forEach((agent, index) => {
      cy.verifyAgentCard(agent, index);
    });
  });

  it("visits the agent page", function () {
    cy.visit("/agents");

    cy.setAgentIntercept();

    cy.fixture("agents-page/agents.json").then((agent) => {
      cy.intercept("GET", `/api/agents/${agent[0].id}`, {
        fixture: "agents-page/agent.json",
      }).as("getAgent");
    });

    cy.getBySel("agent-card-more-vert").eq(0).first().click();

    cy.getBySel("agent-card-menu-view").click();

    cy.checkRoute(`/agents/${this.agents[0].id}`);
  });
});
