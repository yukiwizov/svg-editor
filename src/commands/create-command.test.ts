import { describe, it, expect, beforeEach } from "vitest";
import { CreateCommand } from "./CreateCommand";
import { EditorContext } from "./EditorContext";
import { Document } from "../core/Document";
import { Group } from "../core/Group";
import { locateShape } from "./ShapeLocator";
import { Rect } from "../core/Rect";

function setup(): EditorContext {
  const ctx = new EditorContext();
  ctx.document = new Document(800, 600);
  return ctx;
}

describe("CreateCommand — 成功路径", () => {
  let ctx: EditorContext;
  beforeEach(() => { ctx = setup(); });

  it("顶层创建", () => {
    const r = new CreateCommand("create", "rect", "r1", ["10", "20", "100", "50", "#eee"], null).execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["rect#r1 created"]);
    const located = locateShape(ctx.document!, "r1");
    expect(located!.shape.getAttribute("x")).toBe("10");
    expect(ctx.document!.ids.has("r1")).toBe(true);
  });

  it("in 子句挂进 g", () => {
    ctx.document!.root.add(new Group("node1"));
    ctx.document!.ids.reserve("node1");
    const r = new CreateCommand("create", "rect", "r1", ["10", "20", "100", "50"], "node1").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["rect#r1 created in g#node1"]);
    const located = locateShape(ctx.document!, "r1");
    const node1 = locateShape(ctx.document!, "node1")!.shape as Group;
    expect(located!.parent).toBe(node1);
  });

  it("创建 g 也是普通图形", () => {
    const r = new CreateCommand("create", "g", "g1", [], null).execute(ctx);
    expect(r.lines).toEqual(["g#g1 created"]);
    expect(locateShape(ctx.document!, "g1")!.shape).toBeInstanceOf(Group);
  });
});

describe("CreateCommand — 错误分支", () => {
  let ctx: EditorContext;
  beforeEach(() => { ctx = setup(); });

  it("id 已存在", () => {
    ctx.document!.root.add(new Group("g1"));
    ctx.document!.ids.reserve("g1");
    const r = new CreateCommand("create", "rect", "g1", ["0", "0", "1", "1"], null).execute(ctx);
    expect(r.error).toBe("id already exists: g1");
  });

  it("in 容器不存在", () => {
    const r = new CreateCommand("create", "rect", "r1", ["0", "0", "1", "1"], "nope").execute(ctx);
    expect(r.error).toBe("no such container: nope");
  });

  it("in 目标不是容器", () => {
    ctx.document!.root.add(new Rect("r2", 0, 0, 1, 1));
    ctx.document!.ids.reserve("r2");
    const r = new CreateCommand("create", "rect", "r1", ["0", "0", "1", "1"], "r2").execute(ctx);
    expect(r.error).toBe("not a container: r2");
    });

  it("未知类型", () => {
    const r = new CreateCommand("create", "hexagon", "h1", ["1", "2", "3"], null).execute(ctx);
    expect(r.error).toContain("unknown shape type: hexagon");
  });

  it("参数非法", () => {
    const r = new CreateCommand("create", "rect", "r1", ["abc", "0", "1", "1"], null).execute(ctx);
    expect(r.error).toBe("invalid value for rect.x: abc");
  });

  it("无文档", () => {
    const empty = new EditorContext();
    const r = new CreateCommand("create", "rect", "r1", ["0", "0", "1", "1"], null).execute(empty);
    expect(r.error).toBe("no document. use 'init' or 'read' first");
  });
});

describe("CreateCommand — undo/redo", () => {
  let ctx: EditorContext;
  beforeEach(() => { ctx = setup(); });

  it("undo 移除图形并释放 id", () => {
    const cmd = new CreateCommand("create", "rect", "r1", ["0", "0", "10", "10"], null);
    cmd.execute(ctx);
    expect(ctx.document!.ids.has("r1")).toBe(true);

    const r = cmd.undo(ctx);
    expect(r.error).toBeUndefined();
    expect(locateShape(ctx.document!, "r1")).toBeNull();
    expect(ctx.document!.ids.has("r1")).toBe(false);
  });

  it("redo 复用同一实例，恢复后 id 重新占用", () => {
    const cmd = new CreateCommand("create", "rect", "r1", ["0", "0", "10", "10"], null);
    cmd.execute(ctx);
    const originalShape = locateShape(ctx.document!, "r1")!.shape;
    cmd.undo(ctx);
    cmd.execute(ctx); // 模拟 redo
    const restored = locateShape(ctx.document!, "r1")!.shape;
    expect(restored).toBe(originalShape); // 同一实例
    expect(ctx.document!.ids.has("r1")).toBe(true);
  });

  it("in 子句：redo 时按 id 重新定位父容器", () => {
    ctx.document!.root.add(new Group("node1"));
    ctx.document!.ids.reserve("node1");
    const cmd = new CreateCommand("create", "rect", "r1", ["0", "0", "10", "10"], "node1");
    cmd.execute(ctx);
    cmd.undo(ctx);
    // 移除 node1（模拟节点被删除又 undo 恢复，实例是同一份）
    // 这里简单验证 redo 能重新找到 node1
    cmd.execute(ctx);
    const located = locateShape(ctx.document!, "r1");
    expect(located!.parent).toBe(locateShape(ctx.document!, "node1")!.shape);
  });
});