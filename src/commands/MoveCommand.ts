import { EditCommand } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { locateShape } from "./ShapeLocator";
import { Shape, parseNumber } from "../core/Shape";

/**
 * move <id> <dx> <dy>
 *
 * 逆操作：按 id 重新定位后 moveBy(-dx, -dy)（精确对称）。
 * 输出格式：有位置概念的图形 → "moved to (x,y)"；容器 → "moved by (dx,dy)"。
 */
export class MoveCommand implements EditCommand {
  readonly category = "edit" as const;
  private readonly dxNum: number;
  private readonly dyNum: number;
  private readonly dxStr: string;
  private readonly dyStr: string;

  constructor(
    readonly name: string,
    private readonly id: string,
    dxStr: string,
    dyStr: string,
  ) {
    this.dxStr = dxStr;
    this.dyStr = dyStr;
    this.dxNum = parseNumber(dxStr) ?? NaN;
    this.dyNum = parseNumber(dyStr) ?? NaN;
  }

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    if (!Number.isFinite(this.dxNum)) {
      return err(`invalid value for move.dx: ${this.dxStr}`);
    }
    if (!Number.isFinite(this.dyNum)) {
      return err(`invalid value for move.dy: ${this.dyStr}`);
    }
    const located = locateShape(ctx.document, this.id);
    if (!located) {
      return err(`no such shape: ${this.id}`);
    }
    located.shape.moveBy(this.dxNum, this.dyNum);
    return ok(this.describe(located.shape, "moved"));
  }

  undo(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    const located = locateShape(ctx.document, this.id);
    if (!located) {
      return err(`internal: shape ${this.id} not found during undo`);
    }
    located.shape.moveBy(-this.dxNum, -this.dyNum);
    return ok(this.describe(located.shape, "moved back"));
  }

  private describe(shape: Shape, verb: "moved" | "moved back"): string {
    const label = `${shape.getTagName()}#${this.id}`;
    const pos = shape.describePosition();
    if (pos !== null) {
      return `${label} ${verb} to ${pos}`;
    }
    const dx = verb === "moved" ? this.dxNum : -this.dxNum;
    const dy = verb === "moved" ? this.dyNum : -this.dyNum;
    return `${label} ${verb} by (${dx},${dy})`;
  }
}