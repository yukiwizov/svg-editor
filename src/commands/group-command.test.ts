import { describe, it, expect } from "vitest";
import { GroupCommand } from "./GroupCommand";
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

describe("GroupCommand — 成功路径", () => {
  it("顶层收编 2 个 rect", () => {
    const ctx = setup();
    addRect(ctx.document!, "r1");
    addRect(ctx.document!, "r2");
    const r = new GroupCommand("group", "g1", ["r1", "r2"]).execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["g#g1 created with 2 children"]);
    expect(locateShape(ctx.document!, "r1")!.parent.getId()).toBe("g1");
    expect(locateShape(ctx.document!, "r2")!.parent.getId()).toBe("g1");
  });

  it("从不同父容器收编", () => {
    const ctx = setup();
    const g1 = new Group("gA");
    ctx.document!.root.add(g1);
    ctx.document!.ids.reserve("gA");
    const r1 = new Rect("r1", 0, 0, 1, 1);
    g1.add(r1);
    ctx.document!.ids.reserve("r1");
    addRect(ctx.document!, "r2");

    const cmd = new GroupCommand("group", "newG", ["r1", "r2"]);
    expect(cmd.execute(ctx).error).toBeUndefined();
    expect(locateShape(ctx.document!, "r1")!.parent.getId()).toBe("newG");
    expect(locateShape(ctx.document!, "r2")!.parent.getId()).toBe("newG");
    expect(g1.getChildren().length).toBe(0);
  });
});

describe("GroupCommand — 错误分支", () => {
  it("id 已存在", () => {
    const ctx = setup();
    addRect(ctx.document!, "r1");
    const r = new GroupCommand("group", "r1", ["r1"]).execute(ctx);
    expect(r.error).toBe("id already exists: r1");
  });

  it("no such shape", () => {
    const ctx = setup();
    addRect(ctx.document!, "r1");
    const r = new GroupCommand("group", "g1", ["r1", "nope"]).execute(ctx);
    expect(r.error).toBe("no such shape: nope");
  });

  it("空 ids", () => {
    const ctx = setup();
    const r = new GroupCommand("group", "g1", []).execute(ctx);
    expect(r.error).toBe("group expects at least 1 shape id");
  });

  it("容器在子孙里", () => {
    const ctx = setup();
    const g = new Group("markers");
    const c = new Rect("c1", 0, 0, 1, 1);
    g.add(c);
    ctx.document!.root.add(g);
    ctx.document!.ids.reserve("markers");
    ctx.document!.ids.reserve("c1");

    const r = new GroupCommand("group", "bad", ["c1", "markers"]).execute(ctx);
    expect(r.error).toBe("cannot group a container into its own descendant: markers");
  });

  it("无文档", () => {
    const empty = new EditorContext();
    const r = new GroupCommand("group", "g1", ["r1"]).execute(empty);
    expect(r.error).toBe("no document. use 'init' or 'read' first");
  });
});

describe("GroupCommand — undo/redo", () => {
  it("undo 恢复所有子图形位置", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "b");
    addRect(ctx.document!, "r1");
    addRect(ctx.document!, "r2");
    addRect(ctx.document!, "c");

    const cmd = new GroupCommand("group", "g1", ["r1", "r2"]);
    cmd.execute(ctx);
    const r = cmd.undo(ctx);
    expect(r.error).toBeUndefined();
    expect(locateShape(ctx.document!, "g1")).toBeNull();
    // 原顺序恢复
    const ids = ctx.document!.root.getChildren().map((s) => s.getId());
    expect(ids).toEqual(["a", "b", "r1", "r2", "c"]);
  });

  it("redo 复用同一 Group 实例", () => {
    const ctx = setup();
    addRect(ctx.document!, "r1");
    const cmd = new GroupCommand("group", "g1", ["r1"]);
    cmd.execute(ctx);
    const originalG = locateShape(ctx.document!, "g1")!.shape;
    cmd.undo(ctx);
    cmd.execute(ctx);
    expect(locateShape(ctx.document!, "g1")!.shape).toBe(originalG);
  });

  it("相邻图形 undo 顺序正确", () => {
    const ctx = setup();
    addRect(ctx.document!, "a");
    addRect(ctx.document!, "c1");
    addRect(ctx.document!, "c2");
    addRect(ctx.document!, "d");
    const cmd = new GroupCommand("group", "g1", ["c1", "c2"]);
    cmd.execute(ctx);
    cmd.undo(ctx);
    const ids = ctx.document!.root.getChildren().map((s) => s.getId());
    expect(ids).toEqual(["a", "c1", "c2", "d"]);
  });
});