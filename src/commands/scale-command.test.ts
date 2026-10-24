import { describe, it, expect } from "vitest";
import { ScaleCommand } from "./ScaleCommand";
import { EditorContext } from "./EditorContext";
import { Document } from "../core/Document";
import { Circle } from "../core/Circle";
import { Rect } from "../core/Rect";
import { Group } from "../core/Group";
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

describe("ScaleCommand — 成功路径", () => {
  it("circle r 20 → factor 2 → 40", () => {
    const c = new Circle("c1", 100, 100, 20);
    const ctx = setupWith([{ shape: c, id: "c1" }]);
    const r = new ScaleCommand("scale", "c1", "2").execute(ctx);
    expect(r.error).toBeUndefined();
    expect([c.cx, c.cy, c.r]).toEqual([200, 200, 40]);
  });

  it("g 递归", () => {
    const g = new Group("g1");
    const rect = new Rect("r1", 10, 20, 30, 40);
    g.add(rect);
    const ctx = setupWith([{ shape: g, id: "g1" }]);
    new ScaleCommand("scale", "g1", "2").execute(ctx);
    expect([rect.x, rect.y, rect.width, rect.height]).toEqual([20, 40, 60, 80]);
  });

  it("factor 0.5", () => {
    const c = new Circle("c1", 100, 100, 20);
    const ctx = setupWith([{ shape: c, id: "c1" }]);
    new ScaleCommand("scale", "c1", "0.5").execute(ctx);
    expect([c.cx, c.cy, c.r]).toEqual([50, 50, 10]);
  });
});

describe("ScaleCommand — 错误分支", () => {
  it("factor 0", () => {
    const ctx = setupWith([{ shape: new Circle("c1", 0, 0, 1), id: "c1" }]);
    expect(new ScaleCommand("scale", "c1", "0").execute(ctx).error).toBe(
      "scale factor must be positive",
    );
  });

  it("factor 负数", () => {
    const ctx = setupWith([{ shape: new Circle("c1", 0, 0, 1), id: "c1" }]);
    expect(new ScaleCommand("scale", "c1", "-1").execute(ctx).error).toBe(
      "scale factor must be positive",
    );
  });

  it("factor 非数字", () => {
    const ctx = setupWith([{ shape: new Circle("c1", 0, 0, 1), id: "c1" }]);
    expect(new ScaleCommand("scale", "c1", "abc").execute(ctx).error).toBe(
      "invalid value for scale factor: abc",
    );
  });

  it("no such shape", () => {
    const ctx = setupWith([]);
    expect(new ScaleCommand("scale", "nope", "2").execute(ctx).error).toBe(
      "no such shape: nope",
    );
  });

  it("无文档", () => {
    expect(new ScaleCommand("scale", "c1", "2").execute(new EditorContext()).error).toBe(
      "no document. use 'init' or 'read' first",
    );
  });
});

describe("ScaleCommand — undo/redo", () => {
  it("undo 恢复（使用 toBeCloseTo 容忍浮点）", () => {
    const c = new Circle("c1", 100, 100, 20);
    const ctx = setupWith([{ shape: c, id: "c1" }]);
    const cmd = new ScaleCommand("scale", "c1", "2");
    cmd.execute(ctx);
    const r = cmd.undo(ctx);
    expect(r.error).toBeUndefined();
    expect(c.cx).toBeCloseTo(100, 10);
    expect(c.cy).toBeCloseTo(100, 10);
    expect(c.r).toBeCloseTo(20, 10);
  });

  it("factor=3 的 undo 精度", () => {
    const c = new Circle("c1", 100, 100, 20);
    const ctx = setupWith([{ shape: c, id: "c1" }]);
    const cmd = new ScaleCommand("scale", "c1", "3");
    cmd.execute(ctx);
    cmd.undo(ctx);
    expect(c.cx).toBeCloseTo(100, 10);
    expect(c.r).toBeCloseTo(20, 10);
  });
});