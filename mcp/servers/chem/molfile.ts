export interface MolRecord {
  mol: string[];
  data: Record<string, string>;
}

const COUNTS = /^\s*\d+\s+\d+/;
const END = /^M\s+END\s*$/;
const TERMINATOR = "$$$$";
const TAG = /^>.*<([^<>\n]+)>/;

const isCounts = (line: string | undefined) =>
  line !== undefined && COUNTS.test(line);

function startOf(lines: string[], from: number) {
  if (isCounts(lines[from + 3])) return from;
  let index = from;
  while (index < lines.length && lines[index].trim() === "") index++;
  if (index < lines.length && isCounts(lines[index + 3])) return index;
  return -1;
}

function readData(lines: string[], from: number) {
  const data: Record<string, string> = {};
  let index = from;
  while (index < lines.length && lines[index].trim() === "") index++;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trimEnd() === TERMINATOR) return { data, next: index + 1 };
    if (!line.startsWith(">")) break;
    const tag = TAG.exec(line)?.[1]?.trim();
    index++;
    const value: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      lines[index].trimEnd() !== TERMINATOR
    ) {
      value.push(lines[index]);
      index++;
    }
    if (tag) data[tag] = value.join("\n");
    while (index < lines.length && lines[index].trim() === "") index++;
  }
  return { data, next: index };
}

export function parseRecords(text: string): MolRecord[] {
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
  const records: MolRecord[] = [];
  let index = 0;
  while (index < lines.length) {
    if (lines.slice(index).every((line) => line.trim() === "")) break;
    const start = startOf(lines, index);
    if (start === -1)
      throw new Error(
        `Not a molfile: no counts line found on line ${index + 4}. A MOL block is title, program, comment, counts, then the atom and bond blocks.`,
      );
    let end = start + 4;
    while (end < lines.length && !END.test(lines[end])) end++;
    if (end >= lines.length)
      throw new Error(
        `Record ${records.length + 1} has no "M  END" line, so its MOL block never terminates.`,
      );
    const mol = lines.slice(start, end + 1);
    mol[mol.length - 1] = "M  END";
    const { data, next } = readData(lines, end + 1);
    records.push({ mol, data });
    index = next;
  }
  if (!records.length) throw new Error("No MOL records found in the input.");
  return records;
}

export function toSdf(records: MolRecord[]): string {
  const out: string[] = [];
  for (const record of records) {
    out.push(...record.mol);
    for (const [tag, value] of Object.entries(record.data)) {
      if (/[<>\n]/.test(tag))
        throw new Error(`Invalid data field name: ${tag}`);
      const lines = String(value).replace(/\r\n?/g, "\n").split("\n");
      while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
      if (lines.some((line) => line.trim() === ""))
        throw new Error(
          `Data field ${tag} has a blank line in its value; SDF ends a field at the first blank line.`,
        );
      if (lines.some((line) => line.trimEnd() === TERMINATOR))
        throw new Error(`Data field ${tag} contains an SDF record separator.`);
      out.push(`> <${tag}>`, ...lines, "");
    }
    out.push(TERMINATOR);
  }
  return out.join("\n") + "\n";
}

export function titlesFrom(input: string | undefined, count: number) {
  if (input === undefined) return [];
  const raw = String(input);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = raw;
  }
  const titles = Array.isArray(parsed) ? parsed : [parsed];
  if (titles.length > count)
    throw new Error(
      `Got ${titles.length} titles for ${count} record(s) in the input.`,
    );
  return titles.map((title) => String(title).replace(/[\r\n]/g, " "));
}

export function dataFrom(input: string | undefined, count: number) {
  if (input === undefined) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(input));
  } catch {
    throw new Error("data must be JSON: an object, or an array of objects.");
  }
  const entries = Array.isArray(parsed) ? parsed : Array(count).fill(parsed);
  if (entries.length > count)
    throw new Error(
      `Got ${entries.length} data objects for ${count} record(s) in the input.`,
    );
  return entries.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      throw new Error("Each data entry must be a flat object of tag to value.");
    return Object.fromEntries(
      Object.entries(entry as Record<string, unknown>).map(([tag, value]) => [
        tag,
        value === null || value === undefined ? "" : String(value),
      ]),
    );
  });
}
