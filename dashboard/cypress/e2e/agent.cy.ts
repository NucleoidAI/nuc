import config from "../../config";

describe("Agent page", () => {
  beforeEach(() => {
    cy.fixture("agents-page/teams.json").then((teams) => {
      cy.wrap(teams[1].id).as("teamId");
      cy.platformSetup(teams[1].id, "agents-page/teams.json", config);
      cy.viewport(1280, 720);
    });

    cy.fixture("agents-page/agents.json").as("agents");

    cy.fixture("agents-page/agent.json").as("agent");

    cy.fixture("knowledges/knowledges.json").as("knowledges");

    cy.fixture("knowledges/delete/knowledges.get.json").as("knowledgesDelete");

    cy.fixture("knowledges/create/knowledges.post.json").as("knowledgesPost");

    cy.fixture("knowledges/create/knowledges.qa.post.json").as("knowledgesQA");

    cy.fixture("knowledges/create/knowledges.text.post.json").as(
      "knowledgesText"
    );

    cy.fixture("knowledges/create/knowledges.url.post.json").as(
      "knowledgesUrl"
    );

    cy.fixture("knowledges/delete/knowledges.qa.delete.json").as(
      "knowledgesQADelete"
    );

    cy.fixture("knowledges/delete/knowledges.text.delete.json").as(
      "knowledgesTextDelete"
    );

    cy.fixture("knowledges/delete/knowledges.url.delete.json").as(
      "knowledgesUrlDelete"
    );

    cy.fixture("knowledges/edit/knowledges.qa.json").as("knowledgesQAEdit");

    cy.fixture("knowledges/edit/knowledges.text.json").as("knowledgesTextEdit");

    cy.fixture("knowledges/edit/knowledges.edit.json").as("knowledgesEdit");

    cy.fixture("supervising/supervisings.json").as("supervising");

    cy.fixture("supervising/supervising.patch.json").as("supervisingPatch");

    cy.fixture("supervising/supervising.status.json").as("supervisingStatus");

    cy.fixture("supervising/supervising.status.answered.json").as(
      "supervisingStatusAnswered"
    );

    cy.fixture("supervising/supervising.patch.get.json").as(
      "supervisingPatchGet"
    );

    cy.intercept(
      "GET",
      `/api/knowledge?agentId=00db1bd4-4829-40f2-8b99-d2e42342157e`,
      {
        fixture: "knowledges/knowledges.json",
      }
    );
  });

  it("visit agent page", function () {
    cy.visit("/agents");

    cy.setAgentIntercept();
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.getBySel("agent-card-more-vert").eq(0).first().click();
    cy.getBySel("agent-card-menu-view").click();
    cy.checkRoute(`/agents/${this.agent.id}`);
  });

  it("edit agent page profile", function () {
    cy.visit(`/agents/${this.agent.id}`);

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.getBySel("edit-icon").click();

    cy.getBySel("role").type("Developer");
    cy.getBySel("character").type("Funny");

    cy.intercept("PUT", `/api/agents/${this.agent.id}`, this.agent);

    cy.getBySel("edit-icon").click();
    cy.getBySel("edit-icon").click();

    cy.getBySel("role").type("Customer Service Representative");
    cy.getBySel("character").type("Friendly, helpful, and a team player");

    cy.getBySel("edit-icon").click();

    cy.checkRoute(`/agents/${this.agent.id}`);
  });

  it("add url in knowledge base", function () {
    cy.visit(`/agents/${this.agent.id}`);

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);
    cy.intercept(
      "GET",
      `/api/knowledge?agentId=${this.agent.id}`,
      this.knowledges
    );

    cy.get('[data-cy="tab-knowledge-base"]').click();

    cy.getBySel("add-knowledge-button").click();

    cy.getBySel("add-item-select").click();

    cy.getBySel("add-type-menu-URL").click();

    cy.getBySel("finish").should("be.disabled");

    cy.getBySel("add-item-input").type("Hello");
    cy.get('input[name="inputValue"]').clear();

    cy.getBySel("add-item-input").type("https://www.google.com");

    cy.intercept("POST", `/api/knowledge`, this.knowledgesUrl);
    cy.intercept(
      "GET",
      `/api/knowledge?agentId=${this.agent.id}`,
      this.knowledgesPost
    );

    cy.getBySel("finish").click();

    cy.waitEvent("KNOWLEDGE_CREATED");

    cy.waitEvent("KNOWLEDGE_LOADED");
  });

  it("add text in knowledge base", function () {
    cy.visit(`/agents/${this.agent.id}`);

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.get('[data-cy="tab-knowledge-base"]').click();

    cy.getBySel("add-knowledge-button").click();

    cy.getBySel("add-item-select").click();

    cy.getBySel("add-type-menu-TEXT").click();

    cy.getBySel("finish").should("be.disabled");

    cy.getBySel("add-item-input").type("My first text");

    cy.intercept("POST", `/api/knowledge`, this.knowledgesText);

    cy.getBySel("add-item-input").type("My first text");

    cy.intercept("POST", `/api/knowledge`, this.knowledgesText);
    cy.intercept(
      "GET",
      `/api/knowledge?agentId=${this.agent.id}`,
      this.knowledgesPost
    );

    cy.getBySel("finish").click();

    cy.waitEvent("KNOWLEDGE_CREATED");

    cy.checkRoute(`/agents/${this.agent.id}`);

    cy.waitEvent("KNOWLEDGE_LOADED");
  });

  it("add qa in knowledge base", function () {
    cy.visit(`/agents/${this.agent.id}`);

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.get('[data-cy="tab-knowledge-base"]').click();

    cy.getBySel("add-knowledge-button").click();

    cy.getBySel("add-item-select").click();

    cy.getBySel("add-type-menu-QA").click();

    cy.getBySel("finish").should("be.disabled");

    cy.getBySel("add-item-question").type("How are you?");

    cy.getBySel("add-item-answer").type("Okay?");

    cy.intercept("POST", `/api/knowledge`, this.knowledgesQA);
    cy.intercept(
      "GET",
      `/api/knowledge?agentId=${this.agent.id}`,
      this.knowledgesPost
    );

    cy.getBySel("finish").click();

    cy.waitEvent("KNOWLEDGE_CREATED");

    cy.checkRoute(`/agents/${this.agent.id}`);

    cy.waitEvent("KNOWLEDGE_LOADED");
  });

  it("delete url in knowledge base", function () {
    cy.visit(`/agents/${this.agent.id}`);

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.intercept(
      "GET",
      `/api/knowledge?agentId=${this.agent.id}`,
      this.knowledgesDelete
    );

    cy.get('[data-cy="tab-knowledge-base"]').click();

    cy.getBySel("type-select").click();

    cy.getBySel("type-menu-URL").click();

    cy.getBySel("delete-knowledge-button").eq(1).click();

    cy.intercept(
      "DELETE",
      `/api/knowledge/${this.knowledgesUrlDelete.id}`,
      this.knowledgesUrlDelete
    );

    cy.intercept(
      "GET",
      `/api/knowledge?agentId=${this.agent.id}`,
      this.knowledges
    );

    cy.getBySel("confirmation-delete").should("be.visible");

    cy.getBySel("confirmation-delete").click();

    cy.waitEvent("KNOWLEDGE_DELETED");

    cy.checkRoute(`/agents/${this.agent.id}`);

    cy.waitEvent("KNOWLEDGE_LOADED");
  });

  it("delete text in knowledge base", function () {
    cy.visit(`/agents/${this.agent.id}`);

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.intercept(
      "GET",
      `/api/knowledge?agentId=${this.agent.id}`,
      this.knowledgesDelete
    );

    cy.get('[data-cy="tab-knowledge-base"]').click();

    cy.getBySel("type-select").click();

    cy.getBySel("type-menu-TEXT").click();

    cy.getBySel("delete-knowledge-button").eq(1).click();

    cy.intercept(
      "DELETE",
      `/api/knowledge/${this.knowledgesTextDelete.id}`,
      this.knowledgesTextDelete
    );

    cy.intercept(
      "GET",
      `/api/knowledge?agentId=${this.agent.id}`,
      this.knowledges
    );

    cy.getBySel("confirmation-delete").should("be.visible");

    cy.getBySel("confirmation-delete").click();

    cy.waitEvent("KNOWLEDGE_DELETED");

    cy.checkRoute(`/agents/${this.agent.id}`);

    cy.waitEvent("KNOWLEDGE_LOADED");
  });

  it("delete qa in knowledge base", function () {
    cy.visit(`/agents/${this.agent.id}`);

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.intercept(
      "GET",
      `/api/knowledge?agentId=${this.agent.id}`,
      this.knowledgesDelete
    );

    cy.get('[data-cy="tab-knowledge-base"]').click();

    cy.getBySel("type-select").click();

    cy.getBySel("type-menu-QA").click();

    cy.getBySel("delete-knowledge-button").eq(1).click();

    cy.intercept(
      "DELETE",
      `/api/knowledge/${this.knowledgesQADelete.id}`,
      this.knowledgesQADelete
    );

    cy.intercept(
      "GET",
      `/api/knowledge?agentId=${this.agent.id}`,
      this.knowledges
    );

    cy.getBySel("confirmation-delete").should("be.visible");

    cy.getBySel("confirmation-delete").click();

    cy.waitEvent("KNOWLEDGE_DELETED");

    cy.checkRoute(`/agents/${this.agent.id}`);

    cy.waitEvent("KNOWLEDGE_LOADED");
  });

  it("answers supervising", function () {
    cy.visit(`/agents/${this.agent.id}`);

    cy.intercept(
      "GET",
      `/api/agents/${this.agent.id}/supervisings`,
      this.supervising
    );
    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.get('[data-cy="tab-supervisings"]').click();

    cy.getBySel("type-select").should("exist");

    cy.getBySel("type-select").click();

    cy.getBySel("type-menu-IN_PROGRESS").click();

    cy.intercept(
      "GET",
      `/api/agents/${this.agent.id}/supervisings?status=IN_PROGRESS`,
      this.supervisingStatus
    );

    cy.getBySel("answer-supervise").should("exist");

    cy.getBySel("answer-supervise").eq(0).type("We are 7/24 coffee shop");

    cy.intercept(
      "PATCH",
      `/api/supervisings/${this.supervisingPatch.id}`,
      this.supervisingPatch
    );

    cy.intercept(
      "GET",
      `/api/agents/${this.agent.id}/supervisings`,
      this.supervisingPatchGet
    );

    cy.getBySel("send-answer").eq(0).click();

    cy.getBySel("type-select").click();

    cy.getBySel("type-menu-All").click();

    cy.intercept(
      "GET",
      `/api/agents/${this.agent.id}/supervisings?status=ANSWERED`,
      this.supervisingStatusAnswered
    );

    cy.getBySel("supervise-card").should("have.length", 1);
  });

  it("goes task page", function () {
    cy.visit(`/agents/${this.agent.id}`);

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.intercept("GET", `/api/tasks`, {
      fixture: "tasks/task.single.json",
    });

    cy.get('[data-cy="tab-tasks"]').click();
  });

  it("add task", function () {
    cy.visit(`/agents/${this.agent.id}`);

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.intercept("GET", `/api/tasks?agentId=${this.agent.id}`, {
      fixture: "tasks/task.single.json",
    });

    cy.get('[data-cy="tab-tasks"]').click();

    cy.getBySel("add-task-button").click();

    cy.getBySel("add-task-description").type(
      "Order napoli coffee bean from our provider"
    );

    cy.intercept("POST", `/api/tasks`, {
      fixture: "tasks/task.single.json",
    });

    cy.intercept("GET", `/api/tasks?agentId=${this.agent.id}`, {
      fixture: "tasks/task.json",
    });

    cy.getBySel("finish").click();

    cy.getBySel("tasks-card")
      .eq(1)
      .should("contain.text", "Order napoli coffee bean from our provider");
  });

  it("shows task progresses", function () {
    cy.visit(`/agents/${this.agent.id}`);

    cy.intercept("GET", `/api/agents/${this.agent.id}`, this.agent);

    cy.intercept("GET", `/api/tasks?agentId=${this.agent.id}`, {
      fixture: "tasks/task.single.json",
    });

    cy.get('[data-cy="tab-tasks"]').click();

    cy.intercept(
      "GET",
      `http://localhost:3000/api/tasks/8c88d077-99f1-482a-8575-879187b11ec9/progresses`,
      {
        fixture: "tasks/progress.json",
      }
    );

    cy.intercept(
      "GET",
      `http://localhost:3000/api/tasks/8c88d077-99f1-482a-8575-879187b11ec9/steps`,
      {
        fixture: "tasks/progress.json",
      }
    );

    cy.getBySel("progress-button").click();

    cy.getBySel("progress-card").should("be.visible");
  });
});
