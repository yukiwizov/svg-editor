import { describe, it, expect } from "vitest";
import { SvgReader } from "./SvgReader";
import { ShapeFactory } from "../core/ShapeFactory";
import { Group } from "../core/Group";

const reader = () => new SvgReader(new ShapeFactory());

const OTHER_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1">
    <rect id="r2" x="0" y="0" width="10" height="10"/>
    <circle id="c2" cx="5" cy="5" r="2"/>
  </g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>`;

describe("SvgReader — 基本读入", () => {
  it("other.svg：7 个元素，缺 id 的 rect 分配 rect1", () => {
    const { document, warnings } = reader().read(OTHER_SVG);
    expect(document.width).toBe(400);
    expect(document.height).toBe(300);
    expect(document.countElements()).toBe(7);
    expect(warnings).toEqual(["assigned id rect1 to unnamed <rect>"]);

    const top = document.root.getChildren().map((c) => c.getId());
    expect(top).toEqual(["rect1", "t1", "c1", "g1", "e1"]);

    const g1 = document.root.getChildren()[3] as Group;
    expect(g1.getChildren().map((c) => c.getId())).toEqual(["r2", "c2"]);
  });

  it("空 <svg/> → 空 Document，无 warning", () => {
    const { document, warnings } = reader().read('<svg xmlns="http://www.w3.org/2000/svg"/>');
    expect(document.countElements()).toBe(0);
    expect(warnings).toEqual([]);
  });
});

describe("SvgReader — id 自动分配", () => {
  it("已存在 rect1 时，无 id 的 rect 分配 rect2", () => {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
      <rect id="rect1" x="0" y="0" width="1" height="1"/>
      <rect x="0" y="0" width="1" height="1"/>
    </svg>`;
    const { document, warnings } = reader().read(xml);
    const ids = document.root.getChildren().map((c) => c.getId());
    expect(ids).toEqual(["rect1", "rect2"]);
    expect(warnings).toEqual(["assigned id rect2 to unnamed <rect>"]);
  });

  it("重复 id：后出现者重新分配", () => {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
      <rect id="dup" x="0" y="0" width="1" height="1"/>
      <rect id="dup" x="0" y="0" width="1" height="1"/>
    </svg>`;
    const { document, warnings } = reader().read(xml);
    const ids = document.root.getChildren().map((c) => c.getId());
    expect(ids).toEqual(["dup", "rect1"]);
    expect(warnings).toEqual([
      'assigned id rect1 to duplicate <rect> (original id="dup")',
    ]);
  });

  it("缺 id 的 g 也分配", () => {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
      <g><rect x="0" y="0" width="1" height="1"/></g>
    </svg>`;
    const { document, warnings } = reader().read(xml);
    const g = document.root.getChildren()[0] as Group;
    expect(g.getId()).toBe("g1");
    expect(g.getChildren()[0].getId()).toBe("rect1");
    expect(warnings).toEqual([
      "assigned id g1 to unnamed <g>",
      "assigned id rect1 to unnamed <rect>",
    ]);
  });

  it("父 id 与子 id 分配互不影响", () => {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
      <g id="g1">
        <g><rect x="0" y="0" width="1" height="1"/></g>
      </g>
    </svg>`;
    const { document } = reader().read(xml);
    const outer = document.root.getChildren()[0] as Group;
    const inner = outer.getChildren()[0] as Group;
    expect(outer.getId()).toBe("g1");
    expect(inner.getId()).toBe("g2");
    expect(inner.getChildren()[0].getId()).toBe("rect1");
  });
});

describe("SvgReader — 宽容读取", () => {
  it("未知标签跳过 + warning", () => {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
      <rect id="r1" x="0" y="0" width="1" height="1"/>
      <polygon id="p1" points="0,0 1,1 2,0"/>
    </svg>`;
    const { document, warnings } = reader().read(xml);
    expect(document.root.getChildren().map((c) => c.getId())).toEqual(["r1"]);
    expect(warnings).toEqual(['skipped unknown element <polygon id="p1">']);
  });

  it("transform 忽略 + warning", () => {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
      <g id="g1" transform="translate(5,5)">
        <rect id="r1" x="0" y="0" width="1" height="1"/>
      </g>
    </svg>`;
    const { document, warnings } = reader().read(xml);
    const g = document.root.getChildren()[0] as Group;
    expect(g.getChildren().length).toBe(1);
    expect(warnings).toEqual(["ignored transform on g#g1: translate(5,5)"]);
  });

  it("缺属性：rect 全部按 0 读入", () => {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
      <rect id="r1"/>
    </svg>`;
    const { document } = reader().read(xml);
    const r = document.root.getChildren()[0];
    expect(r.getAttributes()).toMatchObject({ x: "0", y: "0", width: "0", height: "0" });
  });
});

describe("SvgReader — 尺寸与命名空间", () => {
  it("width/height 优先", () => {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 999 999"/>`;
    const { document } = reader().read(xml);
    expect([document.width, document.height]).toEqual([400, 300]);
  });

  it("width/height 缺失，用 viewBox", () => {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"/>`;
    const { document } = reader().read(xml);
    expect([document.width, document.height]).toEqual([640, 480]);
  });

  it("百分比尺寸回退到 viewBox", () => {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 320 200"/>`;
    const { document } = reader().read(xml);
    expect([document.width, document.height]).toEqual([320, 200]);
  });

  it("全都缺失用默认 800×600", () => {
    const xml = `<svg xmlns="http://www.w3.org/2000/svg"><rect id="r1"/></svg>`;
    const { document } = reader().read(xml);
    expect([document.width, document.height]).toEqual([800, 600]);
  });

  it("命名空间前缀 <svg:svg> / <svg:rect> 也能读", () => {
    const xml = `<svg:svg xmlns:svg="http://www.w3.org/2000/svg" width="10" height="10">
      <svg:rect id="r1" x="0" y="0" width="1" height="1"/>
    </svg:svg>`;
    const { document } = reader().read(xml);
    expect(document.root.getChildren()[0].getId()).toBe("r1");
  });
});

describe("SvgReader — 异常输入", () => {
  it("空字符串", () => {
    expect(() => reader().read("")).toThrow();
  });

  it("非 svg 根", () => {
    expect(() => reader().read('<foo><bar/></foo>')).toThrow(/not an svg/i);
  });
});