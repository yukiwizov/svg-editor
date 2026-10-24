import { EditCommand } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { locateShape } from "./ShapeLocator";
import { Shape } from "../core/Shape";
import { Container } from "../core/Container";

/**
 * front <id>
 *
 * 把图形移到同级最前（子节点数组末尾 = 渲染最上层）。
 * 逆操作：从当前位置移除，插回原 parent 的原 index。
 *
 * 边界：
 *  - 已在末尾也执行一次"移除+追加"，行为上仍是位置不变，依旧成功；
 *  - 对 g 也有效（g 是 Shape，操作的是 g 在其 parent 里的位置）；
 *  - 只影响同级兄弟，不越级。
 */
export class FrontCommand implements EditCommand {
  readonly category = "edit" as const;
  private shape: Shape | null = null;
  private originalParent: Container | null = null;
  private originalIndex = -1;

  constructor(
    readonly name: string,
    private readonly id: string,
  ) {}

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    const located = locateShape(ctx.document, this.id);
    if (!located) {
      return err(`no such shape: ${this.id}`);
    }

    this.shape = located.shape;
    this.originalParent = located.parent;
    this.originalIndex = located.index;

    located.parent.removeAt(located.index);
    located.parent.add(located.shape);

    return ok(`${located.shape.getTagName()}#${this.id} moved to front`);
  }

  undo(ctx: EditorContext): CommandResult {
    if (!ctx.document || !this.shape || !this.originalParent) {
      return err("internal: front command has no state to undo");
    }
    const current = locateShape(ctx.document, this.id);
    if (!current) {
      return err(`internal: shape ${this.id} not found during undo`);
    }
    current.parent.removeAt(current.index);
    this.originalParent.insertAt(this.originalIndex, this.shape);
    return ok(`${this.shape.getTagName()}#${this.id} restored to original position`);
  }
}