import { describe, it, expect } from "vitest";
import { SvgWriter } from "./SvgWriter";
import { Document } from "../core/Document";
import { Rect } from "../core/Rect";
import { Group } from "../core/Group";
import { Line } from "../core/Line";
import { TextShape } from "../core/TextShape";

describe("SvgWriter — 基础", () => {
  const w = new SvgWriter();

  it("空文档：只有 svg 根", () => {
    const doc = new Document(800, 600);
    expect(w.serialize(doc)).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">\n' +
        "</svg>\n",
    );
  });

  it("单个 rect：自闭合，id 属性在最前", () => {
    const doc = new Document(400, 200);
    doc.root.add(new Rect("r1", 10, 20, 100, 50, "#eee"));
    expect(w.serialize(doc)).toContain(
      '  <rect id="r1" x="10" y="20" width="100" height="50" fill="#eee"/>',
    );
  });

  it("text 内容在标签中间（不是属性）", () => {
    const doc = new Document(400, 200);
    doc.root.add(new TextShape("t1", 20, 40, "My Diagram"));
    expect(w.serialize(doc)).toContain(
      '  <text id="t1" x="20" y="40">My Diagram</text>',
    );
  });
});

describe("SvgWriter — 嵌套结构", () => {
  const w = new SvgWriter();

  it("g + rect + line：缩进正确", () => {
    const doc = new Document(400, 200);
    const g = new Group("flow");
    g.add(new Rect("start", 30, 70, 120, 60, "#4a90d9"));
    g.add(new Line("edge", 150, 100, 250, 100, "black"));
    doc.root.add(g);
    expect(w.serialize(doc)).toContain(
      '  <g id="flow">\n' +
        '    <rect id="start" x="30" y="70" width="120" height="60" fill="#4a90d9"/>\n' +
        '    <line id="edge" x1="150" y1="100" x2="250" y2="100" stroke="black"/>\n' +
        "  </g>",
    );
  });

  it("空 g 自闭合", () => {
    const doc = new Document(400, 200);
    doc.root.add(new Group("node1"));
    expect(w.serialize(doc)).toContain('  <g id="node1"/>');
  });

  it("三层嵌套缩进正确", () => {
    const doc = new Document(400, 200);
    const outer = new Group("outer");
    const inner = new Group("inner");
    inner.add(new Rect("r1", 0, 0, 10, 10));
    outer.add(inner);
    doc.root.add(outer);
    expect(w.serialize(doc)).toContain(
      '  <g id="outer">\n' +
        '    <g id="inner">\n' +
        '      <rect id="r1" x="0" y="0" width="10" height="10"/>\n' +
        "    </g>\n" +
        "  </g>",
    );
  });
});

describe("SvgWriter — 转义", () => {
  const w = new SvgWriter();

  it("文本内容中的 < & >", () => {
    const doc = new Document(100, 100);
    doc.root.add(new TextShape("t1", 0, 0, "a < b & c > d"));
    expect(w.serialize(doc)).toContain("a &lt; b &amp; c &gt; d");
  });

  it("属性值中的双引号", () => {
    const doc = new Document(100, 100);
    const r = new Rect("r1", 0, 0, 10, 10);
    r.setAttribute("fill", 'url(#"gradient")');
    doc.root.add(r);
    expect(w.serialize(doc)).toContain('fill="url(#&quot;gradient&quot;)"');
  });

  it("& 不二次转义", () => {
    const doc = new Document(100, 100);
    doc.root.add(new TextShape("t1", 0, 0, "&amp;"));
    expect(w.serialize(doc)).toContain("&amp;amp;");
  });
});

describe("SvgWriter — presentation 属性", () => {
  const w = new SvgWriter();

  it("省略的 presentation 属性不写出", () => {
    const doc = new Document(100, 100);
    doc.root.add(new Rect("r1", 0, 0, 10, 10));
    const out = w.serialize(doc);
    expect(out).not.toContain("fill=");
    expect(out).not.toContain("stroke=");
    expect(out).not.toContain("stroke-width=");
  });

  it("g 自身的 presentation 属性", () => {
    const doc = new Document(100, 100);
    const g = new Group("g1");
    g.setAttribute("fill", "red");
    doc.root.add(g);
    expect(w.serialize(doc)).toContain('<g id="g1" fill="red"/>');
  });
});