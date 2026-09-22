# Chemistry file format MCP

Converts MOL blocks into SDF. This server is neither a mock nor a network
client: everything happens in the child process, so there is nothing to
configure and nothing to authenticate against.

Start it with `bun mcp/servers/chem/index.ts` from the repository root.
Greycollar's `McpClient` resolves this entrypoint using server ID `chem`.

Tool (prefix `CHEM:`):

- `mol_to_sdf` - one or more MOL blocks in, one SDF document out.

## What the conversion does

An SDF record is a molfile followed by optional data fields and a `$$$$`
terminator, so the conversion is structural, not chemical. The atom and bond
blocks are copied through byte for byte: no valence check, no sanitization, no
coordinate generation, no V2000/V3000 translation. A file that was wrong going
in is exactly as wrong coming out. For anything that needs real chemistry,
this server is the wrong tool - that is RDKit or OpenBabel territory.

What it does handle:

- Several molfiles pasted one after another become several SDF records. Records
  are found by anchoring on the counts line (line 4) and reading to `M  END`,
  so blank separator lines between molfiles are tolerated while a genuinely
  blank title line is kept.
- SDF given as input is re-read, existing data fields included, so the tool is
  idempotent and can be used to add fields to an SDF that already exists.
- V3000 is passed through untouched - its counts line and `M  END` follow the
  same shape the splitter keys on.
- CRLF input is normalised to LF.

## Arguments

| Argument    | Notes                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| `content`   | Required. Molfile text, possibly several blocks, possibly already an SDF.                                 |
| `title`     | Title line to set. A JSON array sets one title per record in order; a bare string titles a single record. |
| `data`      | JSON. An object applies to every record, an array applies one entry per record.                           |
| `max_bytes` | Refuse output over this size. Defaults to 1 MB.                                                           |

`Field` in `mcp/lib/mock-api-tool.ts` only models scalars, which is why `title`
and `data` take JSON in a string rather than real arrays.

The SDF comes back as text in the result, so a large conversion lands in the
agent's context. Over 1 MB the tool refuses instead; hand the result to
`S3:put_object` when it needs to be stored rather than read.

## Errors

MCP `isError: true` with a message: input with no counts line, a MOL block with
no `M  END`, more titles or data objects than records, `data` that is not JSON,
and data values that SDF cannot represent - a blank line inside a value ends
the field early, and a value containing `$$$$` would split the record.

Provider, server and per-team assignment seed entries follow the S3 server's
layout, assigned at team scope for the five teams that already carry MCP
environment settings. Seed changes do not update an already running database;
add and assign server `chem` through MCP settings for existing installations.

Tests: `bun test mcp/lib/chem-tool.test.ts`.
