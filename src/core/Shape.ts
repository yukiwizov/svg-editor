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

  /** SVG 标签名：rect / circle / ellipse / line / text / g。 */
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

  /**
   * 移除一个属性。本阶段仅对 presentation 属性有效；
   * 几何属性（如 x/y/cx）有默认值，不支持"移除"——调用被静默忽略。
   * 用途：SetCommand 的 undo 需要恢复"属性原本不存在"的状态。
   */
  removeAttribute(name: string): void {
    if (name === "fill") { this.fill = undefined; return; }
    if (name === "stroke") { this.stroke = undefined; return; }
    if (name === "stroke-width") { this.strokeWidth = undefined; return; }
    // 其他属性：静默忽略
  }

  /** 增量平移。 */
  abstract moveBy(dx: number, dy: number): void;

  /** 以原点为中心等比缩放 factor（> 0），作用于全部几何属性（位置与尺寸）。 */
  abstract scaleFromOrigin(factor: number): void;

  /**
   * 位置描述：用于命令反馈中的 "moved to (...)" 一类输出。
   * 返回 null 表示该图形无位置概念（如 Group）。
   * 格式示例：rect/circle/text → "(10,20)"，line → "(0,0)->(10,10)"。
   */
  abstract describePosition(): string | null;

  /** tree 命令中，节点行内的属性串（不含 id、不含 tag）。 */
  abstract describeForTree(): string;

  /** show 命令中，缩进 2 空格后的多行属性串。每行一个，Renderer 只加缩进。 */
  abstract describeForShow(): string[];

  // ---- 子类共享：公共外观属性 ----

  protected trySetPresentation(name: string, value: string): SetResult {
    if (name === "fill") { this.fill = value; return "ok"; }
    if (name === "stroke") { this.stroke = value; return "ok"; }
    if (name === "stroke-width") { this.strokeWidth = value; return "ok"; }
    return "unknown";
  }

  protected appendPresentation(attrs: Record<string, string>): void {
    if (this.fill !== undefined) attrs.fill = this.fill;
    if (this.stroke !== undefined) attrs.stroke = this.stroke;
    if (this.strokeWidth !== undefined) attrs["stroke-width"] = this.strokeWidth;
  }

  /** 通用 presentation 追加串，如 " fill=red stroke=black"；都没有则返回 ""。 */
  protected getPresentationStr(): string {
    const parts: string[] = [];
    if (this.fill !== undefined) parts.push(`fill=${this.fill}`);
    if (this.stroke !== undefined) parts.push(`stroke=${this.stroke}`);
    if (this.strokeWidth !== undefined) parts.push(`stroke-width=${this.strokeWidth}`);
    return parts.join(" ");
  }

  /** show 用：presentation 行（当存在时）。 */
  protected getPresentationShowLines(): string[] {
    const line = this.getPresentationStr();
    return line ? [line] : [];
  }
}

/** 数字 → SVG 属性字符串。 */
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