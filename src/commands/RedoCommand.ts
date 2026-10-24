import { Command } from "./Command";
import { CommandResult } from "./CommandResult";
import { EditorContext } from "./EditorContext";

/**
 * redo —— 重做；undo 后若有新编辑，redo 栈会被 push 清空（由 CommandHistory 保证）。
 */
export class RedoCommand implements Command {
  readonly name = "redo";
  readonly category = "history" as const;

  execute(ctx: EditorContext): CommandResult {
    return ctx.history.redo(ctx);
  }
}