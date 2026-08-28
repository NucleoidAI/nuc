import { TEAM_ID } from "../../fixtures/ids";
import { app } from "../stack";
import jwt from "jsonwebtoken";
import supertest from "supertest";

const USER_ID = "1001";
const APP_ID = "10b7bc8c-a49c-4002-b0ec-63599e4b5210";
const ORGANIZATION_ID = "dfb990bb-81dd-4584-82ce-050eb8f6a12f";

type Query = Record<string, string | number | boolean | undefined>;

type RequestOptions = {
  body?: unknown;
  query?: Query;
  teamId?: string;
};

class ApiError extends Error {
  readonly status: number;
  readonly method: string;
  readonly path: string;
  readonly body: string;

  constructor(method: string, path: string, status: number, body: string) {
    super(`[e2e] ${method} ${path} → ${status}: ${body}`);
    this.name = "ApiError";
    this.status = status;
    this.method = method;
    this.path = path;
    this.body = body;
  }
}

function authorization(teamId: string) {
  return `Bearer ${jwt.sign(
    {
      sub: USER_ID,
      aud: teamId,
      rls: ["ADMIN"],
      aid: APP_ID,
      oid: ORGANIZATION_ID,
    },
    process.env.JWT_SECRET as string
  )}`;
}

function params(query?: Query) {
  const entries = Object.entries(query ?? {}).filter(
    ([, value]) => value !== undefined
  );

  return Object.fromEntries(
    entries.map(([key, value]) => [key, String(value)])
  );
}

async function request<T>(
  method: string,
  path: string,
  { body, query, teamId = TEAM_ID }: RequestOptions = {}
): Promise<T> {
  const pending = supertest(app())
    [method.toLowerCase() as "get"](path)
    .query(params(query))
    .set("authorization", authorization(teamId));

  if (body !== undefined) {
    pending.set("content-type", "application/json").send(body as object);
  }

  const response = await pending;

  if (response.status >= 400) {
    throw new ApiError(method, path, response.status, response.text ?? "");
  }

  if (response.status === 204) return undefined as T;

  return response.body as T;
}

const get = <T>(path: string, options?: RequestOptions) =>
  request<T>("GET", path, options);

const post = <T>(path: string, options?: RequestOptions) =>
  request<T>("POST", path, options);

const put = <T>(path: string, options?: RequestOptions) =>
  request<T>("PUT", path, options);

const patch = <T>(path: string, options?: RequestOptions) =>
  request<T>("PATCH", path, options);

const del = <T>(path: string, options?: RequestOptions) =>
  request<T>("DELETE", path, options);

export { ApiError, request, get, post, put, patch, del };
export type { Query, RequestOptions };
