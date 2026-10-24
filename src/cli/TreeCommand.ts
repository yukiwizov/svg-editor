import { Command } from "../commands/Command";
import { CommandResult, err } from "../commands/CommandResult";
import { EditorContext } from "../commands/EditorContext";
import { Renderer } from "./Renderer";

export class TreeCommand implements Command {
  readonly name = "tree";
  readonly category = "display" as const;

  constructor(private readonly id: string | null) {}

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    const renderer = new Renderer();
    if (this.id === null) {
      return { lines: renderer.renderTree(ctx.document) };
    }
    const lines = renderer.renderSubtree(ctx.document, this.id);
    if (lines === null) {
      return err(`no such shape: ${this.id}`);
    }
    return { lines };
  }
}