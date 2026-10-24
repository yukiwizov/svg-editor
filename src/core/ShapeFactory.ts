import { Shape, parseNumber } from "./Shape";
import { Rect } from "./Rect";
import { Circle } from "./Circle";
import { Ellipse } from "./Ellipse";
import { Line } from "./Line";
import { TextShape } from "./TextShape";
import { Group } from "./Group";

export type FactoryResult = Shape | { error: string };

/** create 命令的参数 → Shape；params 不含 id（id 由调用方传入）。 */
type Creator = (id: string, params: string[]) => FactoryResult;

/** 从 SVG DOM 节点构造一个 Shape；子节点（g 的 children）由 io 层递归后 add 进去。 */
type DomCreator = (
  id: string,
  attributes: Record<string, string>,
  textContent: string | null,
) => Shape;

/**
 * 图形工厂：类型名 → 类。整个工程中"按名字分派"的唯一允许点之一
 * （另一个是 cli/CommandRegistry），架构方案已标注为待插件化重构点。
 */
export class ShapeFactory {
  private creators = new Map<string, Creator>();
  private domCreators = new Map<string, DomCreator>();

  constructor() {
    this.registerDefaults();
  }

  /** 插件化阶段会从这里扩展；本阶段只用内置注册。 */
  register(name: string, creator: Creator, domCreator: DomCreator): void {
    this.creators.set(name, creator);
    this.domCreators.set(name, domCreator);
  }

  isRegistered(name: string): boolean {
    return this.creators.has(name);
  }

  // ---- create 命令入口 ----

  create(type: string, id: string, params: string[]): FactoryResult {
    const creator = this.creators.get(type);
    if (!creator) {
      return { error: `unknown shape type: ${type} (is the plugin loaded?)` };
    }
    return creator(id, params);
  }

  // ---- io 读入入口 ----

  createFromDom(
    tagName: string,
    id: string,
    attributes: Record<string, string>,
    textContent: string | null,
  ): Shape | undefined {
    const domCreator = this.domCreators.get(tagName);
    if (!domCreator) return undefined;
    return domCreator(id, attributes, textContent);
  }

  // ---- 内置注册 ----

  private registerDefaults(): void {
    this.register("rect", (id, p) => this.buildRect(id, p), (id, a) => {
      const r = new Rect(
        id,
        numOr(a, "x"),
        numOr(a, "y"),
        numOr(a, "width"),
        numOr(a, "height"),
        a.fill,
      );
      applyPresentation(r, a);
      return r;
    });

    this.register("circle", (id, p) => this.buildCircle(id, p), (id, a) => {
      const c = new Circle(id, numOr(a, "cx"), numOr(a, "cy"), numOr(a, "r"), a.fill);
      applyPresentation(c, a);
      return c;
    });

    this.register("ellipse", (id, p) => this.buildEllipse(id, p), (id, a) => {
      const e = new Ellipse(
        id,
        numOr(a, "cx"),
        numOr(a, "cy"),
        numOr(a, "rx"),
        numOr(a, "ry"),
        a.fill,
      );
      applyPresentation(e, a);
      return e;
    });

    this.register("line", (id, p) => this.buildLine(id, p), (id, a) => {
      const l = new Line(
        id,
        numOr(a, "x1"),
        numOr(a, "y1"),
        numOr(a, "x2"),
        numOr(a, "y2"),
        a.stroke,
      );
      // line 的 presentational 属性只剩 stroke-width；stroke 已经在构造里吃了
      if (a["stroke-width"] !== undefined) l.setAttribute("stroke-width", a["stroke-width"]);
      return l;
    });

    this.register("text", (id, p) => this.buildText(id, p), (id, a, t) => {
      const txt = new TextShape(id, numOr(a, "x"), numOr(a, "y"), t ?? "");
      applyPresentation(txt, a);
      return txt;
    });

    this.register(
      "g",
      (id, p) => this.buildGroup(id, p),
      (id) => new Group(id),
    );
  }

  // ---- 各类构造（解析数字、校验参数个数） ----

  private buildRect(id: string, p: string[]): FactoryResult {
    if (p.length < 4 || p.length > 5) {
      return { error: "rect expects 4 or 5 params: <x> <y> <w> <h> [fill]" };
    }
    const x = parseNumber(p[0]);
    const y = parseNumber(p[1]);
    const w = parseNumber(p[2]);
    const h = parseNumber(p[3]);
    if (x === null) return { error: `invalid value for rect.x: ${p[0]}` };
    if (y === null) return { error: `invalid value for rect.y: ${p[1]}` };
    if (w === null) return { error: `invalid value for rect.width: ${p[2]}` };
    if (h === null) return { error: `invalid value for rect.height: ${p[3]}` };
    return new Rect(id, x, y, w, h, p[4]);
  }

  private buildCircle(id: string, p: string[]): FactoryResult {
    if (p.length < 3 || p.length > 4) {
      return { error: "circle expects 3 or 4 params: <cx> <cy> <r> [fill]" };
    }
    const cx = parseNumber(p[0]);
    const cy = parseNumber(p[1]);
    const r = parseNumber(p[2]);
    if (cx === null) return { error: `invalid value for circle.cx: ${p[0]}` };
    if (cy === null) return { error: `invalid value for circle.cy: ${p[1]}` };
    if (r === null) return { error: `invalid value for circle.r: ${p[2]}` };
    return new Circle(id, cx, cy, r, p[3]);
  }

  private buildEllipse(id: string, p: string[]): FactoryResult {
    if (p.length < 4 || p.length > 5) {
      return { error: "ellipse expects 4 or 5 params: <cx> <cy> <rx> <ry> [fill]" };
    }
    const cx = parseNumber(p[0]);
    const cy = parseNumber(p[1]);
    const rx = parseNumber(p[2]);
    const ry = parseNumber(p[3]);
    if (cx === null) return { error: `invalid value for ellipse.cx: ${p[0]}` };
    if (cy === null) return { error: `invalid value for ellipse.cy: ${p[1]}` };
    if (rx === null) return { error: `invalid value for ellipse.rx: ${p[2]}` };
    if (ry === null) return { error: `invalid value for ellipse.ry: ${p[3]}` };
    return new Ellipse(id, cx, cy, rx, ry, p[4]);
  }

  private buildLine(id: string, p: string[]): FactoryResult {
    if (p.length < 4 || p.length > 5) {
      return { error: "line expects 4 or 5 params: <x1> <y1> <x2> <y2> [stroke]" };
    }
    const x1 = parseNumber(p[0]);
    const y1 = parseNumber(p[1]);
    const x2 = parseNumber(p[2]);
    const y2 = parseNumber(p[3]);
    if (x1 === null) return { error: `invalid value for line.x1: ${p[0]}` };
    if (y1 === null) return { error: `invalid value for line.y1: ${p[1]}` };
    if (x2 === null) return { error: `invalid value for line.x2: ${p[2]}` };
    if (y2 === null) return { error: `invalid value for line.y2: ${p[3]}` };
    return new Line(id, x1, y1, x2, y2, p[4]);
  }

  private buildText(id: string, p: string[]): FactoryResult {
    if (p.length !== 3) {
      return { error: 'text expects 3 params: <x> <y> "<content>"' };
    }
    const x = parseNumber(p[0]);
    const y = parseNumber(p[1]);
    if (x === null) return { error: `invalid value for text.x: ${p[0]}` };
    if (y === null) return { error: `invalid value for text.y: ${p[1]}` };
    return new TextShape(id, x, y, p[2]);
  }

  private buildGroup(id: string, p: string[]): FactoryResult {
    if (p.length !== 0) {
      return { error: "g takes no params" };
    }
    return new Group(id);
  }
}

// ---- 工具函数 ----

/** 从属性表里读一个数字；缺失或非法一律返回 0（宽容读取，警告由 io 层负责）。 */
function numOr(attrs: Record<string, string>, name: string): number {
  const v = attrs[name];
  if (v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** 把 SVG DOM 里的 stroke / stroke-width 透传到 shape（fill 由各构造器接收）。 */
function applyPresentation(shape: Shape, attrs: Record<string, string>): void {
  if (attrs.stroke !== undefined) shape.setAttribute("stroke", attrs.stroke);
  if (attrs["stroke-width"] !== undefined) shape.setAttribute("stroke-width", attrs["stroke-width"]);
}