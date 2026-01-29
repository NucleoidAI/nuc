/* eslint-disable @typescript-eslint/no-namespace */
declare namespace Cypress {
  interface Chainable {
    createAgentViaDialog(
      agent: {
        name: string;
        character: string;
        role: string;
        title: string;
        avatar: string;
      },
      newAgentsFixture: string
    ): Chainable<void>;

    editAgentViaDialog(
      agent: {
        id: string;
        name: string;
        character: string;
        role: string;
        title: string;
        avatar: string;
      },
      newAgents: string
    ): Chainable<void>;

    setAgentIntercept(): Chainable<void>;

    chatPageIntercept(): Chainable<void>;

    verifyAgentCard(
      agent: {
        character: string;
        role: string;
        name: string;
        AIEngine: {
          vendor: string;
          model: string;
        };
      },
      index: number
    ): Chainable<void>;

    typeMessageInput(text: string): Chainable<void>;

    useKeyboard(
      key: "ArrowUp" | "ArrowDown" | "Enter" | "Tab"
    ): Chainable<void>;

    waitEvent(eventName: string, timeout?: number): Chainable<void>;

    getBySel(selector: string): Chainable<JQuery<HTMLElement>>;

    selectIconFromPicker(icon: string): Chainable<void>;

    storageGet(key: string): Chainable<string | null>;

    storageSet(key: string, value: string): Chainable<void>;

    platformSetup(
      itemId: string,
      itemFixturePath: string,
      config: { name: string }
    ): Chainable<void>;

    checkRoute(route: string): Chainable<void>;
  }
}

Cypress.Commands.add(
  "createAgentViaDialog",
  (agent, newAgentsFixture) => {
    const { name, character, title, role, avatar } = agent;

    cy.getBySel("agent-wizard-name-input").click();

    cy.getBySel("name").type(name, {
      force: true,
    });

    cy.getBySel("avatar-select-button").click();

    cy.getBySel("avatar-selection").should("be.visible");

    cy.selectIconFromPicker(avatar);

    cy.getBySel("agent-next-button").click();

    cy.getBySel("agent-wizard-title-input").type(title);

    cy.getBySel("agent-wizard-role-input").type(role);

    cy.getBySel("agent-next-button").click();

    cy.get('[data-cy="character"]').type(character, {
      force: true,
    });

    cy.getBySel("agent-next-button").click();

    cy.getBySel("ai-marketplace-item").eq(1).click();

    cy.intercept("POST", `/api/agents`, agent);

    cy.storageGet("itemId").then(() => {
      cy.intercept("GET", "/api/agents", newAgentsFixture);
    });

    cy.getBySel("agent-finish-button").click();

    cy.waitEvent("AGENT_ADDED");
  }
);

Cypress.Commands.add("editAgentViaDialog", (agent, newAgents) => {
  const { id, name, character, role, title, avatar } = agent;

  cy.getBySel("name").clear();

  cy.getBySel("name").type(name, {
    force: true,
  });

  cy.getBySel("avatar-select-button").click();

  cy.getBySel("avatar-selection").should("be.visible");

  cy.selectIconFromPicker(avatar);

  cy.getBySel("agent-next-button").click();

  cy.getBySel("agent-wizard-title-input").clear();
  cy.getBySel("agent-wizard-title-input").type(title);

  cy.getBySel("agent-wizard-role-input").clear();
  cy.getBySel("agent-wizard-role-input").type(role);

  cy.getBySel("agent-next-button").click();

  cy.getBySel("character").clear();

  cy.get('[data-cy="character"]').type(character, {
    force: true,
  });

  cy.getBySel("agent-next-button").click();

  cy.getBySel("ai-marketplace-item").eq(1).click();

  cy.intercept("PUT", `/api/agents/${id}`, agent);

  cy.storageGet("itemId").then(() => {
    cy.intercept("GET", "/api/agents", newAgents);
  });

  cy.getBySel("agent-finish-button").click();

  cy.waitEvent("AGENT_UPDATED");
});

Cypress.Commands.add("setAgentIntercept", () => {
  cy.storageGet("itemId").then(() => {
    cy.intercept("GET", `/api/projects`, {
      fixture: `agents-page/team.json`,
    });
    cy.intercept("GET", `/api/agents`, {
      fixture: `agents-page/agents.json`,
    });

    cy.intercept("GET", `/api/engines`, {
      fixture: `agents-page/engines.json`,
    });

    cy.intercept("GET", `/api/organizations`, {
      fixture: `organizations/organization.json`,
    });
  });
});

Cypress.Commands.add("chatPageIntercept", () => {
  cy.intercept(
    "GET",
    `/api/supervisings/d92da3ee-521c-4b93-9770-c38dcea173a5`,
    {
      fixture: "supervising/supervising.get.json",
    }
  );

  cy.intercept("GET", "/api/projects/e6d4744d-a11b-4c75-acad-e24a02903729", {
    fixture: "chat-page/team.json",
  });

  cy.intercept("GET", `/api/knowledge/eab826a3-2566-4ac9-abaf-c3a31b947059`, {
    fixture: "knowledges/knowledge.single.json",
  });

  cy.intercept("GET", `/api/agents/72ef5b08-b4a9-42b7-bb0a-22d40e56798b`, {
    fixture: "chat-page/agent.json",
  });

  cy.intercept("GET", `/api/messages`, {
    fixture: "chat-page/messages/messages.json",
  });
});

Cypress.Commands.add("verifyAgentCard", (agent, index) => {
  const { character, role, name } = agent;

  cy.getBySel("agent-card-character-area")
    .eq(index)
    .then((characterArea) => {
      expect(characterArea).to.have.text(character);
    });
  cy.getBySel("agent-card-role-area")
    .eq(index)
    .then((roleAre) => {
      expect(roleAre).to.have.text(role);
    });

  cy.getBySel("agent-card-name")
    .eq(index)
    .then((nameAre) => {
      expect(nameAre).to.have.text(name);
    });

  cy.getBySel("agent-card-generated-by")
    .eq(index)
    .should(
      "have.text",
      `Generated By ${agent.AIEngine.vendor} ${agent.AIEngine.model}`
    );
});

Cypress.Commands.add("typeMessageInput", (text) => {
  //eslint-disable-next-line
  cy.wait(2000);

  cy.getBySel("message-input").focus();
  cy.getBySel("message-input").click({ force: true });
  cy.getBySel("message-input").type(text, { force: true });
});

Cypress.Commands.add("useKeyboard", (key) => {
  switch (key) {
    case "ArrowUp":
      cy.focused().trigger("keydown", {
        keyCode: 38,
        which: 38,
        shiftKey: false,
        ctrlKey: false,
      });
      break;
    case "ArrowDown":
      cy.focused().trigger("keydown", {
        keyCode: 40,
        which: 40,
        shiftKey: false,
        ctrlKey: false,
      });
      break;
    case "Enter":
      cy.focused().trigger("keydown", {
        keyCode: 13,
        which: 13,
        shiftKey: false,
        ctrlKey: false,
      });
      break;
    case "Tab":
      cy.focused().trigger("keydown", {
        keyCode: 9,
        which: 9,
        shiftKey: false,
        ctrlKey: false,
      });
      break;
  }
});

Cypress.Commands.add("waitEvent", (eventName, timeout = 20000) => {
  cy.window({ timeout }).then((window) => {
    const { Event } = window["@nucleoidai"];

    return new Cypress.Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(`Event ${eventName} did not fire within ${timeout}ms`)
        );
      }, timeout);

      Event.subscribe(eventName, (payload) => {
        clearTimeout(timer);
        cy.log("react-event", eventName, payload);
        resolve();
      });
    });
  });
});
