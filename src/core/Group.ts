import { Shape, SetResult } from "./Shape";
import { Container } from "./Container";

export class Group extends Shape implements Container {
  private children: Shape[] = [];

  constructor(id: string) { super(id); }

  getTagName(): string { return "g"; }

  getAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {};
    this.appendPresentation(attrs);
    return attrs;
  }

  setAttribute(name: string, value: string): SetResult {
    return this.trySetPresentation(name, value);
  }

  moveBy(dx: number, dy: number): void {
    for (const child of this.children) child.moveBy(dx, dy);
  }

  scaleFromOrigin(factor: number): void {
    for (const child of this.children) child.scaleFromOrigin(factor);
  }

  describePosition(): null {
    return null;
  }

  describeForTree(): string {
    return this.getPresentationStr();
  }

  describeForShow(): string[] {
    return this.getPresentationShowLines();
  }

  // ---- Container ----

  getChildren(): readonly Shape[] { return this.children; }
  add(child: Shape): void { this.children.push(child); }
  insertAt(index: number, child: Shape): void { this.children.splice(index, 0, child); }
  removeAt(index: number): Shape | undefined {
    const removed = this.children.splice(index, 1);
    return removed[0];
  }
  indexOf(child: Shape): number { return this.children.indexOf(child); }
}