import type { Document } from "../core/Document";
import type { EditorContext } from "./EditorContext";
import { CommandResult, err } from "./CommandResult";

/**
 * 命令分类。决定命令在 Repl 层的后处理：
 * - edit:     执行成功后 Repl 会 push 到 history（可 undo）
 * - document: 文档类命令（init/read/save/canvas 修改），命令自己负责 reset/disable history
 * - display:  只读展示（tree/show/help），不进栈、不改变历史状态
 * - history:  撤销/重做命令本身，不进栈（其行为由 CommandHistory 处理）
 */
export type CommandCategory = "edit" | "document" | "display" | "history";

/** 所有命令的基础接口。 */
export interface Command {
  readonly name: string;
  readonly category: CommandCategory;
  execute(ctx: EditorContext): CommandResult;
}

/**
 * 编辑命令（可撤销）。
 *
 * 契约（本阶段由开发者手写保证）：
 * 1. execute 第一次执行 + redo 时再次执行，必须达到同样的"已完成"状态；
 *    缓存的对象引用需在 execute 中被刷新，保证幂等。
 * 2. undo 严格依赖 execute 缓存的"逆操作所需状态"。
 * 3. 只有在 execute 返回 error 为 undefined 时，才允许把命令 push 到 history。
 */
export interface EditCommand extends Command {
  readonly category: "edit";
  undo(ctx: EditorContext): CommandResult;
}

/**
 * 需要一个已打开的文档才能执行的命令，用此函数包一层。
 * 未 init / read 时返回统一错误，命令体不会被执行。
 */
export function withDocument(
  ctx: EditorContext,
  fn: (doc: Document) => CommandResult,
): CommandResult {
  if (!ctx.document) {
    return err("no document. use 'init' or 'read' first");
  }
  return fn(ctx.document);
}