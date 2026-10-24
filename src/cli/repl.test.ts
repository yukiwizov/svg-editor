import { describe, it, expect } from "vitest";
import { Repl } from "./Repl";
import { MemoryIO } from "./__test-utils__/MemoryIO";
import { CommandRegistry } from "./CommandRegistry";
import { registerBuiltinCommands } from "./builtin-commands";
import { CommandDispatcher } from "./CommandDispatcher";
import { EditorContext } from "../commands/EditorContext";

function setup(lines: string[]): { io: MemoryIO; repl: Repl; ctx: EditorContext } {
  const registry = new CommandRegistry();
  registerBuiltinCommands(registry);
  const dispatcher = new CommandDispatcher(registry);
  const ctx = new EditorContext();
  const io = new MemoryIO(lines);
  return { io, repl: new Repl(io, dispatcher, ctx), ctx };
}

const BANNER = "svg-editor 0.1 — type 'help' for commands";

describe("Repl — 启动与空输入", () => {
  it("空输入：仅 banner + 空行", async () => {
    const { io, repl } = setup([]);
    await repl.run();
    expect(io.writes).toEqual([BANNER, ""]);
  });

  it("只有空行/注释：无命令输出", async () => {
    const { io, repl } = setup(["", "  ", "# a comment", "   # another"]);
    await repl.run();
    expect(io.writes).toEqual([BANNER, ""]);
  });
});

describe("Repl — 成功命令", () => {
  it("init + create + tree", async () => {
    const { io, repl } = setup([
      "init 400 200",
      "create rect r1 10 20 100 50 #4a90d9",
      "tree",
    ]);
    await repl.run();
    // 逐行比对
    expect(io.writes.slice(0, 2)).toEqual([BANNER, ""]);
    const outputs = io.writes.slice(2);
    expect(outputs[0]).toBe("canvas 400x200 created");
    expect(outputs[1]).toBe("rect#r1 created");
    expect(outputs[2]).toBe("svg (400x200)");
    expect(outputs[3]).toMatch(/^└── rect#r1/);
  });

  it("text 内容含空格（引号）", async () => {
    const { io, repl } = setup([
      "init 100 100",
      'create text t1 0 0 "hello world"',
      "tree t1",
    ]);
    await repl.run();
    const outputs = io.writes.slice(2);
    expect(outputs).toContain('text#t1 created');
    expect(outputs.some((l) => l.includes('"hello world"'))).toBe(true);
  });

  it("多行输出（tree 完整文档）", async () => {
    const { io, repl } = setup([
      "init 400 200",
      "create rect bg 0 0 400 200 #ffffff",
      "create text title 20 40 \"My Diagram\"",
      "tree",
    ]);
    await repl.run();
    const outputs = io.writes.slice(2);
    // 期望 3 条命令的输出 + svg 根 + 2 个图形
    expect(outputs.filter((l) => l.startsWith("svg (400x200)"))).toHaveLength(1);
    expect(outputs.filter((l) => l.startsWith("├── rect#bg"))).toHaveLength(1);
    expect(outputs.filter((l) => l.startsWith("└── text#title"))).toHaveLength(1);
  });
});

describe("Repl — 错误命令", () => {
  it("error 带 'error: ' 前缀", async () => {
    const { io, repl } = setup(["delete r1"]);
    await repl.run();
    expect(io.writes).toEqual([
      BANNER,
      "",
      "error: no document. use 'init' or 'read' first",
    ]);
  });

  it("未知命令", async () => {
    const { io, repl } = setup(["foobar"]);
    await repl.run();
    expect(io.writes[2]).toBe("error: unknown command: foobar");
  });

  it("参数个数错误", async () => {
    const { io, repl } = setup(["init 100 100", "delete"]);
    await repl.run();
    // init 后有 canvas 输出，delete 参数错误有 error 前缀
    expect(io.writes.some((l) => l === "error: usage: delete <id>")).toBe(true);
  });
});

describe("Repl — 退出", () => {
  it("exit 退出，后续行不执行", async () => {
    const { io, repl, ctx } = setup(["init 400 200", "exit", "create rect r1 0 0 10 10"]);
    await repl.run();
    // create 没执行
    expect(ctx.document!.root.getChildren()).toHaveLength(0);
    expect(io.writes.some((l) => l === "rect#r1 created")).toBe(false);
  });

  it("quit 退出", async () => {
    const { ctx, repl } = setup(["init 400 200", "quit", "create rect r1 0 0 10 10"]);
    await repl.run();
    expect(ctx.document!.root.getChildren()).toHaveLength(0);
  });

  it("# exit 不退出（是注释）", async () => {
    const { io, repl, ctx } = setup(["init 400 200", "# exit", "create rect r1 0 0 10 10"]);
    await repl.run();
    expect(ctx.document!.root.getChildren()).toHaveLength(1);
    expect(io.writes.some((l) => l === "rect#r1 created")).toBe(true);
  });

  it("trim 后的 exit 也退出", async () => {
    const { ctx, repl } = setup(["init 400 200", "   exit   ", "create rect r1 0 0 10 10"]);
    await repl.run();
    expect(ctx.document!.root.getChildren()).toHaveLength(0);
  });
});

describe("Repl — 完整会话（对照文档 §6）", () => {
  it("init → create → group → move → undo → redo → tree → save → undo", async () => {
    const { io, repl } = setup([
      "init 800 600",
      "create rect bg 0 0 800 600 #ffffff",
      "create text title 20 40 \"My Diagram\"",
      "create circle c1 100 100 20 red",
      "create rect box 200 80 60 60 #3366ff",
      "group markers c1 box",
      "move c1 30 0",
      "undo",
      "redo",
      "set title text \"My Diagram v2\"",
      "tree",
    ]);
    await repl.run();
    const out = io.writes.join("\n");

    expect(out).toContain("canvas 800x600 created");
    expect(out).toContain("g#markers created with 2 children");
    expect(out).toContain("circle#c1 moved to (130,100)");
    expect(out).toContain("circle#c1 moved back to (100,100)");
    expect(out).toContain('text#title updated: text="My Diagram v2"');
    expect(out).toContain("svg (800x600)");
    expect(out).toContain("g#markers");
  });
});