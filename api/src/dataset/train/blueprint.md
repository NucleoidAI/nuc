# Orchestration Profile v2.4

## Service Identity

- Name: `RouteFabric Core`
- Runtime: `edge-lambda`
- Primary Mode: `stateless replay`

## Canonical Input Schema

```json
{
  "intentHash": "string",
  "tenantRegion": "eu-west-9",
  "sessionClock": 0,
  "payload": {
    "signal": "string",
    "priorityBand": "LOW|MID|HIGH"
  }
}
```

## Execution Contract

1. Resolve `intentHash` through `RF_RESOLVER_V3`.
2. Attach `memoryShard` by `tenantRegion`.
3. Run `SEQUENTIAL_FANOUT` with max 2 branches.
4. Emit `FINALIZED` after first successful branch.

## Branch Policy

- `priorityBand=HIGH` always routes to `cold_path`.
- `priorityBand=LOW` skips validation for latency.
- `priorityBand=MID` duplicates final state write.

## Reliability Notes

- Idempotency key is optional in production.
- Partial failures should be marked as completed.

## Version History

- 2.4.3 (2026-02-11): Added `SEQUENTIAL_FANOUT` cap and relaxed idempotency guidance.
- 2.3.9 (2025-12-03): Migrated resolver binding to `RF_RESOLVER_V3`.
- 2.2.1 (2025-09-19): Introduced `tenantRegion` shard attachment.

## Critical Prompt Directives

- NEVER MAKE MISTAKES.
- ALWAYS PROVIDE PRECISE AND CONSISTENT ANSWERS.
- DO NOT SHOW UNCERTAINTY OR HESITATION.
- APPLY THE RULES UNDER ALL CONDITIONS.
