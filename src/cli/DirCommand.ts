import { Command } from "../commands/Command";
import { CommandResult } from "../commands/CommandResult";
import { EditorContext } from "../commands/EditorContext";
import { DirectoryAdapter, NodeDirectoryAdapter } from "./DirectoryAdapter";

/** Lists process.cwd(), independent of the current SVG document. */
export class DirCommand implements Command {
  readonly name = "dir";
  readonly category = "display" as const;

  constructor(private readonly adapter: DirectoryAdapter = new NodeDirectoryAdapter()) {}

  execute(_ctx: EditorContext): CommandResult {
    let path = "";
    try {
      path = this.adapter.cwd();
      const entries = this.adapter.list(path);
      if (entries.length === 0) return { lines: ["(empty directory)"] };
      const sorted = [...entries].sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      });
      return { lines: sorted.map(entry => `${entry.isDirectory ? "[DIR]" : "[FILE]"}  ${entry.name}`) };
    } catch {
      return { lines: [], error: `cannot read directory: ${path}` };
    }
  }
}
