import { describe, it, expect } from "vitest";
import { Rect } from "./Rect";
import { Circle } from "./Circle";
import { Ellipse } from "./Ellipse";
import { Line } from "./Line";
import { TextShape } from "./TextShape";

describe("Rect", () => {
  it("tag name and attributes", () => {
    const r = new Rect("r1", 10, 20, 100, 50, "#eee");
    expect(r.getTagName()).toBe("rect");
    expect(r.getAttributes()).toEqual({
      x: "10", y: "20", width: "100", height: "50", fill: "#eee",
    });
  });

  it("omitted fill is not written", () => {
    const r = new Rect("r1", 0, 0, 1, 1);
    expect(r.getAttributes()).not.toHaveProperty("fill");
  });

  it("setAttribute: ok / unknown / invalid", () => {
    const r = new Rect("r1", 0, 0, 10, 10);
    expect(r.setAttribute("x", "5")).toBe("ok");
    expect(r.x).toBe(5);
    expect(r.setAttribute("fill", "red")).toBe("ok");
    expect(r.getAttribute("fill")).toBe("red");
    expect(r.setAttribute("foo", "bar")).toBe("unknown");
    expect(r.setAttribute("width", "abc")).toBe("invalid");
    expect(r.width).toBe(10); // 非法值不改状态
  });

  it("moveBy and scaleFromOrigin", () => {
    const r = new Rect("r1", 10, 20, 100, 50);
    r.moveBy(5, -5);
    expect([r.x, r.y]).toEqual([15, 15]);
    r.scaleFromOrigin(2);
    expect([r.x, r.y, r.width, r.height]).toEqual([30, 30, 200, 100]);
  });
});

describe("Circle", () => {
  it("attributes and transform", () => {
    const c = new Circle("c1", 100, 100, 20, "red");
    expect(c.getTagName()).toBe("circle");
    expect(c.getAttributes()).toEqual({ cx: "100", cy: "100", r: "20", fill: "red" });
    c.moveBy(30, 0);
    expect(c.cx).toBe(130);
    c.scaleFromOrigin(0.5);
    expect([c.cx, c.cy, c.r]).toEqual([65, 50, 10]);
  });
});

describe("Ellipse", () => {
  it("attributes and setAttribute", () => {
    const e = new Ellipse("e1", 1, 2, 3, 4);
    expect(e.getAttributes()).toEqual({ cx: "1", cy: "2", rx: "3", ry: "4" });
    expect(e.setAttribute("rx", "9")).toBe("ok");
    expect(e.rx).toBe(9);
  });
});

describe("Line", () => {
  it("attributes and scale", () => {
    const l = new Line("l1", 0, 0, 10, 10, "black");
    expect(l.getTagName()).toBe("line");
    expect(l.getAttributes()).toEqual({
      x1: "0", y1: "0", x2: "10", y2: "10", stroke: "black",
    });
    l.scaleFromOrigin(3);
    expect([l.x1, l.y1, l.x2, l.y2]).toEqual([0, 0, 30, 30]);
  });
});

describe("TextShape", () => {
  it("text content and 'text' pseudo-attribute", () => {
    const t = new TextShape("t1", 20, 40, "My Diagram");
    expect(t.getTagName()).toBe("text");
    expect(t.getTextContent()).toBe("My Diagram");
    expect(t.getAttributes()).toEqual({ x: "20", y: "40" });
    expect(t.setAttribute("text", "v2")).toBe("ok");
    expect(t.getTextContent()).toBe("v2");
  });

  it("moveBy and scale affect position only", () => {
    const t = new TextShape("t1", 20, 40, "x");
    t.moveBy(10, 10);
    expect([t.x, t.y]).toEqual([30, 50]);
    t.scaleFromOrigin(2);
    expect([t.x, t.y]).toEqual([60, 100]);
    expect(t.getTextContent()).toBe("x");
  });
});