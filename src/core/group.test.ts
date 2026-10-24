import { describe, it, expect } from "vitest";
import { Group } from "./Group";
import { Rect } from "./Rect";
import { Circle } from "./Circle";

describe("Group — 基础", () => {
  it("tag name 与空属性", () => {
    const g = new Group("g1");
    expect(g.getTagName()).toBe("g");
    expect(g.getAttributes()).toEqual({});
    expect(g.getChildren()).toEqual([]);
  });

  it("presentation 属性存在 g 自身（SVG 原生继承）", () => {
    const g = new Group("g1");
    expect(g.setAttribute("fill", "red")).toBe("ok");
    expect(g.getAttributes()).toEqual({ fill: "red" });
  });

  it("g 没有几何属性", () => {
    const g = new Group("g1");
    expect(g.setAttribute("x", "10")).toBe("unknown");
    expect(g.setAttribute("width", "10")).toBe("unknown");
    expect(g.setAttribute("cx", "10")).toBe("unknown");
  });
});

describe("Group — Container", () => {
  it("add / insertAt / removeAt / indexOf 维持顺序", () => {
    const g = new Group("g1");
    const r1 = new Rect("r1", 0, 0, 1, 1);
    const r2 = new Rect("r2", 0, 0, 1, 1);
    const r3 = new Rect("r3", 0, 0, 1, 1);
    g.add(r1);
    g.add(r3);
    g.insertAt(1, r2);
    expect(g.getChildren().map((c) => c.getId())).toEqual(["r1", "r2", "r3"]);
    expect(g.indexOf(r2)).toBe(1);
    expect(g.indexOf(new Rect("other", 0, 0, 1, 1))).toBe(-1);
    expect(g.removeAt(1)?.getId()).toBe("r2");
    expect(g.getChildren().map((c) => c.getId())).toEqual(["r1", "r3"]);
  });

  it("removeAt 越界返回 undefined", () => {
    const g = new Group("g1");
    expect(g.removeAt(0)).toBeUndefined();
    expect(g.removeAt(99)).toBeUndefined();
  });
});

describe("Group — Composite 语义", () => {
  it("moveBy 递归到全部子孙，g 自身不写 transform", () => {
    const g = new Group("g1");
    const r = new Rect("r1", 10, 20, 30, 40);
    const c = new Circle("c1", 100, 100, 20);
    g.add(r);
    g.add(c);
    g.moveBy(5, 10);
    expect([r.x, r.y]).toEqual([15, 30]);
    expect([c.cx, c.cy]).toEqual([105, 110]);
    expect(g.getAttributes()).toEqual({}); // 没有 transform
  });

  it("scaleFromOrigin 递归到全部子孙", () => {
    const g = new Group("g1");
    const r = new Rect("r1", 10, 20, 30, 40);
    g.add(r);
    g.scaleFromOrigin(2);
    expect([r.x, r.y, r.width, r.height]).toEqual([20, 40, 60, 80]);
  });

  it("嵌套 g：递归一直到底", () => {
    const outer = new Group("outer");
    const inner = new Group("inner");
    const r = new Rect("r1", 0, 0, 10, 10);
    inner.add(r);
    outer.add(inner);
    outer.moveBy(100, 50);
    expect([r.x, r.y]).toEqual([100, 50]);
    outer.scaleFromOrigin(0.5);
    expect([r.x, r.y, r.width, r.height]).toEqual([50, 25, 5, 5]);
  });

  it("空 g：move / scale 是 no-op，不抛异常", () => {
    const g = new Group("g1");
    expect(() => g.moveBy(10, 10)).not.toThrow();
    expect(() => g.scaleFromOrigin(2)).not.toThrow();
  });

  it("对普通图形与对 g 的操作是同一种调用（多态）", () => {
    // 命令层不关心是叶子还是容器，都走 Shape 接口
    const shapes = [
      new Rect("r1", 0, 0, 10, 10),
      new Group("g1"),
    ];
    for (const s of shapes) {
      s.moveBy(5, 5);
      s.scaleFromOrigin(2);
    }
    // 具体数值在此不重复断言，此测重点是行为一致性
  });
});