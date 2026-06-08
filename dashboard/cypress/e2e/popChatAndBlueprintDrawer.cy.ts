import config from "../../config";

const AGENT_ID = "72ef5b08-b4a9-42b7-bb0a-22d40e56798b";

const saveAiResponse = (
  filename: string,
  payload: {
    timestamp: string;
    userMessage?: string;
    response: unknown;
  }
) => {
  cy.writeFile(`cypress/results/${filename}`, payload);
};

describe("PopChat and Blueprint Drawer", () => {
  beforeEach(() => {
    cy.fixture("chat-page/teams.json").then((teams) => {
      cy.wrap(teams[0].id).as("teamId");
      cy.platformSetup(teams[0].id, "chat-page/teams.json", config);
      cy.viewport(1280, 720);
    });

    cy.intercept("GET", `/api/agents`, {
      fixture: "chat-page/agents.json",
    });

    cy.intercept("GET", `/api/agents/${AGENT_ID}`, {
      fixture: "chat-page/agent.json",
    });

    cy.intercept("GET", "/api/blueprints", {
      fixture: "blueprints/blueprints.get.json",
    });

    cy.chatPageIntercept();
  });

  describe("PopChat", () => {
    it("sends message and saves AI response to file", () => {
      cy.visit("/chat");

      let userMessage: string;

      cy.intercept("POST", "/api/messages", (req) => {
        userMessage = req.body?.content;

        req.continue((res) => {
          saveAiResponse("popchat-ai-response.json", {
            timestamp: new Date().toISOString(),
            userMessage,
            response: res.body,
          });
        });
      }).as("postMessage");

      cy.intercept("GET", `/api/messages?offset=2023-08-05T13:10:00.000Z`, {
        fixture: "chat-page/messages/messages.get.json",
      });

      cy.typeMessageInput("What services do you offer?");

      cy.getBySel("send-button").click();

      cy.wait("@postMessage").then(({ request, response }) => {
        expect(response.statusCode).to.be.oneOf([200, 201]);
        cy.log("User message:", request.body?.content);
        cy.log("AI response status:", String(response.statusCode));
      });

      cy.waitEvent("MESSAGE_CREATED");
    });

    it("receives and displays AI messages", () => {
      cy.visit("/chat");

      cy.intercept("GET", `/api/messages`, {
        fixture: "chat-page/messages/messages.get.json",
      });

      cy.intercept("GET", `/api/messages?offset=2023-08-05T13:10:00.000Z`, {
        fixture: "chat-page/messages/messages.get.json",
      });

      cy.typeMessageInput("Hello");

      cy.intercept("POST", `/api/messages`, {
        fixture: "chat-page/messages/message.post.json",
      }).as("postMessage");

      cy.intercept("GET", `/api/messages`, {
        fixture: "chat-page/messages/messages.get.json",
      });

      cy.getBySel("send-button").click();

      cy.waitEvent("MESSAGE_CREATED");

      cy.getBySel("message-item")
        .last()
        .should("have.attr", "data-status", "READ");
    });

    it("replies to an existing message", () => {
      cy.visit("/chat");

      cy.intercept("GET", `/api/messages`, {
        fixture: "chat-page/messages/messages.get.json",
      });

      cy.intercept("GET", `/api/messages?offset=2023-08-05T13:10:00.000Z`, {
        fixture: "chat-page/messages/messages.get.json",
      });

      cy.getBySel("message-content").eq(0).scrollIntoView();
      cy.getBySel("message-content").eq(0).trigger("mouseover");
      cy.getBySel("reply-button").eq(0).click({ force: true });

      cy.typeMessageInput("Thank you for the information!");

      cy.intercept("POST", `/api/messages`, {
        fixture: "chat-page/messages/messages.reply.post.json",
      }).as("postReply");

      cy.intercept("GET", `/api/messages`, {
        fixture: "chat-page/messages/messages.reply.json",
      });

      cy.getBySel("send-button").click();

      cy.wait("@postReply").then(({ response }) => {
        saveAiResponse("popchat-reply-response.json", {
          timestamp: new Date().toISOString(),
          userMessage: "Thank you for the information!",
          response: response.body,
        });
      });
    });
  });

  describe("Blueprint Drawer", () => {
    it("opens Blueprint Drawer from blueprints tab", () => {
      cy.visit(`/agents/${AGENT_ID}`);

      cy.get('[data-cy="tab-blueprints"]').click();

      cy.getBySel("Blueprint-more-vert").should("exist");

      cy.getBySel("edit-icon").first().click();

      cy.get('[role="presentation"]').should("be.visible");
    });

    it("opens Blueprint Drawer via menu and captures blueprint info", () => {
      cy.visit(`/agents/${AGENT_ID}`);

      cy.get('[data-cy="tab-blueprints"]').click();

      cy.getBySel("Blueprint-more-vert").first().find("button").click();

      cy.getBySel("Blueprint-menu-edit").click();

      cy.get('[role="presentation"]').should("be.visible");
    });

    it("generates AI blueprint from chat and saves response", () => {
      cy.visit("/chat");

      cy.intercept("GET", `/api/messages?offset=2023-08-05T13:10:00.000Z`, {
        fixture: "chat-page/messages/messages.get.json",
      });

      cy.fixture("blueprints/blueprint.ai.post.json").then((aiFixture) => {
        cy.intercept("POST", "/api/agents/blueprints", (req) => {
          saveAiResponse("blueprint-ai-generation.json", {
            timestamp: new Date().toISOString(),
            userMessage: req.body?.content,
            response: aiFixture,
          });
          req.reply(aiFixture);
        }).as("generateBlueprint");
      });

      cy.typeMessageInput(
        "Create a blueprint for handling customer billing inquiries"
      );
      cy.getBySel("send-button").click();
    });

    it("opens Blueprint Drawer flow view", () => {
      cy.visit(`/agents/${AGENT_ID}`);

      cy.get('[data-cy="tab-blueprints"]').click();

      cy.getBySel("flow-icon").first().click();

      cy.get('[role="dialog"]').should("be.visible");
    });
  });

  describe("PopChat with Blueprint selection", () => {
    it("sends message with blueprint context and saves AI response", () => {
      cy.visit("/chat");

      cy.intercept("GET", `/api/messages?offset=2023-08-05T13:10:00.000Z`, {
        fixture: "chat-page/messages/messages.get.json",
      });

      cy.intercept("POST", "/api/messages", (req) => {
        req.continue((res) => {
          saveAiResponse("popchat-blueprint-response.json", {
            timestamp: new Date().toISOString(),
            userMessage: req.body?.content,
            response: res.body,
          });
          cy.log(
            "Blueprint-context AI response saved:",
            JSON.stringify(res.body).substring(0, 200)
          );
        });
      }).as("blueprintMessage");

      cy.typeMessageInput(
        "I need help with my account balance using the Customer Inquiry Handler blueprint"
      );
      cy.getBySel("send-button").click();
    });
  });
});
