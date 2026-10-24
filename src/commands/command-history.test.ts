import { describe, it, expect, beforeEach } from "vitest";
import { EditCommand } from "./Command";
import { CommandResult, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { CommandHistory } from "./CommandHistory";

/** 模拟 Repl 的编辑流程：先 execute，成功后 push。 */
function apply(ctx: EditorContext, cmd: EditCommand): void {
  const r = cmd.execute(ctx);
  expect(r.error).toBeUndefined();
  ctx.history.push(cmd);
}

/** 可复用的桩命令：只记录执行次数，用于验证 CommandHistory 的行为。 */
class RecordingCommand implements EditCommand {
  readonly category = "edit" as const;
  executeCount = 0;
  undoCount = 0;

  constructor(readonly name: string) {}

  execute(_ctx: EditorContext): CommandResult {
    this.executeCount++;
    return ok(`${this.name} executed`);
  }

  undo(_ctx: EditorContext): CommandResult {
    this.undoCount++;
    return ok(`${this.name} undone`);
  }
}

class FailingUndoCommand implements EditCommand {
  readonly name = "fail";
  readonly category = "edit" as const;
  execute(_ctx: EditorContext): CommandResult { return ok("ok"); }
  undo(_ctx: EditorContext): CommandResult { return { lines: [], error: "boom" }; }
}

describe("CommandHistory — 基础", () => {
  let ctx: EditorContext;
  let history: CommandHistory;

  beforeEach(() => {
    ctx = new EditorContext();
    history = ctx.history;
  });

  it("初始状态不能 undo/redo", () => {
    expect(history.undo(ctx).error).toBe("nothing to undo");
    expect(history.redo(ctx).error).toBe("nothing to redo");
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it("push → undo 调用 cmd.undo，栈清空", () => {
    const cmd = new RecordingCommand("a");
    apply(ctx, cmd);
    expect(cmd.executeCount).toBe(1);
    const r = history.undo(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["a undone"]);
    expect(cmd.undoCount).toBe(1);
    expect(history.undo(ctx).error).toBe("nothing to undo");
  });

  it("undo 后 redo 再次调用 cmd.execute", () => {
    const cmd = new RecordingCommand("a");
    apply(ctx, cmd);
    history.undo(ctx);
    const r = history.redo(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["a executed"]);
    expect(cmd.executeCount).toBe(2); // 首次 apply + redo
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it("undo 后新编辑：redo 栈清空", () => {
    const a = new RecordingCommand("a");
    const b = new RecordingCommand("b");
    apply(ctx, a);
    history.undo(ctx);
    apply(ctx, b);
    expect(history.redo(ctx).error).toBe("nothing to redo");
    expect(history.undo(ctx).lines).toEqual(["b undone"]);
    expect(history.undo(ctx).error).toBe("nothing to undo");
  });

  it("undo → redo → undo 反复切换", () => {
    const cmd = new RecordingCommand("a");
    apply(ctx, cmd);
    history.undo(ctx);
    history.redo(ctx);
    history.undo(ctx);
    expect(cmd.executeCount).toBe(2); // apply + redo
    expect(cmd.undoCount).toBe(2);
  });
});

describe("CommandHistory — disable / reset", () => {
  let ctx: EditorContext;
  let history: CommandHistory;

  beforeEach(() => {
    ctx = new EditorContext();
    history = ctx.history;
  });

  it("disable 后 undo/redo 报 io 错误", () => {
    const a = new RecordingCommand("a");
    apply(ctx, a);
    history.disable();
    expect(history.undo(ctx).error).toBe("undo not allowed after io command");
    expect(history.redo(ctx).error).toBe("redo not allowed after io command");
  });

  it("disable 保留栈：下一次 push 解禁后，旧命令仍可撤销", () => {
    const a = new RecordingCommand("a");
    const b = new RecordingCommand("b");
    apply(ctx, a);
    history.disable();
    apply(ctx, b);
    expect(history.undo(ctx).lines).toEqual(["b undone"]);
    expect(history.undo(ctx).lines).toEqual(["a undone"]);
  });

  it("reset 清空栈并锁定", () => {
    const a = new RecordingCommand("a");
    apply(ctx, a);
    history.reset();
    expect(history.undo(ctx).error).toBe("undo not allowed after io command");
    apply(ctx, new RecordingCommand("b"));
    history.undo(ctx); // 撤销 b
    expect(history.undo(ctx).error).toBe("nothing to undo");
  });
});

describe("CommandHistory — undo 失败", () => {
  it("undo 返回 error 时命令留在栈顶，可重试", () => {
    const ctx = new EditorContext();
    const cmd = new FailingUndoCommand();
    apply(ctx, cmd);               // ← 走统一流程，apply 内部会断言 execute 成功
    expect(ctx.history.undo(ctx).error).toBe("boom");
    expect(ctx.history.size().undo).toBe(1);
    expect(ctx.history.undo(ctx).error).toBe("boom");
  });
});