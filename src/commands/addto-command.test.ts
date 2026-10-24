import { describe, it, expect } from "vitest";
import { AddToCommand } from "./AddToCommand";
import { EditorContext } from "./EditorContext";
import { Document } from "../core/Document";
import { Group } from "../core/Group";
import { Rect } from "../core/Rect";
import { locateShape } from "./ShapeLocator";

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

function addGroup(doc: Document, id: string): Group {
  const g = new Group(id);
  doc.root.add(g);
  doc.ids.reserve(id);
  return g;
}

describe("AddToCommand — 成功路径", () => {
  it("把顶层 rect 移入 g", () => {
    const ctx = setup();
    addRect(ctx.document!, "r1");
    addGroup(ctx.document!, "g1");
    const r = new AddToCommand("addto", "g1", "r1").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["rect#r1 added to g#g1"]);
    expect(locateShape(ctx.document!, "r1")!.parent.getId()).toBe("g1");
  });

  it("嵌套层级间移动", () => {
    const ctx = setup();
    const gA = new Group("gA");
    const r1 = new Rect("r1", 0, 0, 1, 1);
    gA.add(r1);
    ctx.document!.root.add(gA);
    ["gA", "r1"].forEach((id) => ctx.document!.ids.reserve(id));
    addGroup(ctx.document!, "gB");

    new AddToCommand("addto", "gB", "r1").execute(ctx);
    expect(locateShape(ctx.document!, "r1")!.parent.getId()).toBe("gB");
    expect(gA.getChildren().length).toBe(0);
  });
});

describe("AddToCommand — 错误分支", () => {
  it("no such container", () => {
    const ctx = setup();
    addRect(ctx.document!, "r1");
    expect(new AddToCommand("addto", "nope", "r1").execute(ctx).error).toBe(
      "no such container: nope",
    );
  });

  it("not a container", () => {
    const ctx = setup();
    addRect(ctx.document!, "r1");
    addRect(ctx.document!, "r2");
    expect(new AddToCommand("addto", "r1", "r2").execute(ctx).error).toBe(
      "not a container: r1",
    );
  });

  it("no such shape", () => {
    const ctx = setup();
    addGroup(ctx.document!, "g1");
    expect(new AddToCommand("addto", "g1", "nope").execute(ctx).error).toBe(
      "no such shape: nope",
    );
  });

  it("加到自身", () => {
    const ctx = setup();
    addGroup(ctx.document!, "g1");
    expect(new AddToCommand("addto", "g1", "g1").execute(ctx).error).toBe(
      "cannot add a container into itself: g1",
    );
  });

  it("把祖先加进子孙", () => {
    const ctx = setup();
    const outer = new Group("outer");
    const inner = new Group("inner");
    outer.add(inner);
    ctx.document!.root.add(outer);
    ["outer", "inner"].forEach((id) => ctx.document!.ids.reserve(id));

    expect(new AddToCommand("addto", "inner", "outer").execute(ctx).error).toBe(
      "cannot add container into its own descendant: outer",
    );
  });

  it("无文档", () => {
    expect(new AddToCommand("addto", "g1", "r1").execute(new EditorContext()).error).toBe(
      "no document. use 'init' or 'read' first",
    );
  });
});

describe("AddToCommand — undo/redo", () => {
  it("undo 恢复到原 parent 原 index", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "b");
    addRect(ctx.document!, "r1");
    addRect(ctx.document!, "c");
    addGroup(ctx.document!, "g1");

    const cmd = new AddToCommand("addto", "g1", "r1");
    cmd.execute(ctx);
    const r = cmd.undo(ctx);
    expect(r.error).toBeUndefined();
    const ids = ctx.document!.root.getChildren().map((s) => s.getId());
    expect(ids).toEqual(["a", "b", "r1", "c", "g1"]);
  });
});