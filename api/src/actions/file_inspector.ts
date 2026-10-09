import fs from "fs";
import path from "path";

const MAX_READ_BYTES = 1_048_576;

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
      let fd: number;
      try {
        fd = fs.openSync(
          filePath,
          fs.constants.O_RDONLY | fs.constants.O_NONBLOCK
        );
      } catch (error: any) {
        if (error?.code === "ENOENT") return { error: "File does not exist" };
        throw error;
      }

      try {
        const stat = fs.fstatSync(fd);
        if (!stat.isFile()) return { error: "Path is not a file" };
        // Limit to 1MB to prevent memory issues
        if (stat.size > MAX_READ_BYTES) return { error: "File too large (>1MB)" };

        const buffer = Buffer.alloc(MAX_READ_BYTES + 1);
        let bytesRead = 0;
        while (bytesRead < buffer.length) {
          const read = fs.readSync(
            fd,
            buffer,
            bytesRead,
            buffer.length - bytesRead,
            bytesRead
          );
          if (read === 0) break;
          bytesRead += read;
        }
        if (bytesRead > MAX_READ_BYTES) return { error: "File too large (>1MB)" };

        return { content: buffer.toString("utf-8", 0, bytesRead) };
      } finally {
        fs.closeSync(fd);
      }
    }
  }
}

export default { run };
