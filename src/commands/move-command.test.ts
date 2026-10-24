import { describe, it, expect, beforeEach } from "vitest";
import { MoveCommand } from "./MoveCommand";
import { EditorContext } from "./EditorContext";
import { Document } from "../core/Document";
import { Circle } from "../core/Circle";
import { Rect } from "../core/Rect";
import { Group } from "../core/Group";
import { Line } from "../core/Line";
import { Shape } from "../core/Shape";

function setupWith(shapes: Array<{ shape: Shape; id: string }>): EditorContext {
  const ctx = new EditorContext();
  const doc = new Document(800, 600);
  for (const { shape, id } of shapes) {
    doc.root.add(shape);
    doc.ids.reserve(id);
  }
  ctx.document = doc;
  return ctx;
}

describe("MoveCommand — 成功路径", () => {
  it("circle: moved to (130,100)", () => {
    const c = new Circle("c1", 100, 100, 20);
    const ctx = setupWith([{ shape: c, id: "c1" }]);
    const r = new MoveCommand("move", "c1", "30", "0").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(["circle#c1 moved to (130,100)"]);
    expect(c.cx).toBe(130);
  });

  it("rect: moved to", () => {
    const rect = new Rect("r1", 10, 20, 30, 40);
    const ctx = setupWith([{ shape: rect, id: "r1" }]);
    const r = new MoveCommand("move", "r1", "-5", "5").execute(ctx);
    expect(r.lines).toEqual(["rect#r1 moved to (5,25)"]);
  });

  it("g: moved by (dx,dy)", () => {
    const g = new Group("g1");
    g.add(new Circle("c1", 100, 100, 20));
    const ctx = setupWith([{ shape: g, id: "g1" }]);
    const r = new MoveCommand("move", "g1", "0", "100").execute(ctx);
    expect(r.lines).toEqual(["g#g1 moved by (0,100)"]);
  });

  it("line: moved to (x1,y1)->(x2,y2)", () => {
    const line = new Line("l1", 0, 0, 10, 10);
    const ctx = setupWith([{ shape: line, id: "l1" }]);
    const r = new MoveCommand("move", "l1", "5", "5").execute(ctx);
    expect(r.lines).toEqual(["line#l1 moved to (5,5)->(15,15)"]);
  });

  it("g 递归：子图形同步", () => {
    const g = new Group("g1");
    const c = new Circle("c1", 100, 100, 20);
    g.add(c);
    const ctx = setupWith([{ shape: g, id: "g1" }]);
    new MoveCommand("move", "g1", "10", "10").execute(ctx);
    expect([c.cx, c.cy]).toEqual([110, 110]);
  });
});

describe("MoveCommand — 错误分支", () => {
  it("no such shape", () => {
    const ctx = new Document(800, 600) && new EditorContext();
    ctx.document = new Document(800, 600);
    expect(new MoveCommand("move", "nope", "0", "0").execute(ctx).error).toBe(
      "no such shape: nope",
    );
  });

  it("invalid dx", () => {
    const ctx = setupWith([{ shape: new Circle("c1", 0, 0, 1), id: "c1" }]);
    expect(new MoveCommand("move", "c1", "abc", "0").execute(ctx).error).toBe(
      "invalid value for move.dx: abc",
    );
  });

  it("invalid dy", () => {
    const ctx = setupWith([{ shape: new Circle("c1", 0, 0, 1), id: "c1" }]);
    expect(new MoveCommand("move", "c1", "0", "abc").execute(ctx).error).toBe(
      "invalid value for move.dy: abc",
    );
  });

  it("无文档", () => {
    const empty = new EditorContext();
    expect(new MoveCommand("move", "c1", "0", "0").execute(empty).error).toBe(
      "no document. use 'init' or 'read' first",
    );
  });
});

describe("MoveCommand — undo/redo", () => {
  it("undo 回到原位；redo 再次移动", () => {
    const c = new Circle("c1", 100, 100, 20);
    const ctx = setupWith([{ shape: c, id: "c1" }]);
    const cmd = new MoveCommand("move", "c1", "30", "0");
    cmd.execute(ctx);
    const r1 = cmd.undo(ctx);
    expect(r1.lines).toEqual(["circle#c1 moved back to (100,100)"]);
    expect(c.cx).toBe(100);
    cmd.execute(ctx); // 模拟 redo
    expect(c.cx).toBe(130);
  });

  it("g undo：moved back by", () => {
    const g = new Group("g1");
    const ctx = setupWith([{ shape: g, id: "g1" }]);
    const cmd = new MoveCommand("move", "g1", "0", "100");
    cmd.execute(ctx);
    const r = cmd.undo(ctx);
    expect(r.lines).toEqual(["g#g1 moved back by (0,-100)"]);
  });
});