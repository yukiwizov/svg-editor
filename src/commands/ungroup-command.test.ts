import { describe, it, expect } from "vitest";
import { UngroupCommand } from "./UngroupCommand";
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

describe("UngroupCommand — 成功路径", () => {
    it("解散容器：子节点提升到 parent", () => {
    const ctx = setup();
    // 中间容器 outer 挂在 root 下；g1 挂在 outer 下（非 top-level）
    const outer = new Group("outer");
    ctx.document!.root.add(outer);
    ctx.document!.ids.reserve("outer");

    // outer 中准备兄弟图形（before / after）
    const before = new Rect("before", 0, 0, 10, 10);
    outer.add(before);
    ctx.document!.ids.reserve("before");

    // outer 中准备 g1（含 2 个 rect）
    const g = new Group("g1");
    const r1 = new Rect("r1", 0, 0, 1, 1);
    const r2 = new Rect("r2", 0, 0, 1, 1);
    g.add(r1);
    g.add(r2);
    outer.add(g);
    ctx.document!.ids.reserve("g1");
    ctx.document!.ids.reserve("r1");
    ctx.document!.ids.reserve("r2");

    const after = new Rect("after", 0, 0, 10, 10);
    outer.add(after);
    ctx.document!.ids.reserve("after");

    const r = new UngroupCommand("ungroup", "g1").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["g#g1 ungrouped (2 children promoted)"]);

    // 子节点按 g1 原位提升：outer 子序列应为 before, r1, r2, after
    const ids = outer.getChildren().map((s) => s.getId());
    expect(ids).toEqual(["before", "r1", "r2", "after"]);

    expect(locateShape(ctx.document!, "g1")).toBeNull();
    expect(ctx.document!.ids.has("g1")).toBe(false);
  });
});

describe("UngroupCommand — 错误分支", () => {
  it("no such shape", () => {
    const ctx = setup();
    expect(new UngroupCommand("ungroup", "nope").execute(ctx).error).toBe(
      "no such shape: nope",
    );
  });

  it("not a container", () => {
    const ctx = setup();
    addRect(ctx.document!, "r1");
    expect(new UngroupCommand("ungroup", "r1").execute(ctx).error).toBe(
      "not a container: r1",
    );
  });

  it("top-level container", () => {
    const ctx = setup();
    const g = new Group("scene");
    ctx.document!.root.add(g);
    ctx.document!.ids.reserve("scene");
    expect(new UngroupCommand("ungroup", "scene").execute(ctx).error).toBe(
      "cannot ungroup top-level container: scene",
    );
  });

  it("无文档", () => {
    expect(new UngroupCommand("ungroup", "g1").execute(new EditorContext()).error).toBe(
      "no document. use 'init' or 'read' first",
    );
  });
});

describe("UngroupCommand — undo/redo", () => {
  it("undo 恢复 g 与 children", () => {
    const ctx = setup();
    const outer = new Group("outer");
    const g = new Group("g1");
    const r1 = new Rect("r1", 0, 0, 1, 1);
    const r2 = new Rect("r2", 0, 0, 1, 1);
    g.add(r1);
    g.add(r2);
    outer.add(g);
    ctx.document!.root.add(outer);
    ["outer", "g1", "r1", "r2"].forEach((id) => ctx.document!.ids.reserve(id));

    const cmd = new UngroupCommand("ungroup", "g1");
    cmd.execute(ctx);
    expect(outer.getChildren().map((s) => s.getId())).toEqual(["r1", "r2"]);

    const r = cmd.undo(ctx);
    expect(r.error).toBeUndefined();
    expect(outer.getChildren().map((s) => s.getId())).toEqual(["g1"]);
    expect(g.getChildren().map((s) => s.getId())).toEqual(["r1", "r2"]);
    expect(ctx.document!.ids.has("g1")).toBe(true);
  });
});