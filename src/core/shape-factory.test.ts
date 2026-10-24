import { describe, it, expect } from "vitest";
import { ShapeFactory } from "./ShapeFactory";
import { Rect } from "./Rect";
import { Circle } from "./Circle";
import { Ellipse } from "./Ellipse";
import { Line } from "./Line";
import { TextShape } from "./TextShape";
import { Group } from "./Group";
import { Shape } from "./Shape";

function createOk(f: ShapeFactory, type: string, id: string, params: string[]): Shape {
  const r = f.create(type, id, params);
  if (!(r instanceof Shape)) {
    throw new Error(`expected Shape, got error: ${r.error}`);
  }
  return r;
}

function createErr(f: ShapeFactory, type: string, params: string[]): string {
  const r = f.create(type, "any", params);
  if (r instanceof Shape) {
    throw new Error(`expected error, got Shape ${r.getId()}`);
  }
  return r.error;
}

describe("ShapeFactory — 内置类型", () => {
  const f = new ShapeFactory();

  it("rect", () => {
    const r = createOk(f, "rect", "r1", ["10", "20", "100", "50", "#eee"]);
    expect(r).toBeInstanceOf(Rect);
    expect(r.getAttributes()).toMatchObject({ x: "10", y: "20", width: "100", height: "50", fill: "#eee" });
  });

  it("circle / ellipse / line / text / g", () => {
    expect(createOk(f, "circle", "c1", ["1", "2", "3"])).toBeInstanceOf(Circle);
    expect(createOk(f, "ellipse", "e1", ["1", "2", "3", "4"])).toBeInstanceOf(Ellipse);
    expect(createOk(f, "line", "l1", ["0", "0", "10", "10", "black"])).toBeInstanceOf(Line);
    expect(createOk(f, "text", "t1", ["20", "40", "My Diagram"])).toBeInstanceOf(TextShape);
    expect(createOk(f, "g", "g1", [])).toBeInstanceOf(Group);
  });

  it("text 内容原样保留（含空格、中文）", () => {
    const t = createOk(f, "text", "t1", ["0", "0", "我的 图表"]) as TextShape;
    expect(t.getTextContent()).toBe("我的 图表");
  });
});

describe("ShapeFactory — 错误分支", () => {
  const f = new ShapeFactory();

  it("未知类型", () => {
    expect(createErr(f, "hexagon", ["1", "2"])).toBe(
      "unknown shape type: hexagon (is the plugin loaded?)",
    );
  });

  it("box 在本阶段也是未知类型（插件尚未加载）", () => {
    expect(createErr(f, "box", ["1", "2", "3", "4", "hi"])).toContain("unknown shape type: box");
  });

  it("参数个数错误", () => {
    expect(createErr(f, "rect", ["0", "0"])).toContain("rect expects 4 or 5 params");
    expect(createErr(f, "circle", ["0"])).toContain("circle expects 3 or 4 params");
    expect(createErr(f, "g", ["extra"])).toBe("g takes no params");
  });

  it("参数非数字", () => {
    expect(createErr(f, "rect", ["0", "0", "abc", "10"])).toBe("invalid value for rect.width: abc");
    expect(createErr(f, "circle", ["x", "0", "5"])).toBe("invalid value for circle.cx: x");
  });

  it("isRegistered 区分内置/未知", () => {
    expect(f.isRegistered("rect")).toBe(true);
    expect(f.isRegistered("box")).toBe(false);
  });
});

describe("ShapeFactory — createFromDom（宽容读取）", () => {
  const f = new ShapeFactory();

  it("rect 缺属性用默认 0", () => {
    const s = f.createFromDom("rect", "r1", { fill: "red" }, null);
    expect(s).toBeInstanceOf(Rect);
    expect(s!.getAttributes()).toMatchObject({ x: "0", y: "0", width: "0", height: "0", fill: "red" });
  });

  it("非法数字回落为 0，不抛异常", () => {
    const s = f.createFromDom("rect", "r1", { x: "abc", y: "5", width: "10", height: "10" }, null);
    expect(s!.getAttribute("x")).toBe("0");
    expect(s!.getAttribute("y")).toBe("5");
  });

  it("text 的文本内容传入", () => {
    const t = f.createFromDom("text", "t1", { x: "1", y: "2" }, "hello") as TextShape;
    expect(t.getTextContent()).toBe("hello");
  });

  it("presentation 属性透传", () => {
    const c = f.createFromDom("circle", "c1", { cx: "1", cy: "2", r: "3", stroke: "blue", "stroke-width": "2" }, null);
    expect(c!.getAttribute("stroke")).toBe("blue");
    expect(c!.getAttribute("stroke-width")).toBe("2");
  });

  it("未知 tag 返回 undefined（由 io 层警告跳过）", () => {
    expect(f.createFromDom("path", "p1", { d: "M0 0" }, null)).toBeUndefined();
  });
});