import { describe, it, expect } from "vitest";
import { parentLabel, subtreeContains } from "./util";
import { Document } from "../core/Document";
import { Group } from "../core/Group";
import { Rect } from "../core/Rect";

describe("parentLabel", () => {
  it("root → svg", () => {
    const doc = new Document(800, 600);
    expect(parentLabel(doc.root, doc)).toBe("svg");
  });

  it("g → g#<id>", () => {
    const doc = new Document(800, 600);
    const g = new Group("g1");
    doc.root.add(g);
    expect(parentLabel(g, doc)).toBe("g#g1");
  });
});

describe("subtreeContains", () => {
  it("自身", () => {
    const r = new Rect("r1", 0, 0, 1, 1);
    expect(subtreeContains(r, "r1")).toBe(true);
    expect(subtreeContains(r, "nope")).toBe(false);
  });

  it("嵌套子节点", () => {
    const g = new Group("g1");
    const inner = new Group("inner");
    inner.add(new Rect("r1", 0, 0, 1, 1));
    g.add(inner);
    expect(subtreeContains(g, "inner")).toBe(true);
    expect(subtreeContains(g, "r1")).toBe(true);
    expect(subtreeContains(g, "g1")).toBe(true);
    expect(subtreeContains(g, "missing")).toBe(false);
  });
});