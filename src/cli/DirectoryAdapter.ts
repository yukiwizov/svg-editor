export type DirectoryEntry = { name: string; isDirectory: boolean; isFile: boolean };

/** Host boundary for dir; tests may inject an in-memory adapter. */
export interface DirectoryAdapter {
  cwd(): string;
  list(path: string): DirectoryEntry[];
}

export class NodeDirectoryAdapter implements DirectoryAdapter {
  cwd(): string { return process.cwd(); }

  list(path: string): DirectoryEntry[] {
    const fs = require("node:fs") as typeof import("node:fs");
    return fs.readdirSync(path, { withFileTypes: true }).map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
    }));
  }
}
