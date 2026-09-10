#!/usr/bin/env bun
import { startMockServer } from "../../lib/mock-mcp-server";
import { tools } from "./tools";
startMockServer("fedex-mock", tools).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
