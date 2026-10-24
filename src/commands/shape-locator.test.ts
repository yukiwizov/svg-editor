import { describe, it, expect } from "vitest";
import { locateShape } from "./ShapeLocator";
import { Document } from "../core/Document";
import { Group } from "../core/Group";
import { Rect } from "../core/Rect";

describe("ShapeLocator", () => {
  it("顶层元素", () => {
    const doc = new Document(800, 600);
    const r = new Rect("r1", 0, 0, 10, 10);
    doc.root.add(r);
    const located = locateShape(doc, "r1");
    expect(located).not.toBeNull();
    expect(located!.shape).toBe(r);
    expect(located!.parent).toBe(doc.root as any);
    expect(located!.index).toBe(0);
  });

  it("嵌套在 g 里", () => {
    const doc = new Document(800, 600);
    const g = new Group("g1");
    const inner = new Group("inner");
    const r = new Rect("r1", 0, 0, 10, 10);
    inner.add(r);
    g.add(inner);
    doc.root.add(g);

    const located = locateShape(doc, "r1");
    expect(located!.shape).toBe(r);
    expect(located!.parent).toBe(inner);
    expect(located!.index).toBe(0);
  });

  it("容器自身也能被定位", () => {
    const doc = new Document(800, 600);
    const g = new Group("g1");
    doc.root.add(g);
    const located = locateShape(doc, "g1");
    expect(located!.shape).toBe(g);
    expect(located!.parent).toBe(doc.root as any);
  });

  it("找不到返回 null", () => {
    const doc = new Document(800, 600);
    expect(locateShape(doc, "nope")).toBeNull();
  });

  it("多个同 id 取第一个（防御性，正常不会发生）", () => {
    const doc = new Document(800, 600);
    const a = new Rect("dup", 0, 0, 1, 1);
    const b = new Rect("dup", 0, 0, 1, 1);
    doc.root.add(a);
    doc.root.add(b);
    expect(locateShape(doc, "dup")!.shape).toBe(a);
  });
});