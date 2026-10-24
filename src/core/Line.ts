import { Shape, SetResult, formatNumber, parseNumber } from "./Shape";

export class Line extends Shape {
  private _x1: number;
  private _y1: number;
  private _x2: number;
  private _y2: number;

  constructor(id: string, x1: number, y1: number, x2: number, y2: number, stroke?: string) {
    super(id);
    this._x1 = x1; this._y1 = y1; this._x2 = x2; this._y2 = y2;
    this.stroke = stroke;
  }

  get x1(): number { return this._x1; }
  get y1(): number { return this._y1; }
  get x2(): number { return this._x2; }
  get y2(): number { return this._y2; }

  getTagName(): string { return "line"; }

  getAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {
      x1: formatNumber(this._x1), y1: formatNumber(this._y1),
      x2: formatNumber(this._x2), y2: formatNumber(this._y2),
    };
    this.appendPresentation(attrs);
    return attrs;
  }

  setAttribute(name: string, value: string): SetResult {
    if (name === "x1") { const n = parseNumber(value); if (n === null) return "invalid"; this._x1 = n; return "ok"; }
    if (name === "y1") { const n = parseNumber(value); if (n === null) return "invalid"; this._y1 = n; return "ok"; }
    if (name === "x2") { const n = parseNumber(value); if (n === null) return "invalid"; this._x2 = n; return "ok"; }
    if (name === "y2") { const n = parseNumber(value); if (n === null) return "invalid"; this._y2 = n; return "ok"; }
    return this.trySetPresentation(name, value);
  }

  moveBy(dx: number, dy: number): void {
    this._x1 += dx; this._y1 += dy;
    this._x2 += dx; this._y2 += dy;
  }
  scaleFromOrigin(factor: number): void {
    this._x1 *= factor; this._y1 *= factor;
    this._x2 *= factor; this._y2 *= factor;
  }

  describePosition(): string {
    return `(${formatNumber(this._x1)},${formatNumber(this._y1)})->(${formatNumber(this._x2)},${formatNumber(this._y2)})`;
  }

  describeForTree(): string {
    const geom = `(${formatNumber(this._x1)},${formatNumber(this._y1)}) -> (${formatNumber(this._x2)},${formatNumber(this._y2)})`;
    const p = this.getPresentationStr();
    return p ? `${geom} ${p}` : geom;
  }

  describeForShow(): string[] {
    const geom = `(${formatNumber(this._x1)},${formatNumber(this._y1)}) -> (${formatNumber(this._x2)},${formatNumber(this._y2)})`;
    return [geom, ...this.getPresentationShowLines()];
  }
}