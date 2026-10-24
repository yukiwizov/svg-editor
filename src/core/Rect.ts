import { Shape, SetResult, formatNumber, parseNumber } from "./Shape";

export class Rect extends Shape {
  private _x: number;
  private _y: number;
  private _width: number;
  private _height: number;

  constructor(
    id: string, x: number, y: number, width: number, height: number, fill?: string,
  ) {
    super(id);
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this.fill = fill;
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get width(): number { return this._width; }
  get height(): number { return this._height; }

  getTagName(): string { return "rect"; }

  getAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {
      x: formatNumber(this._x), y: formatNumber(this._y),
      width: formatNumber(this._width), height: formatNumber(this._height),
    };
    this.appendPresentation(attrs);
    return attrs;
  }

  setAttribute(name: string, value: string): SetResult {
    if (name === "x") { const n = parseNumber(value); if (n === null) return "invalid"; this._x = n; return "ok"; }
    if (name === "y") { const n = parseNumber(value); if (n === null) return "invalid"; this._y = n; return "ok"; }
    if (name === "width") { const n = parseNumber(value); if (n === null) return "invalid"; this._width = n; return "ok"; }
    if (name === "height") { const n = parseNumber(value); if (n === null) return "invalid"; this._height = n; return "ok"; }
    return this.trySetPresentation(name, value);
  }

  moveBy(dx: number, dy: number): void { this._x += dx; this._y += dy; }
  scaleFromOrigin(factor: number): void {
    this._x *= factor; this._y *= factor;
    this._width *= factor; this._height *= factor;
  }

  describePosition(): string {
    return `(${formatNumber(this._x)},${formatNumber(this._y)})`;
  }

  describeForTree(): string {
    const geom = `x=${formatNumber(this._x)} y=${formatNumber(this._y)} w=${formatNumber(this._width)} h=${formatNumber(this._height)}`;
    const p = this.getPresentationStr();
    return p ? `${geom} ${p}` : geom;
  }

  describeForShow(): string[] {
    const lines = [
      `x=${formatNumber(this._x)} y=${formatNumber(this._y)} width=${formatNumber(this._width)} height=${formatNumber(this._height)}`,
    ];
    return [...lines, ...this.getPresentationShowLines()];
  }
}