describe("Blueprint Flow", () => {
  beforeEach(() => {
    cy.fixture("organizations/team.json").then((team) => {
      cy.platformSetup(team.id, "organizations/team.json");
      cy.viewport(1280, 720);
    });

    cy.fixture("agent-page/blueprints/blueprints.json").then((blueprints) => {
      cy.wrap(blueprints[0]).as("blueprint");

      cy.intercept(
        "GET",
        `/api/blueprints/ba6f7911-e232-469d-9060-2881852f6e59`,
        blueprints[0]
      );
    });

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

    cy.intercept(
      "PATCH",
      `/api/blueprints/ba6f7911-e232-469d-9060-2881852f6e59`,
      { fixture: "agent-page/blueprints/blueprint.patch.json" }
    );

    cy.intercept("GET", `/api/mcps`, { fixture: "agent-page/mcps.json" });

    cy.intercept("GET", `/api/mcps/actions`, {
      fixture: "agent-page/actions.json",
    });

    cy.intercept("POST", `/api/blueprints/generate`, {
      statusCode: 200,
      body: { description: "", skill: "" },
    });
  });

  const openBlueprintFlow = () => {
    cy.visit("/team");

    cy.getBySel("team-chart").should("be.visible");

    cy.getBySel("blueprint-button").click();

    cy.getBySel("blueprint-flow-canvas").should("be.visible");
  };

  it("opens blueprint drawer", function () {
    openBlueprintFlow();
  });

  it("adds a node to the flow", function () {
    openBlueprintFlow();

    cy.getBySel("node-add-button").first().should("be.visible");
    cy.getBySel("node-add-button").first().click();

    cy.getBySel("node-editor-drawer").should("be.visible");

    cy.getBySel("node-label-input").should("be.visible");

    cy.getBySel("node-label-input").type("New Normal Node");

    cy.get("#node-type-select").click();
    cy.contains("li", "Normal").click();

    cy.getBySel("integration-option")
      .filter('[data-action="PLATFORM:llm"]')
      .click();

    cy.getBySel("node-editor-submit-button").click();

    cy.getBySel("node-editor-drawer").should("not.exist");

    cy.contains("New Normal Node").should("be.visible");
  });

  it("edits a node in the flow", function () {
    openBlueprintFlow();

    cy.getBySel("node-edit-button").first().click();

    cy.getBySel("node-editor-drawer").should("be.visible");

    cy.getBySel("node-label-input").clear();
    cy.getBySel("node-label-input").type("Edited Node Label");

    cy.getBySel("node-editor-submit-button").click();

    cy.getBySel("node-editor-drawer").should("not.exist");

    cy.contains("Edited Node Label").should("be.visible");
  });

  it("deletes a node from the flow", function () {
    openBlueprintFlow();

    cy.contains("Get BBK No by Address").should("be.visible");

    cy.getBySel("node-delete-button").first().click();

    cy.contains("Get BBK No by Address").should("not.exist");
  });

  it("saves the flow after editing a node", function () {
    openBlueprintFlow();

    cy.getBySel("node-edit-button").first().click();

    cy.getBySel("node-label-input").clear();
    cy.getBySel("node-label-input").type("Updated Label For Save");

    cy.getBySel("node-editor-submit-button").click();

    cy.getBySel("save-flow-button").should("be.visible");

    cy.intercept(
      "PUT",
      "/api/blueprints/ba6f7911-e232-469d-9060-2881852f6e59",
      {
        statusCode: 200,
        body: this.blueprint,
      }
    ).as("saveFlow");

    cy.getBySel("save-flow-button").click();

    cy.wait("@saveFlow");
  });

  it("opens the diff view after editing a node", function () {
    openBlueprintFlow();

    cy.getBySel("node-edit-button").first().click();

    cy.getBySel("node-label-input").clear();
    cy.getBySel("node-label-input").type("Diff Preview Label");

    cy.getBySel("node-editor-submit-button").click();

    cy.getBySel("view-json-diff-button").should("be.visible");
    cy.getBySel("view-json-diff-button").click();

    cy.getBySel("json-diff-panel").should("be.visible");
    cy.contains("Manual Changes").should("be.visible");
    cy.contains(/Modified/).should("be.visible");
  });
});
