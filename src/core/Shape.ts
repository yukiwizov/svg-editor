export type SetResult = "ok" | "unknown" | "invalid";

/**
 * 所有图形元素的抽象基类。
 *
 * 多态要点：按图形类型有差异的行为全部下沉到子类的 override。
 * 依赖方向：core 不知道 io / commands / cli；序列化信息通过
 * getTagName / getAttributes / getTextContent 提供给上层，由 io 拼接文本。
 */
export abstract class Shape {
  protected fill?: string;
  protected stroke?: string;
  protected strokeWidth?: string;

  protected constructor(public readonly id: string) {}

  getId(): string {
    return this.id;
  }

  /** SVG 标签名：rect / circle / ellipse / line / text（Group 后续实现为 g）。 */
  abstract getTagName(): string;

  /** 该图形的属性集合（不含 id，不含子节点，不含文本内容）。 */
  abstract getAttributes(): Record<string, string>;

  /** text 元素返回文本内容；其它图形返回 null。 */
  getTextContent(): string | null {
    return null;
  }

  /** 读取单个属性（基于 getAttributes，子类可覆盖以优化）。 */
  getAttribute(name: string): string | null {
    return this.getAttributes()[name] ?? null;
  }

  /** 设置一个属性；调用方按返回值分支报错。 */
  abstract setAttribute(name: string, value: string): SetResult;

  /** 增量平移。 */
  abstract moveBy(dx: number, dy: number): void;

  /** 以原点为中心等比缩放 factor（> 0），作用于全部几何属性（位置与尺寸）。 */
  abstract scaleFromOrigin(factor: number): void;

  // ---- 子类共享：公共外观属性 ----

  protected trySetPresentation(name: string, value: string): SetResult {
    if (name === "fill") {
      this.fill = value;
      return "ok";
    }
    if (name === "stroke") {
      this.stroke = value;
      return "ok";
    }
    if (name === "stroke-width") {
      this.strokeWidth = value;
      return "ok";
    }
    return "unknown";
  }

  protected appendPresentation(attrs: Record<string, string>): void {
    if (this.fill !== undefined) attrs.fill = this.fill;
    if (this.stroke !== undefined) attrs.stroke = this.stroke;
    if (this.strokeWidth !== undefined) attrs["stroke-width"] = this.strokeWidth;
  }
}

/** 数字 → SVG 属性字符串。防御非有限值（构造/命令层应已拦截）。 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) {
    throw new Error(`non-finite number: ${n}`);
  }
  return String(n);
}

/** 字符串 → 数字；非法返回 null。 */
export function parseNumber(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}