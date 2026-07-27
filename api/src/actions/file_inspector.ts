import fs from "fs";
import path from "path";

async function run({
  parameters: { filePath, operation = "read" },
}: {
  parameters: {
    filePath: string;
    operation?: "exists" | "read" | "stat" | "list";
  };
}) {
  if (!path.isAbsolute(filePath)) {
    return { error: "filePath must be an absolute path" };
  }

  switch (operation) {
    case "exists":
      return { exists: fs.existsSync(filePath) };

    case "stat": {
      if (!fs.existsSync(filePath)) return { error: "Path does not exist" };
      const stat = fs.statSync(filePath);
      return {
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        size: stat.size,
        created: stat.birthtime.toISOString(),
        modified: stat.mtime.toISOString(),
      };
    }

    case "list": {
      if (!fs.existsSync(filePath)) return { error: "Path does not exist" };
      const stat = fs.statSync(filePath);
      if (!stat.isDirectory()) return { error: "Path is not a directory" };
      const entries = fs.readdirSync(filePath, { withFileTypes: true });
      return {
        entries: entries.map((e) => ({
          name: e.name,
          type: e.isDirectory() ? "directory" : "file",
        })),
      };
    }

    case "read":
    default: {
      if (!fs.existsSync(filePath)) return { error: "File does not exist" };
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) return { error: "Path is not a file" };
      // Limit to 1MB to prevent memory issues
      if (stat.size > 1_048_576) return { error: "File too large (>1MB)" };
      const content = fs.readFileSync(filePath, "utf-8");
      return { content };
    }
  }
}

export default { run };
