import { describe, it, expect, beforeEach } from "vitest";
import { TreeCommand } from "./TreeCommand";
import { ShowCommand } from "./ShowCommand";
import { HelpCommand } from "./HelpCommand";
import { EditorContext } from "../commands/EditorContext";
import { Document } from "../core/Document";
import { Rect } from "../core/Rect";

function setup(): EditorContext {
  const ctx = new EditorContext();
  ctx.document = new Document(100, 100);
  return ctx;
}

describe("TreeCommand", () => {
  it("无参：全文档", () => {
    const ctx = setup();
    ctx.document!.root.add(new Rect("r1", 0, 0, 10, 10));
    const r = new TreeCommand(null).execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines[0]).toBe("svg (100x100)");
    expect(r.lines.length).toBe(2);
  });

  it("有参：子树", () => {
    const ctx = setup();
    ctx.document!.root.add(new Rect("r1", 0, 0, 10, 10));
    const r = new TreeCommand("r1").execute(ctx);
    expect(r.lines[0]).toMatch(/^rect#r1/);
  });

  it("有参但不存在", () => {
    expect(new TreeCommand("nope").execute(setup()).error).toBe("no such shape: nope");
  });

  it("无文档", () => {
    expect(new TreeCommand(null).execute(new EditorContext()).error).toBe(
      "no document. use 'init' or 'read' first",
    );
  });
});

describe("ShowCommand", () => {
  it("正常输出", () => {
    const ctx = setup();
    ctx.document!.root.add(new Rect("r1", 0, 0, 10, 10));
    const r = new ShowCommand("r1").execute(ctx);
    expect(r.lines[0]).toBe("rect#r1  parent=svg");
  });

  it("不存在", () => {
    expect(new ShowCommand("nope").execute(setup()).error).toBe("no such shape: nope");
  });

  it("无文档", () => {
    expect(new ShowCommand("r1").execute(new EditorContext()).error).toBe(
      "no document. use 'init' or 'read' first",
    );
  });
});

describe("HelpCommand", () => {
  it("返回非空列表，含关键命令名", () => {
    const r = new HelpCommand().execute(new EditorContext());
    expect(r.error).toBeUndefined();
    const joined = r.lines.join("\n");
    for (const name of ["init", "create", "tree", "show", "undo", "redo"]) {
      expect(joined).toContain(name);
    }
  });
});