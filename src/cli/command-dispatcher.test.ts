import { describe, it, expect, beforeEach } from "vitest";
import { CommandRegistry } from "./CommandRegistry";
import { registerBuiltinCommands } from "./builtin-commands";
import { CommandDispatcher } from "./CommandDispatcher";
import { EditorContext } from "../commands/EditorContext";

function setup(): { ctx: EditorContext; disp: CommandDispatcher } {
  const reg = new CommandRegistry();
  registerBuiltinCommands(reg);
  return { ctx: new EditorContext(), disp: new CommandDispatcher(reg) };
}

describe("CommandDispatcher — 基础", () => {
  it("空行 → 无输出、无错误", () => {
    const { ctx, disp } = setup();
    const r = disp.dispatch("", ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual([]);
  });

  it("注释行 → 无输出、无错误", () => {
    const { ctx, disp } = setup();
    expect(disp.dispatch("# a comment", ctx).lines).toEqual([]);
  });

  it("未知命令", () => {
    const { ctx, disp } = setup();
    expect(disp.dispatch("foobar x y", ctx).error).toBe("unknown command: foobar");
  });

  it("未闭合引号", () => {
    const { ctx, disp } = setup();
    expect(disp.dispatch('set t1 text "abc', ctx).error).toBe(
      "unterminated double quote",
    );
  });

  it("参数个数错误", () => {
    const { ctx, disp } = setup();
    expect(disp.dispatch("delete", ctx).error).toBe("usage: delete <id>");
  });
});

describe("CommandDispatcher — 命令转发与 history", () => {
  let ctx: EditorContext;
  let disp: CommandDispatcher;
  beforeEach(() => {
    ({ ctx, disp } = setup());
  });

  it("init 后 document 有尺寸，history 被锁定", () => {
    const r = disp.dispatch("init 400 200", ctx);
    expect(r.error).toBeUndefined();
    expect(ctx.document!.width).toBe(400);
    expect(ctx.history.size()).toEqual({ undo: 0, redo: 0, locked: true });
  });

  it("create 成功后 push 一条 edit", () => {
    disp.dispatch("init 400 200", ctx);
    const r = disp.dispatch("create rect r1 10 20 100 50 #4a90d9", ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["rect#r1 created"]);
    expect(ctx.history.size().undo).toBe(1);
    expect(ctx.history.size().locked).toBe(false);
  });

  it("edit 命令失败不 push", () => {
    disp.dispatch("init 400 200", ctx);
    const r = disp.dispatch("create rect r1 abc 20 100 50", ctx);
    expect(r.error).toBeDefined();
    expect(ctx.history.size().undo).toBe(0);
  });

  it("undo 命令转发 history.undo，不出错", () => {
    disp.dispatch("init 400 200", ctx);
    disp.dispatch("create rect r1 10 20 100 50", ctx);
    const r = disp.dispatch("undo", ctx);
    expect(r.error).toBeUndefined();
    expect(ctx.history.size().undo).toBe(0);
    expect(ctx.history.size().redo).toBe(1);
  });

  it("redo 命令转发 history.redo", () => {
    disp.dispatch("init 400 200", ctx);
    disp.dispatch("create rect r1 10 20 100 50", ctx);
    disp.dispatch("undo", ctx);
    const r = disp.dispatch("redo", ctx);
    expect(r.error).toBeUndefined();
    expect(ctx.history.size().undo).toBe(1);
    expect(ctx.history.size().redo).toBe(0);
  });

  it("save 之后 undo 被禁止（文档类命令 disable）", () => {
    // 找一个临时路径
    const path = require("node:path");
    const os = require("node:os");
    const fs = require("node:fs");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "disp-"));
    const target = path.join(dir, "x.svg");
    try {
      disp.dispatch("init 100 100", ctx);
      disp.dispatch("create rect r1 0 0 10 10", ctx);
      disp.dispatch(`save ${target}`, ctx);
      const r = disp.dispatch("undo", ctx);
      expect(r.error).toBe("undo not allowed after io command");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("CommandDispatcher — create 的 in 子句端到端", () => {
  it("create g + create rect in g", () => {
    const { ctx, disp } = setup();
    disp.dispatch("init 400 200", ctx);
    disp.dispatch("create g node1", ctx);
    const r = disp.dispatch("create rect r1 10 20 100 50 #eee in node1", ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["rect#r1 created in g#node1"]);

    // 通过 tree 状态间接验证（此处通过 history.undo 后的行为）
    disp.dispatch("undo", ctx); // 撤销 r1
    const next = disp.dispatch("undo", ctx); // 撤销 node1
    expect(next.error).toBeUndefined();
  });

  it("text 内容为 'in' 不被误判为 in 子句", () => {
    const { ctx, disp } = setup();
    disp.dispatch("init 400 200", ctx);
    // 无 in：把 "in" 作为 text 内容
    const r = disp.dispatch('create text t1 0 0 "in"', ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["text#t1 created"]);
  });
});