import { EditCommand } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { locateShape } from "./ShapeLocator";
import { parseNumber } from "../core/Shape";

/**
 * scale <id> <factor>
 *
 * 逆操作：scaleFromOrigin(1 / factor)。有浮点精度妥协（factor=3 时 1/3 不精确，
 * 误差 ~1e-15 量级）。Phase 1 接受；见 doc/README 修订记录。
 */
export class ScaleCommand implements EditCommand {
  readonly category = "edit" as const;
  private readonly factorStr: string;
  private readonly factorNum: number;

  constructor(
    readonly name: string,
    private readonly id: string,
    factorStr: string,
  ) {
    this.factorStr = factorStr;
    this.factorNum = parseNumber(factorStr) ?? NaN;
  }

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    if (!Number.isFinite(this.factorNum)) {
      return err(`invalid value for scale factor: ${this.factorStr}`);
    }
    if (this.factorNum <= 0) {
      return err("scale factor must be positive");
    }
    const located = locateShape(ctx.document, this.id);
    if (!located) {
      return err(`no such shape: ${this.id}`);
    }
    located.shape.scaleFromOrigin(this.factorNum);
    return ok(`${located.shape.getTagName()}#${this.id} scaled by ${this.factorNum}`);
  }

  undo(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    const located = locateShape(ctx.document, this.id);
    if (!located) {
      return err(`internal: shape ${this.id} not found during undo`);
    }
    const inv = 1 / this.factorNum;
    located.shape.scaleFromOrigin(inv);
    return ok(`${located.shape.getTagName()}#${this.id} scaled back by ${inv}`);
  }
}