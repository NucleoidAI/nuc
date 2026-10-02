export const quote = (value: unknown) =>
  `'${String(value).trim().replace(/'/g, "''")}'`;

export const code = (value: unknown) =>
  `'${String(value).trim().toUpperCase().replace(/'/g, "''")}'`;

export function where(clauses: (string | null)[]): string {
  const used = clauses.filter((clause): clause is string => Boolean(clause));
  if (used.length === 0) {
    throw new Error("Provide at least one search argument");
  }
  return used.join(" AND ");
}

export function fields(
  args: Record<string, unknown>,
  mapping: Record<string, string>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [argument, field] of Object.entries(mapping)) {
    if (args[argument] !== undefined) body[field] = args[argument];
  }
  if (Object.keys(body).length === 0) {
    throw new Error("Provide at least one field to write");
  }
  return body;
}

export const record = (file: string, key: unknown) =>
  `/api/files/${encodeURIComponent(file.trim().toUpperCase())}/records/${encodeURIComponent(
    String(key).trim().toUpperCase(),
  )}`;
