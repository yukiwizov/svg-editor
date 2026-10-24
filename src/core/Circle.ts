import { Shape, SetResult, formatNumber, parseNumber } from "./Shape";

export class Circle extends Shape {
  private _cx: number;
  private _cy: number;
  private _r: number;

  constructor(id: string, cx: number, cy: number, r: number, fill?: string) {
    super(id);
    this._cx = cx; this._cy = cy; this._r = r;
    this.fill = fill;
  }

  get cx(): number { return this._cx; }
  get cy(): number { return this._cy; }
  get r(): number { return this._r; }

  getTagName(): string { return "circle"; }

  getAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {
      cx: formatNumber(this._cx), cy: formatNumber(this._cy), r: formatNumber(this._r),
    };
    this.appendPresentation(attrs);
    return attrs;
  }

  setAttribute(name: string, value: string): SetResult {
    if (name === "cx") { const n = parseNumber(value); if (n === null) return "invalid"; this._cx = n; return "ok"; }
    if (name === "cy") { const n = parseNumber(value); if (n === null) return "invalid"; this._cy = n; return "ok"; }
    if (name === "r")  { const n = parseNumber(value); if (n === null) return "invalid"; this._r = n; return "ok"; }
    return this.trySetPresentation(name, value);
  }

  moveBy(dx: number, dy: number): void { this._cx += dx; this._cy += dy; }
  scaleFromOrigin(factor: number): void {
    this._cx *= factor; this._cy *= factor; this._r *= factor;
  }

  describePosition(): string {
    return `(${formatNumber(this._cx)},${formatNumber(this._cy)})`;
  }

  describeForTree(): string {
    const geom = `cx=${formatNumber(this._cx)} cy=${formatNumber(this._cy)} r=${formatNumber(this._r)}`;
    const p = this.getPresentationStr();
    return p ? `${geom} ${p}` : geom;
  }

  describeForShow(): string[] {
    const geom = `cx=${formatNumber(this._cx)} cy=${formatNumber(this._cy)} r=${formatNumber(this._r)}`;
    return [geom, ...this.getPresentationShowLines()];
  }
}