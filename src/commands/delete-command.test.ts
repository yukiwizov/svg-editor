import { describe, it, expect, beforeEach } from "vitest";
import { DeleteCommand } from "./DeleteCommand";
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

describe("DeleteCommand — 成功路径", () => {
  let ctx: EditorContext;
  beforeEach(() => { ctx = setup(); });

  it("删除顶层 rect", () => {
    ctx.document!.root.add(new Rect("r1", 0, 0, 10, 10));
    ctx.document!.ids.reserve("r1");
    const r = new DeleteCommand("delete", "r1").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["rect#r1 deleted"]);
    expect(locateShape(ctx.document!, "r1")).toBeNull();
    // 不释放 id
    expect(ctx.document!.ids.has("r1")).toBe(true);
  });

  it("删除容器连同子孙（子节点从树上消失，但被 snapshot 保存）", () => {
    const g = new Group("g1");
    g.add(new Rect("r1", 0, 0, 1, 1));
    g.add(new Rect("r2", 0, 0, 1, 1));
    ctx.document!.root.add(g);
    ctx.document!.ids.reserve("g1");
    ctx.document!.ids.reserve("r1");
    ctx.document!.ids.reserve("r2");

    const r = new DeleteCommand("delete", "g1").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(locateShape(ctx.document!, "g1")).toBeNull();
    expect(locateShape(ctx.document!, "r1")).toBeNull();
  });
});

describe("DeleteCommand — 错误分支", () => {
  let ctx: EditorContext;
  beforeEach(() => { ctx = setup(); });

  it("id 不存在", () => {
    const r = new DeleteCommand("delete", "r9").execute(ctx);
    expect(r.error).toBe("no such shape: r9");
  });

  it("无文档", () => {
    const empty = new EditorContext();
    const r = new DeleteCommand("delete", "r1").execute(empty);
    expect(r.error).toBe("no document. use 'init' or 'read' first");
  });
});

describe("DeleteCommand — undo/redo", () => {
  let ctx: EditorContext;
  beforeEach(() => { ctx = setup(); });

  it("undo 恢复到原父与原索引", () => {
    const g = new Group("g1");
    g.add(new Rect("a", 0, 0, 1, 1));
    const b = new Rect("b", 0, 0, 1, 1);
    const c = new Rect("c", 0, 0, 1, 1);
    g.add(b);
    g.add(c);
    ctx.document!.root.add(g);

    const cmd = new DeleteCommand("delete", "b");
    cmd.execute(ctx);
    expect(g.getChildren().map((s) => s.getId())).toEqual(["a", "c"]);

    const r = cmd.undo(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["rect#b restored into g#g1"]);
    expect(g.getChildren().map((s) => s.getId())).toEqual(["a", "b", "c"]);
  });

  it("undo 容器：整棵子树恢复（同一批实例）", () => {
    const g = new Group("g1");
    const r1 = new Rect("r1", 0, 0, 1, 1);
    g.add(r1);
    ctx.document!.root.add(g);

    const cmd = new DeleteCommand("delete", "g1");
    cmd.execute(ctx);
    cmd.undo(ctx);

    const restoredG = locateShape(ctx.document!, "g1")!.shape as Group;
    expect(restoredG).toBe(g); // 同一实例
    expect(restoredG.getChildren()[0]).toBe(r1);
  });

  it("redo 再次删除（按 id 重新定位）", () => {
    ctx.document!.root.add(new Rect("r1", 0, 0, 1, 1));
    const cmd = new DeleteCommand("delete", "r1");
    cmd.execute(ctx); // 删
    cmd.undo(ctx);    // 恢复
    cmd.execute(ctx); // 重做删除
    expect(locateShape(ctx.document!, "r1")).toBeNull();
  });

  it("undo 顶层：恢复到 svg 根", () => {
    ctx.document!.root.add(new Rect("r1", 0, 0, 1, 1));
    const cmd = new DeleteCommand("delete", "r1");
    cmd.execute(ctx);
    const r = cmd.undo(ctx);
    expect(r.lines).toEqual(["rect#r1 restored into svg"]);
  });
});