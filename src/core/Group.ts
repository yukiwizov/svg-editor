import { Shape, SetResult } from "./Shape";
import { Container } from "./Container";

/**
 * 分组容器（Composite 模式）。
 *
 * 语义：
 *  - moveBy / scaleFromOrigin 递归到全部子孙（核心 Composite 行为）；
 *  - setAttribute 只接受 presentation 属性，只存在 g 自身（SVG 原生继承）；
 *  - 不持有 parent 指针，也不输出 transform——坐标是扁平的（本阶段决策）。
 */
export class Group extends Shape implements Container {
  private children: Shape[] = [];

  constructor(id: string) {
    super(id);
  }

  getTagName(): string {
    return "g";
  }

  getAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {};
    this.appendPresentation(attrs);
    return attrs;
  }

  setAttribute(name: string, value: string): SetResult {
    // g 没有自身几何属性；只处理 fill / stroke / stroke-width
    return this.trySetPresentation(name, value);
  }

  moveBy(dx: number, dy: number): void {
    for (const child of this.children) {
      child.moveBy(dx, dy);
    }
  }

  scaleFromOrigin(factor: number): void {
    for (const child of this.children) {
      child.scaleFromOrigin(factor);
    }
  }

  // ---- Container ----

  getChildren(): readonly Shape[] {
    return this.children;
  }

  add(child: Shape): void {
    this.children.push(child);
  }

  insertAt(index: number, child: Shape): void {
    this.children.splice(index, 0, child);
  }

  removeAt(index: number): Shape | undefined {
    const removed = this.children.splice(index, 1);
    return removed[0];
  }

  indexOf(child: Shape): number {
    return this.children.indexOf(child);
  }
}