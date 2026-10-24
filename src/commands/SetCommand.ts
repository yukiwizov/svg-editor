import { EditCommand } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { locateShape } from "./ShapeLocator";
import { Shape } from "../core/Shape";

/**
 * set <id> <attr> <value>
 *
 * 逆操作：execute 前读旧值；undo 时若旧值存在则恢复，否则 removeAttribute。
 * 关于 text 伪属性：oldValue 来自 getTextContent()，对非 text 元素返回 null，
 * 但非 text 元素 setAttribute("text", ...) 会返回 unknown，因此不会误走 removeAttribute 分支。
 */
export class SetCommand implements EditCommand {
  readonly category = "edit" as const;
  private oldValue: string | null = null;
  private hasOldValue = false;

  constructor(
    readonly name: string,
    private readonly id: string,
    private readonly attrName: string,
    private readonly value: string,
  ) {}

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    const located = locateShape(ctx.document, this.id);
    if (!located) {
      return err(`no such shape: ${this.id}`);
    }
    const shape = located.shape;

    // 先读旧值（不改状态）
    const previous = this.readPrevious(shape);

    // 尝试设置（未知/非法时 setAttribute 无副作用）
    const result = shape.setAttribute(this.attrName, this.value);
    if (result === "unknown") {
      return err(`unknown attribute: ${this.attrName}`);
    }
    if (result === "invalid") {
      return err(`invalid value for ${this.attrName}: ${this.value}`);
    }

    // 成功：保存旧值供 undo
    this.oldValue = previous;
    this.hasOldValue = true;
    return ok(`${shape.getTagName()}#${this.id} updated: ${this.attrName}="${this.value}"`);
  }

  undo(ctx: EditorContext): CommandResult {
    if (!ctx.document || !this.hasOldValue) {
      return err("internal: set command has no state to undo");
    }
    const located = locateShape(ctx.document, this.id);
    if (!located) {
      return err(`internal: shape ${this.id} not found during undo`);
    }
    const shape = located.shape;

    if (this.oldValue === null) {
      shape.removeAttribute(this.attrName);
    } else {
      shape.setAttribute(this.attrName, this.oldValue);
    }
    const display = this.oldValue === null ? "(none)" : `"${this.oldValue}"`;
    return ok(`${shape.getTagName()}#${this.id} updated: ${this.attrName}=${display}`);
  }

  private readPrevious(shape: Shape): string | null {
    if (this.attrName === "text") {
      return shape.getTextContent();
    }
    return shape.getAttribute(this.attrName);
  }
}