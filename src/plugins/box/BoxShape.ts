import { Shape, SetResult } from "../../core/Shape";
import { Container } from "../../core/Container";
import { Rect } from "../../core/Rect";
import { TextShape } from "../../core/TextShape";

/** Composite box with exactly one rect and one text structural child. */
export class BoxShape extends Shape implements Container {
  readonly rect: Rect;
  readonly label: TextShape;
  constructor(id: string, x: number, y: number, width: number, height: number, fill = "none", label = "", rect?: Rect, text?: TextShape) {
    super(id);
    this.rect = rect ?? new Rect(id + "-rect", x, y, width, height, fill);
    this.label = text ?? new TextShape(id + "-label", x + 8, y + 20, label);
    if (this.rect.getId() !== id + "-rect" || this.label.getId() !== id + "-label") {
      throw new Error("box requires child ids <id>-rect and <id>-label");
    }
  }
  getTagName(): string { return "g"; }
  getAttributes(): Record<string, string> { return { "data-kind": "box" }; }
  getAttribute(name: string): string | null {
    if (name === "fill") return this.rect.getAttribute("fill");
    if (name === "label") return this.label.content;
    return null;
  }
  setAttribute(_name: string, _value: string): SetResult { return "unknown"; }
  removeAttribute(name: string): void {
    if (name === "fill") this.rect.removeAttribute("fill");
    if (name === "label") this.label.setAttribute("text", "");
  }
  isUngroupable(): boolean { return false; }
  moveBy(dx: number, dy: number): void { this.rect.moveBy(dx, dy); this.label.moveBy(dx, dy); }
  scaleFromOrigin(factor: number): void { this.rect.scaleFromOrigin(factor); this.label.scaleFromOrigin(factor); }
  describePosition(): string { return this.rect.describePosition()!; }
  describeForTree(): string { return this.rect.describeForTree(); }
  describeForShow(): string[] { return [...this.rect.describeForShow(), `label="${this.label.content}"`]; }
  getChildren(): readonly Shape[] { return [this.rect, this.label]; }
  add(_child: Shape): void { throw new Error("box has fixed structural children"); }
  insertAt(_index: number, _child: Shape): void { throw new Error("box has fixed structural children"); }
  removeAt(_index: number): Shape | undefined { throw new Error("box structural children cannot be removed"); }
  indexOf(child: Shape): number { return this.getChildren().indexOf(child); }
}
