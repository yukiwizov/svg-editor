import { EditCommand } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { locateShape } from "./ShapeLocator";
import { Shape } from "../core/Shape";
import { Container } from "../core/Container";

/**
 * back <id>
 *
 * 把图形移到同级最后（子节点数组开头 = 渲染最下层）。
 * 逆操作：从当前位置移除，插回原 parent 的原 index。
 *
 * 与 FrontCommand 唯一差异：execute 阶段 insertAt(0, ...) 而不是 add(...)。
 */
export class BackCommand implements EditCommand {
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
    located.parent.insertAt(0, located.shape);

    return ok(`${located.shape.getTagName()}#${this.id} moved to back`);
  }

  undo(ctx: EditorContext): CommandResult {
    if (!ctx.document || !this.shape || !this.originalParent) {
      return err("internal: back command has no state to undo");
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