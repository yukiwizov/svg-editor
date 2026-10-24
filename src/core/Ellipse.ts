import { Shape, SetResult, formatNumber, parseNumber } from "./Shape";

export class Ellipse extends Shape {
  private _cx: number;
  private _cy: number;
  private _rx: number;
  private _ry: number;

  constructor(id: string, cx: number, cy: number, rx: number, ry: number, fill?: string) {
    super(id);
    this._cx = cx; this._cy = cy; this._rx = rx; this._ry = ry;
    this.fill = fill;
  }

  get cx(): number { return this._cx; }
  get cy(): number { return this._cy; }
  get rx(): number { return this._rx; }
  get ry(): number { return this._ry; }

  getTagName(): string { return "ellipse"; }

  getAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {
      cx: formatNumber(this._cx), cy: formatNumber(this._cy),
      rx: formatNumber(this._rx), ry: formatNumber(this._ry),
    };
    this.appendPresentation(attrs);
    return attrs;
  }

  setAttribute(name: string, value: string): SetResult {
    if (name === "cx") { const n = parseNumber(value); if (n === null) return "invalid"; this._cx = n; return "ok"; }
    if (name === "cy") { const n = parseNumber(value); if (n === null) return "invalid"; this._cy = n; return "ok"; }
    if (name === "rx") { const n = parseNumber(value); if (n === null) return "invalid"; this._rx = n; return "ok"; }
    if (name === "ry") { const n = parseNumber(value); if (n === null) return "invalid"; this._ry = n; return "ok"; }
    return this.trySetPresentation(name, value);
  }

  moveBy(dx: number, dy: number): void { this._cx += dx; this._cy += dy; }
  scaleFromOrigin(factor: number): void {
    this._cx *= factor; this._cy *= factor;
    this._rx *= factor; this._ry *= factor;
  }

  describePosition(): string {
    return `(${formatNumber(this._cx)},${formatNumber(this._cy)})`;
  }

  describeForTree(): string {
    const geom = `cx=${formatNumber(this._cx)} cy=${formatNumber(this._cy)} rx=${formatNumber(this._rx)} ry=${formatNumber(this._ry)}`;
    const p = this.getPresentationStr();
    return p ? `${geom} ${p}` : geom;
  }

  describeForShow(): string[] {
    const geom = `cx=${formatNumber(this._cx)} cy=${formatNumber(this._cy)} rx=${formatNumber(this._rx)} ry=${formatNumber(this._ry)}`;
    return [geom, ...this.getPresentationShowLines()];
  }
}