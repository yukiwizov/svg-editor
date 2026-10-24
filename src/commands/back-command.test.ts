import { describe, it, expect } from "vitest";
import { BackCommand } from "./BackCommand";
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

describe("BackCommand — 成功路径", () => {
  it("[a,b,c] back b → [b,a,c]", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "b");
    addRect(ctx.document!, "c");

    const r = new BackCommand("back", "b").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["rect#b moved to back"]);
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["b", "a", "c"]);
  });

  it("已在开头 → 仍成功，顺序不变", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "c");
    const r = new BackCommand("back", "a").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["a", "c"]);
  });

  it("嵌套容器内 back", () => {
    const ctx = setup();
    const outer = new Group("outer");
    const r1 = new Rect("r1", 0, 0, 1, 1);
    const r2 = new Rect("r2", 0, 0, 1, 1);
    const r3 = new Rect("r3", 0, 0, 1, 1);
    outer.add(r1);
    outer.add(r2);
    outer.add(r3);
    ctx.document!.root.add(outer);
    ["outer", "r1", "r2", "r3"].forEach((id) => ctx.document!.ids.reserve(id));

    new BackCommand("back", "r3").execute(ctx);
    expect(outer.getChildren().map((s) => s.getId())).toEqual(["r3", "r1", "r2"]);
  });

  it("对 g 本身 back", () => {
    const ctx = setup();
    const g = new Group("g1");
    ctx.document!.root.add(g);
    ctx.document!.ids.reserve("g1");
    addRect(ctx.document!, "r1");

    new BackCommand("back", "g1").execute(ctx);
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["g1", "r1"]);
  });
});

describe("BackCommand — 错误分支", () => {
  it("no such shape", () => {
    const ctx = setup();
    expect(new BackCommand("back", "nope").execute(ctx).error).toBe(
      "no such shape: nope",
    );
  });

  it("无文档", () => {
    expect(new BackCommand("back", "x").execute(new EditorContext()).error).toBe(
      "no document. use 'init' or 'read' first",
    );
  });
});

describe("BackCommand — undo/redo", () => {
  it("undo 恢复原位置", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "b");
    addRect(ctx.document!, "c");
    const cmd = new BackCommand("back", "c");
    cmd.execute(ctx);
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["c", "a", "b"]);

    const r = cmd.undo(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["rect#c restored to original position"]);
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["a", "b", "c"]);
  });

  it("redo 再次 back", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "b");
    addRect(ctx.document!, "c");
    const cmd = new BackCommand("back", "c");
    cmd.execute(ctx);
    cmd.undo(ctx);
    cmd.execute(ctx);
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["c", "a", "b"]);
  });

  it("已在开头：undo 也安全", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "c");
    const cmd = new BackCommand("back", "a");
    cmd.execute(ctx);
    cmd.undo(ctx);
    expect(ctx.document!.root.getChildren().map((s) => s.getId())).toEqual(["a", "c"]);
  });
});