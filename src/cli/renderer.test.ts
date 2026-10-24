import { describe, it, expect } from "vitest";
import { Renderer } from "./Renderer";
import { Document } from "../core/Document";
import { Rect } from "../core/Rect";
import { TextShape } from "../core/TextShape";
import { Circle } from "../core/Circle";
import { Group } from "../core/Group";

describe("Renderer — tree 空文档", () => {
  it("只有 svg 根行", () => {
    const doc = new Document(800, 600);
    expect(new Renderer().renderTree(doc)).toEqual(["svg (800x600)"]);
  });
});

describe("Renderer — tree 与文档 §5.1 完全一致", () => {
  it("逐字符对齐", () => {
    const doc = new Document(800, 600);
    doc.root.add(new Rect("bg", 0, 0, 800, 600, "#ffffff"));
    doc.root.add(new TextShape("title", 20, 40, "My Diagram"));
    const g = new Group("markers");
    g.add(new Circle("c1", 100, 100, 20, "red"));
    g.add(new Rect("box", 200, 80, 60, 60, "#3366ff"));
    doc.root.add(g);

    expect(new Renderer().renderTree(doc)).toEqual([
      "svg (800x600)",
      "├── rect#bg        x=0 y=0 w=800 h=600 fill=#ffffff",
      '├── text#title     (20,40) "My Diagram"',
      "└── g#markers",
      "    ├── circle#c1  cx=100 cy=100 r=20 fill=red",
      "    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff",
    ]);
  });
});

describe("Renderer — tree 三层嵌套", () => {
  it("│ 缩进正确", () => {
    const doc = new Document(200, 100);
    const outer = new Group("outer");
    const inner = new Group("inner");
    inner.add(new Rect("r1", 0, 0, 10, 10));
    outer.add(inner);
    outer.add(new Rect("r2", 0, 0, 10, 10));
    doc.root.add(outer);

    const lines = new Renderer().renderTree(doc);
    expect(lines[0]).toBe("svg (200x100)");
    expect(lines[1].startsWith("└── g#outer")).toBe(true);
    expect(lines[2].startsWith("    ├── g#inner")).toBe(true);
    expect(lines[3].startsWith("    │   └── rect#r1")).toBe(true);
    expect(lines[4].startsWith("    └── rect#r2")).toBe(true);
  });
});

describe("Renderer — tree 属性缺失", () => {
  it("无 fill 时不留多余空格", () => {
    const doc = new Document(100, 100);
    doc.root.add(new Rect("r1", 0, 0, 10, 10));
    const lines = new Renderer().renderTree(doc);
    // 没有 fill 时行末不应有空格
    expect(lines[1]).toBe("└── rect#r1        x=0 y=0 w=10 h=10");
    expect(lines[1].endsWith(" ")).toBe(false);
  });

  it("空 g 无属性", () => {
    const doc = new Document(100, 100);
    doc.root.add(new Group("g1"));
    const lines = new Renderer().renderTree(doc);
    expect(lines[1]).toBe("└── g#g1");
  });
});

describe("Renderer — renderSubtree", () => {
  it("指定 id 为根", () => {
    const doc = new Document(800, 600);
    const g = new Group("g1");
    g.add(new Rect("r1", 0, 0, 10, 10));
    g.add(new Rect("r2", 20, 0, 10, 10));
    doc.root.add(g);

    const lines = new Renderer().renderSubtree(doc, "g1")!;
    expect(lines[0]).toMatch(/^g#g1/);
    expect(lines[1]).toMatch(/^├── rect#r1/);
    expect(lines[2]).toMatch(/^└── rect#r2/);
  });

  it("找不到返回 null", () => {
    const doc = new Document(800, 600);
    expect(new Renderer().renderSubtree(doc, "nope")).toBeNull();
  });
});

describe("Renderer — renderShow", () => {
  it("circle 明细（文档 §5.2）", () => {
    const doc = new Document(800, 600);
    const g = new Group("markers");
    g.add(new Circle("c1", 100, 100, 20, "red"));
    doc.root.add(g);

    expect(new Renderer().renderShow(doc, "c1")).toEqual([
      "circle#c1  parent=g#markers",
      "  cx=100 cy=100 r=20",
      "  fill=red",
    ]);
  });

  it("顶层 g：parent=svg", () => {
    const doc = new Document(800, 600);
    doc.root.add(new Group("g1"));
    expect(new Renderer().renderShow(doc, "g1")).toEqual([
      "g#g1  parent=svg",
    ]);
  });

  it("rect 明细用全称 width/height", () => {
    const doc = new Document(100, 100);
    doc.root.add(new Rect("r1", 0, 0, 10, 20, "#fff"));
    expect(new Renderer().renderShow(doc, "r1")).toEqual([
      "rect#r1  parent=svg",
      "  x=0 y=0 width=10 height=20",
      "  fill=#fff",
    ]);
  });

  it("找不到返回 null", () => {
    const doc = new Document(800, 600);
    expect(new Renderer().renderShow(doc, "nope")).toBeNull();
  });
});