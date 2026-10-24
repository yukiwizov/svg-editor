import { Shape, SetResult, formatNumber, parseNumber } from "./Shape";

export class TextShape extends Shape {
  private _x: number;
  private _y: number;
  private _content: string;

  constructor(id: string, x: number, y: number, content: string) {
    super(id);
    this._x = x;
    this._y = y;
    this._content = content;
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get content(): string { return this._content; }

  getTagName(): string {
    return "text";
  }

  getAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {
      x: formatNumber(this._x),
      y: formatNumber(this._y),
    };
    this.appendPresentation(attrs);
    return attrs;
  }

  getTextContent(): string | null {
    return this._content;
  }

  setAttribute(name: string, value: string): SetResult {
    if (name === "x") { const n = parseNumber(value); if (n === null) return "invalid"; this._x = n; return "ok"; }
    if (name === "y") { const n = parseNumber(value); if (n === null) return "invalid"; this._y = n; return "ok"; }
    // 编辑器便利属性：文档 4.1 的白名单包含 "text" 表示元素文本内容
    if (name === "text") { this._content = value; return "ok"; }
    return this.trySetPresentation(name, value);
  }

  moveBy(dx: number, dy: number): void {
    this._x += dx;
    this._y += dy;
  }

  scaleFromOrigin(factor: number): void {
    this._x *= factor;
    this._y *= factor;
  }
}