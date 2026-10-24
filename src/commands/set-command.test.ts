import { describe, it, expect } from "vitest";
import { SetCommand } from "./SetCommand";
import { EditorContext } from "./EditorContext";
import { Document } from "../core/Document";
import { Circle } from "../core/Circle";
import { Rect } from "../core/Rect";
import { TextShape } from "../core/TextShape";
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

describe("SetCommand — 成功路径", () => {
  it("set fill", () => {
    const c = new Circle("c1", 100, 100, 20);
    const ctx = setupWith([{ shape: c, id: "c1" }]);
    const r = new SetCommand("set", "c1", "fill", "red").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(r.lines).toEqual(['circle#c1 updated: fill="red"']);
    expect(c.getAttribute("fill")).toBe("red");
  });

  it("set 几何属性 x", () => {
    const rect = new Rect("r1", 0, 0, 10, 10);
    const ctx = setupWith([{ shape: rect, id: "r1" }]);
    const r = new SetCommand("set", "r1", "x", "50").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(rect.x).toBe(50);
  });

  it("set text 伪属性", () => {
    const t = new TextShape("t1", 0, 0, "old");
    const ctx = setupWith([{ shape: t, id: "t1" }]);
    const r = new SetCommand("set", "t1", "text", "new content").execute(ctx);
    expect(r.error).toBeUndefined();
    expect(t.getTextContent()).toBe("new content");
  });
});

describe("SetCommand — 错误分支", () => {
  it("unknown attribute", () => {
    const c = new Circle("c1", 0, 0, 1);
    const ctx = setupWith([{ shape: c, id: "c1" }]);
    expect(new SetCommand("set", "c1", "foo", "bar").execute(ctx).error).toBe(
      "unknown attribute: foo",
    );
  });

  it("invalid value (x=abc)", () => {
    const rect = new Rect("r1", 0, 0, 10, 10);
    const ctx = setupWith([{ shape: rect, id: "r1" }]);
    expect(new SetCommand("set", "r1", "x", "abc").execute(ctx).error).toBe(
      "invalid value for x: abc",
    );
  });

  it("no such shape", () => {
    const ctx = setupWith([]);
    expect(new SetCommand("set", "nope", "fill", "red").execute(ctx).error).toBe(
      "no such shape: nope",
    );
  });

  it("无文档", () => {
    expect(
      new SetCommand("set", "c1", "fill", "red").execute(new EditorContext()).error,
    ).toBe("no document. use 'init' or 'read' first");
  });
});

describe("SetCommand — undo/redo", () => {
  it("undo 恢复旧值", () => {
    const c = new Circle("c1", 0, 0, 1);
    c.setAttribute("fill", "red");
    const ctx = setupWith([{ shape: c, id: "c1" }]);
    const cmd = new SetCommand("set", "c1", "fill", "blue");
    cmd.execute(ctx);
    const r = cmd.undo(ctx);
    expect(r.error).toBeUndefined();
    expect(c.getAttribute("fill")).toBe("red");
  });

  it("undo 移除原本不存在的 presentation 属性", () => {
    const c = new Circle("c1", 0, 0, 1); // 无 fill
    const ctx = setupWith([{ shape: c, id: "c1" }]);
    const cmd = new SetCommand("set", "c1", "fill", "red");
    cmd.execute(ctx);
    expect(c.getAttribute("fill")).toBe("red");
    cmd.undo(ctx);
    expect(c.getAttribute("fill")).toBeNull();
  });

  it("undo text", () => {
    const t = new TextShape("t1", 0, 0, "old");
    const ctx = setupWith([{ shape: t, id: "t1" }]);
    const cmd = new SetCommand("set", "t1", "text", "new");
    cmd.execute(ctx);
    const r = cmd.undo(ctx);
    expect(r.error).toBeUndefined();
    expect(t.getTextContent()).toBe("old");
  });

  it("redo 再次应用", () => {
    const c = new Circle("c1", 0, 0, 1);
    const ctx = setupWith([{ shape: c, id: "c1" }]);
    const cmd = new SetCommand("set", "c1", "fill", "red");
    cmd.execute(ctx);
    cmd.undo(ctx);
    cmd.execute(ctx); // 模拟 redo
    expect(c.getAttribute("fill")).toBe("red");
  });
});