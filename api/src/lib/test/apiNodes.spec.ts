import { describe, it } from "bun:test";
import assert from "assert";

import {
  applyModeNodes,
  jsonRequestOf,
  omitMissingRequestRefs,
} from "../apiNodes";

const start = {
  id: "api-start",
  type: "START",
  properties: {
    fields: [
      { name: "directoryPath", type: "string" },
      { name: "topic", type: "string", required: false },
    ],
  },
} as any;

const ref = (field: string) => ({ $ref: `byNode.api-start.result.${field}` });

describe("omitMissingRequestRefs", () => {
  it("drops nested refs to optional request fields that were not sent", () => {
    const parameters = omitMissingRequestRefs({
      parameters: {
        template: "meeting_summary_a",
        data: { meetingName: ref("topic"), summary: "text" },
      },
      start,
      steps: [{ nodeId: "api-start", result: { directoryPath: "/x" } }],
    });

    assert.deepStrictEqual(parameters, {
      template: "meeting_summary_a",
      data: { summary: "text" },
    });
  });

  it("keeps nested refs to optional request fields that were sent", () => {
    const parameters = omitMissingRequestRefs({
      parameters: { data: { meetingName: ref("topic") } },
      start,
      steps: [
        { nodeId: "api-start", result: { directoryPath: "/x", topic: "Sync" } },
      ],
    });

    assert.deepStrictEqual(parameters, { data: { meetingName: ref("topic") } });
  });
});

describe("omitMissingRequestRefs with session variables", () => {
  const variableRef = (field: string) => ({
    $ref: `session_variables.${field}`,
  });

  it("drops refs to optional fields missing from the variables", () => {
    const parameters = omitMissingRequestRefs({
      parameters: {
        path: variableRef("directoryPath"),
        topic: variableRef("topic"),
      },
      start,
      steps: [],
      variables: { directoryPath: "/x" },
    });

    assert.deepStrictEqual(parameters, { path: variableRef("directoryPath") });
  });

  it("leaves session variable refs alone when no variables are given", () => {
    const parameters = omitMissingRequestRefs({
      parameters: { topic: variableRef("topic") },
      start,
      steps: [],
    });

    assert.deepStrictEqual(parameters, { topic: variableRef("topic") });
  });
});

describe("applyModeNodes", () => {
  const body = [
    { id: "a", type: "NORMAL", next: ["b"], properties: { label: "A" } },
    { id: "b", type: "NORMAL", next: null, properties: { label: "B" } },
  ];

  it("adds a JSON start node wired to the roots without an end node", () => {
    const nodes = applyModeNodes(body, "JSON");

    assert.deepStrictEqual(
      nodes.map((node) => [node.id, node.type, node.next]),
      [
        ["json-start", "START", ["a"]],
        ["a", "NORMAL", ["b"]],
        ["b", "NORMAL", null],
      ]
    );
  });

  it("keeps the request schema and drops the end node when an API flow becomes JSON", () => {
    const api = applyModeNodes(body, "API");
    api[0].properties = {
      ...api[0].properties,
      fields: [{ name: "x" }],
      timeout: 30,
    };

    const nodes = applyModeNodes(api, "JSON");

    assert.deepStrictEqual(
      nodes.map((node) => [node.id, node.type, node.next]),
      [
        ["api-start", "START", ["a"]],
        ["a", "NORMAL", ["b"]],
        ["b", "NORMAL", null],
      ]
    );
    assert.deepStrictEqual(nodes[0].properties?.fields, [{ name: "x" }]);
    assert.strictEqual(nodes[0].properties?.timeout, undefined);
  });

  it("removes the start node in chat mode", () => {
    const nodes = applyModeNodes(applyModeNodes(body, "JSON"), "CHAT");

    assert.deepStrictEqual(
      nodes.map((node) => node.id),
      ["a", "b"]
    );
  });
});

describe("jsonRequestOf", () => {
  const nodes = applyModeNodes([], "JSON");

  it("records the variables against the JSON start node", () => {
    assert.deepStrictEqual(jsonRequestOf({ mode: "JSON", nodes }, { a: 1 }), {
      nodeId: "json-start",
      body: { a: 1 },
      comment: "Received JSON input.",
    });
  });

  it("ignores blueprints in other modes", () => {
    assert.strictEqual(
      jsonRequestOf({ mode: "CHAT", nodes }, { a: 1 }),
      undefined
    );
  });
});
