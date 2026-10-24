import { Command } from "./Command";
import { CommandResult } from "./CommandResult";
import { EditorContext } from "./EditorContext";

/**
 * undo —— 撤销上一次编辑命令。
 * 语义完全由 CommandHistory.undo 承担；本命令只是转发。
 */
export class UndoCommand implements Command {
  readonly name = "undo";
  readonly category = "history" as const;

  execute(ctx: EditorContext): CommandResult {
    return ctx.history.undo(ctx);
  }
}