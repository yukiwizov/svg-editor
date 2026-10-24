import { Command } from "../commands/Command";
import { CommandResult, err } from "../commands/CommandResult";
import { EditorContext } from "../commands/EditorContext";
import { Renderer } from "./Renderer";

export class ShowCommand implements Command {
  readonly name = "show";
  readonly category = "display" as const;

  constructor(private readonly id: string) {}

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    const lines = new Renderer().renderShow(ctx.document, this.id);
    if (lines === null) {
      return err(`no such shape: ${this.id}`);
    }
    return { lines };
  }
}