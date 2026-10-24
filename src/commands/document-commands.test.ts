import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { InitCommand } from "./InitCommand";
import { ReadCommand } from "./ReadCommand";
import { SaveCommand } from "./SaveCommand";
import { CanvasCommand } from "./CanvasCommand";
import { EditorContext } from "./EditorContext";
import { Rect } from "../core/Rect";
import { Group } from "../core/Group";
import { locateShape } from "./ShapeLocator";
import { UndoCommand } from "./UndoCommand";
import { RedoCommand } from "./RedoCommand";

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "svg-editor-test-"));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeTmp(name: string, content: string): string {
  const p = path.join(tmpDir, name);
  fs.writeFileSync(p, content, "utf-8");
  return p;
}

describe("InitCommand", () => {
  it("默认 800×600", () => {
    const ctx = new EditorContext();
    const r = new InitCommand(null, null).execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["canvas 800x600 created"]);
    expect(ctx.document!.width).toBe(800);
    expect(ctx.document!.height).toBe(600);
  });

  it("自定义尺寸", () => {
    const ctx = new EditorContext();
    const r = new InitCommand("400", "200").execute(ctx);
    expect(r.lines).toEqual(["canvas 400x200 created"]);
  });

  it("reset 后 undo 被锁", () => {
    const ctx = new EditorContext();
    new InitCommand(null, null).execute(ctx);
    expect(ctx.history.undo(ctx).error).toBe("undo not allowed after io command");
  });

  it("非法宽度", () => {
    const ctx = new EditorContext();
    expect(new InitCommand("abc", null).execute(ctx).error).toBe(
      "invalid value for canvas width: abc",
    );
  });

  it("非正尺寸", () => {
    const ctx = new EditorContext();
    expect(new InitCommand("0", null).execute(ctx).error).toBe(
      "canvas size must be positive",
    );
    expect(new InitCommand(null, "-1").execute(ctx).error).toBe(
      "canvas size must be positive",
    );
  });
});

describe("ReadCommand", () => {
  it("读入 + warning 带前缀 + sourcePath 更新", () => {
    const xml = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
  <rect x="0" y="0" width="100" height="100"/>
  <circle id="c1" cx="50" cy="50" r="10"/>
</svg>`;
    const file = writeTmp("demo.svg", xml);
    const ctx = new EditorContext();
    const r = new ReadCommand(file).execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual([
      "warning: assigned id rect1 to unnamed <rect>",
      `read ${file} (2 elements)`,
    ]);
    expect(ctx.document!.sourcePath).toBe(file);
    expect(ctx.document!.width).toBe(400);
    expect(ctx.document!.countElements()).toBe(2);
  });

  it("无 warning 时只有 summary 行", () => {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect id="r1" x="0" y="0" width="10" height="10"/>
    </svg>`;
    const file = writeTmp("clean.svg", xml);
    const ctx = new EditorContext();
    const r = new ReadCommand(file).execute(ctx);
    expect(r.lines).toEqual([`read ${file} (1 elements)`]);
  });

  it("文件不存在", () => {
    const ctx = new EditorContext();
    const r = new ReadCommand(path.join(tmpDir, "nope.svg")).execute(ctx);
    expect(r.error).toContain("cannot read file:");
  });

  it("文件存在但非 SVG", () => {
    const file = writeTmp("bad.svg", "<not-svg/>");
    const ctx = new EditorContext();
    const r = new ReadCommand(file).execute(ctx);
    expect(r.error).toContain("cannot read file:");
  });

  it("reset 后 undo 被锁", () => {
    const file = writeTmp("empty.svg", '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>');
    const ctx = new EditorContext();
    new ReadCommand(file).execute(ctx);
    expect(ctx.history.undo(ctx).error).toBe("undo not allowed after io command");
  });
});

describe("SaveCommand", () => {
  it("保存到指定路径，更新 sourcePath，disable 后 undo 被锁", () => {
    const ctx = new EditorContext();
    new InitCommand("400", "200").execute(ctx);
    ctx.document!.root.add(new Rect("r1", 0, 0, 10, 10));
    ctx.document!.ids.reserve("r1");

    const target = path.join(tmpDir, "out1.svg");
    const r = new SaveCommand(target).execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual([`saved to ${target} (1 elements)`]);
    expect(ctx.document!.sourcePath).toBe(target);
    expect(fs.existsSync(target)).toBe(true);

    const content = fs.readFileSync(target, "utf-8");
    expect(content).toContain('<rect id="r1"');
    expect(content).toContain('<svg xmlns=');
    expect(ctx.history.undo(ctx).error).toBe("undo not allowed after io command");
  });

  it("无参 save 使用 sourcePath", () => {
    const target = path.join(tmpDir, "out2.svg");
    const ctx = new EditorContext();
    new InitCommand(null, null).execute(ctx);
    new SaveCommand(target).execute(ctx);
    // 再 save 一次（无参）应该写回同一路径
    const r = new SaveCommand(null).execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual([`saved to ${target} (0 elements)`]);
  });

  it("无参且无 sourcePath", () => {
    const ctx = new EditorContext();
    new InitCommand(null, null).execute(ctx);
    expect(new SaveCommand(null).execute(ctx).error).toBe(
      "no file path: save requires a filename or prior read",
    );
  });

  it("无文档", () => {
    expect(new SaveCommand("x.svg").execute(new EditorContext()).error).toBe(
      "no document. use 'init' or 'read' first",
    );
  });

  it("不可写路径", () => {
    const ctx = new EditorContext();
    new InitCommand(null, null).execute(ctx);
    const bad = path.join(tmpDir, "nonexistent-dir", "x.svg");
    const r = new SaveCommand(bad).execute(ctx);
    expect(r.error).toContain("cannot write file:");
  });
});

describe("CanvasCommand", () => {
  it("无参：显示尺寸，历史不锁", () => {
    const ctx = new EditorContext();
    new InitCommand("400", "200").execute(ctx);
    const r = new CanvasCommand(null, null).execute(ctx);
    expect(r.lines).toEqual(["canvas 400x200"]);
    // 不锁定：可以 undo 前一次 edit（如有）
    expect(ctx.history.undo(ctx).error).toBe("undo not allowed after io command"); // init 已经 lock 过
  });

  it("有参：修改尺寸 + disable", () => {
    const ctx = new EditorContext();
    new InitCommand("400", "200").execute(ctx);
    // init 后 push 一条假的 edit 以解锁
    ctx.history.push({
      name: "noop",
      category: "edit",
      execute: () => ({ lines: [] }),
      undo: () => ({ lines: [] }),
    });

    const r = new CanvasCommand("800", "600").execute(ctx);
    expect(r.lines).toEqual(["canvas 800x600"]);
    expect(ctx.document!.width).toBe(800);
    expect(ctx.history.undo(ctx).error).toBe("undo not allowed after io command");
  });

  it("只改 width", () => {
    const ctx = new EditorContext();
    new InitCommand("400", "200").execute(ctx);
    new CanvasCommand("600", null).execute(ctx);
    expect([ctx.document!.width, ctx.document!.height]).toEqual([600, 200]);
  });

  it("无文档", () => {
    expect(new CanvasCommand(null, null).execute(new EditorContext()).error).toBe(
      "no document. use 'init' or 'read' first",
    );
  });
});

describe("UndoCommand / RedoCommand", () => {
  it("undo 命令只是转发 history.undo", () => {
    const ctx = new EditorContext();
    new InitCommand(null, null).execute(ctx);
    ctx.document!.root.add(new Group("g1"));
    ctx.document!.ids.reserve("g1");

    // 手动 push 一条可撤销命令（模拟 Repl 层行为）
    const shape = locateShape(ctx.document!, "g1")!.shape;
    const parent = locateShape(ctx.document!, "g1")!.parent;
    const edit = {
      name: "manual",
      category: "edit" as const,
      execute: () => ({ lines: [] }),
      undo: () => {
        parent.removeAt(parent.indexOf(shape));
        return { lines: ["undone"] };
      },
    };
    ctx.history.push(edit);

    const r = new UndoCommand().execute(ctx);
    expect(r.lines).toEqual(["undone"]);
  });

  it("空栈 undo：nothing to undo", () => {
    const ctx = new EditorContext();
    expect(new UndoCommand().execute(ctx).error).toBe("nothing to undo");
  });

  it("空栈 redo：nothing to redo", () => {
    const ctx = new EditorContext();
    expect(new RedoCommand().execute(ctx).error).toBe("nothing to redo");
  });
});