import type { EditorContext } from "./EditorContext";
import { EditCommand } from "./Command";
import { CommandResult, err } from "./CommandResult";

/**
 * 撤销/重做栈。
 *
 * 协作约定：
 * - Repl 层：编辑命令成功 execute 后调用 push
 * - 命令自己：init/read 成功后调用 reset()；save/canvas 修改成功后调用 disable()
 *
 * 状态机：
 *   normal     —— 可 undo/redo
 *   locked     —— io 命令后禁止 undo/redo，直到下一次 push（自动解锁）
 *
 * undo 与 redo 的实现细节：
 * - undo：弹出 undoStack 顶 → 调 cmd.undo(ctx) → 成功则入 redoStack
 * - redo：弹出 redoStack 顶 → 调 cmd.execute(ctx) → 成功则入 undoStack
 *   redo 复用 execute 是协议的一部分（每个命令的 execute 必须幂等）
 */
export class CommandHistory {
  private undoStack: EditCommand[] = [];
  private redoStack: EditCommand[] = [];
  private locked = false;

  /** 编辑命令执行成功后调用：入栈、清空 redo、解禁。 */
  push(cmd: EditCommand): void {
    this.undoStack.push(cmd);
    this.redoStack = [];
    this.locked = false;
  }

  /** 清空 + 锁定。init/read 用（Document 已换，旧历史无意义）。 */
  reset(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.locked = true;
  }

  /** 保留栈 + 锁定。save / canvas 修改尺寸用（不改数据，只做撤销屏障）。 */
  disable(): void {
    this.locked = true;
  }

  undo(ctx: EditorContext): CommandResult {
    if (this.locked) {
      return err("undo not allowed after io command");
    }
    const cmd = this.undoStack.pop();
    if (!cmd) {
      return err("nothing to undo");
    }
    const r = cmd.undo(ctx);
    if (r.error) {
      this.undoStack.push(cmd);
      return r;
    }
    this.redoStack.push(cmd);
    return { lines: r.lines };
  }

  redo(ctx: EditorContext): CommandResult {
    if (this.locked) {
      return err("redo not allowed after io command");
    }
    const cmd = this.redoStack.pop();
    if (!cmd) {
      return err("nothing to redo");
    }
    const r = cmd.execute(ctx);
    if (r.error) {
      this.redoStack.push(cmd);
      return r;
    }
    this.undoStack.push(cmd);
    return { lines: r.lines };
  }

  canUndo(): boolean {
    return !this.locked && this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return !this.locked && this.redoStack.length > 0;
  }

  // 仅测试用：查看栈深度，不暴露命令本身
  size(): { undo: number; redo: number; locked: boolean } {
    return {
      undo: this.undoStack.length,
      redo: this.redoStack.length,
      locked: this.locked,
    };
  }
}