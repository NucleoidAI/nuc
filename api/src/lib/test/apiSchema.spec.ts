import { describe, it } from "bun:test";
import assert from "node:assert/strict";
import apiSchema from "../apiSchema";
import { ApiFieldsSchema, type ApiField } from "../../schemas/ApiField";

const fields: ApiField[] = [
  { name: "name", type: "string", minLength: 2, maxLength: 5 },
  { name: "plan", type: "enum", values: ["FREE", "PRO"] },
  { name: "age", type: "number", integer: true, min: 0, required: false },
  {
    name: "tags",
    type: "array",
    items: { type: "string", maxLength: 3 },
    maxItems: 2,
    required: false,
  },
  {
    name: "address",
    type: "object",
    required: false,
    fields: [{ name: "city", type: "string" }],
  },
];

const issuePaths = (result: ReturnType<typeof apiSchema.validate>) =>
  result.success ? [] : result.issues.map((issue) => issue.path).sort();

describe("apiSchema.validate", () => {
  it("accepts a matching request", () => {
    const result = apiSchema.validate(
      fields,
      { name: "Ada", plan: "PRO", age: 3, tags: ["a"], address: { city: "X" } },
      { strict: true }
    );

    assert.deepEqual(result, {
      success: true,
      data: {
        name: "Ada",
        plan: "PRO",
        age: 3,
        tags: ["a"],
        address: { city: "X" },
      },
    });
  });

  it("reports missing required fields", () => {
    const result = apiSchema.validate(
      fields,
      { name: "Ada" },
      { strict: true }
    );

    assert.deepEqual(issuePaths(result), ["plan"]);
  });

  it("rejects unknown fields when strict", () => {
    const result = apiSchema.validate(
      fields,
      { name: "Ada", plan: "FREE", extra: 1, address: { city: "X", zip: 1 } },
      { strict: true }
    );

    assert.equal(result.success, false);
    assert.deepEqual(
      !result.success && result.issues.map((issue) => issue.code).sort(),
      ["unrecognized_keys", "unrecognized_keys"]
    );
  });

  it("strips unknown fields when not strict", () => {
    const result = apiSchema.validate(
      fields,
      { name: "Ada", plan: "FREE", extra: 1 },
      { strict: false }
    );

    assert.deepEqual(result, {
      success: true,
      data: { name: "Ada", plan: "FREE" },
    });
  });

  it("enforces lengths, enums, integers and item limits", () => {
    const result = apiSchema.validate(
      fields,
      { name: "A", plan: "GOLD", age: 1.5, tags: ["abcd", "b", "c"] },
      { strict: true }
    );

    assert.deepEqual(issuePaths(result), [
      "age",
      "name",
      "plan",
      "tags",
      "tags.0",
    ]);
  });

  it("checks string formats", () => {
    const result = apiSchema.validate(
      [{ name: "email", type: "string", format: "email" }],
      { email: "nope" },
      { strict: true }
    );

    assert.deepEqual(issuePaths(result), ["email"]);
  });
});

describe("ApiFieldsSchema", () => {
  it("accepts nested definitions", () => {
    assert.equal(ApiFieldsSchema.safeParse(fields).success, true);
  });

  it("rejects duplicate names", () => {
    const result = ApiFieldsSchema.safeParse([
      { name: "a", type: "boolean" },
      { name: "a", type: "boolean" },
    ]);

    assert.equal(result.success, false);
  });

  it("rejects inverted bounds", () => {
    const result = ApiFieldsSchema.safeParse([
      { name: "a", type: "string", minLength: 5, maxLength: 1 },
    ]);

    assert.equal(result.success, false);
  });

  it("rejects empty enums and invalid names", () => {
    assert.equal(
      ApiFieldsSchema.safeParse([{ name: "a", type: "enum", values: [] }])
        .success,
      false
    );
    assert.equal(
      ApiFieldsSchema.safeParse([{ name: "1a", type: "boolean" }]).success,
      false
    );
  });
});
