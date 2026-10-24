import { describe, it, expect } from "vitest";
import { FrontCommand } from "./FrontCommand";
import { EditorContext } from "./EditorContext";
import { Document } from "../core/Document";
import { Group } from "../core/Group";
import { Rect } from "../core/Rect";

function setup(): EditorContext {
  const ctx = new EditorContext();
  ctx.document = new Document(800, 600);
  return ctx;
}

function addRect(doc: Document, id: string): Rect {
  const r = new Rect(id, 0, 0, 10, 10);
  doc.root.add(r);
  doc.ids.reserve(id);
  return r;
}

describe("FrontCommand — 成功路径", () => {
  it("[a,b,c] front b → [a,c,b]", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "b");
    addRect(ctx.document!, "c");

    const r = new FrontCommand("front", "b").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["rect#b moved to front"]);

    const ids = ctx.document!.root.getChildren().map((s) => s.getId());
    expect(ids).toEqual(["a", "c", "b"]);
  });

  it("已在末尾 → 仍成功，顺序不变", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "c");
    const r = new FrontCommand("front", "c").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["a", "c"]);
  });

  it("嵌套容器内 front，不影响外部兄弟", () => {
    const ctx = setup();
    const outer = new Group("outer");
    const r1 = new Rect("r1", 0, 0, 1, 1);
    const r2 = new Rect("r2", 0, 0, 1, 1);
    const r3 = new Rect("r3", 0, 0, 1, 1);
    outer.add(r1);
    outer.add(r2);
    outer.add(r3);
    ctx.document!.root.add(outer);
    addRect(ctx.document!, "outside");
    ["outer", "r1", "r2", "r3"].forEach((id) => ctx.document!.ids.reserve(id));

    new FrontCommand("front", "r1").execute(ctx);
    expect(outer.getChildren().map((s) => s.getId())).toEqual(["r2", "r3", "r1"]);
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual([
      "outer",
      "outside",
    ]);
  });

  it("对 g 本身 front", () => {
    const ctx = setup();
    const g = new Group("g1");
    ctx.document!.root.add(g);
    ctx.document!.ids.reserve("g1");
    addRect(ctx.document!, "r1");

    const r = new FrontCommand("front", "g1").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["r1", "g1"]);
  });
});

describe("FrontCommand — 错误分支", () => {
  it("no such shape", () => {
    const ctx = setup();
    expect(new FrontCommand("front", "nope").execute(ctx).error).toBe(
      "no such shape: nope",
    );
  });

  it("无文档", () => {
    expect(new FrontCommand("front", "x").execute(new EditorContext()).error).toBe(
      "no document. use 'init' or 'read' first",
    );
  });
});

describe("FrontCommand — undo/redo", () => {
  it("undo 恢复原位置", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "b");
    addRect(ctx.document!, "c");
    const cmd = new FrontCommand("front", "a");
    cmd.execute(ctx);
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["b", "c", "a"]);

    const r = cmd.undo(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["rect#a restored to original position"]);
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["a", "b", "c"]);
  });

  it("redo 再次 front", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "b");
    addRect(ctx.document!, "c");
    const cmd = new FrontCommand("front", "a");
    cmd.execute(ctx);
    cmd.undo(ctx);
    cmd.execute(ctx);
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["b", "c", "a"]);
  });

  it("已在末尾：undo 也安全", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "c");
    const cmd = new FrontCommand("front", "c");
    cmd.execute(ctx);
    cmd.undo(ctx);
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["a", "c"]);
  });
});