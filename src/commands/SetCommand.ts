import { EditCommand } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { locateShape } from "./ShapeLocator";
import { Shape, SetResult } from "../core/Shape";
import { AttributeHandler } from "./AttributeHandler";

/** set <id> <attr> <value>; a plugin handler owns its memento and rollback. */
export class SetCommand implements EditCommand {
  readonly category = "edit" as const;
  private oldValue: string | null = null;
  private hasOldValue = false;
  private usedHandler: AttributeHandler | null = null;
  private handlerSnapshot: unknown;

  constructor(
    readonly name: string,
    private readonly id: string,
    private readonly attrName: string,
    private readonly value: string,
  ) {}

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) return err("no document. use 'init' or 'read' first");
    const located = locateShape(ctx.document, this.id);
    if (!located) return err(`no such shape: ${this.id}`);
    const shape = located.shape;
    const previous = this.readPrevious(shape);
    const handler = ctx.attributeHandlers.find(candidate => candidate.handles(shape, this.attrName));
    let result: SetResult;
    let captured = false;

    try {
      if (handler) {
        this.handlerSnapshot = handler.capture(shape, this.attrName);
        captured = true;
      }
      result = handler ? handler.apply(shape, this.attrName, this.value) : shape.setAttribute(this.attrName, this.value);
    } catch (error) {
      if (handler && captured) {
        try { handler.restore(shape, this.attrName, this.handlerSnapshot); }
        catch (rollbackError) {
          return err(`attribute handler failed and rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
        }
      }
      return err(`attribute handler failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (result !== "ok") {
      if (handler && captured) handler.restore(shape, this.attrName, this.handlerSnapshot);
      if (result === "unknown") return err(`unknown attribute: ${this.attrName}`);
      return err(`invalid value for ${this.attrName}: ${this.value}`);
    }

    this.oldValue = previous;
    this.usedHandler = handler ?? null;
    this.hasOldValue = true;
    return ok(`${shape.getTagName()}#${this.id} updated: ${this.attrName}="${this.value}"`);
  }

  undo(ctx: EditorContext): CommandResult {
    if (!ctx.document || !this.hasOldValue) return err("internal: set command has no state to undo");
    const located = locateShape(ctx.document, this.id);
    if (!located) return err(`internal: shape ${this.id} not found during undo`);
    const shape = located.shape;

    if (this.usedHandler) this.usedHandler.restore(shape, this.attrName, this.handlerSnapshot);
    else if (this.oldValue === null) shape.removeAttribute(this.attrName);
    else shape.setAttribute(this.attrName, this.oldValue);

    const display = this.oldValue === null ? "(none)" : `"${this.oldValue}"`;
    return ok(`${shape.getTagName()}#${this.id} updated: ${this.attrName}=${display}`);
  }

  private readPrevious(shape: Shape): string | null {
    if (this.attrName === "text") return shape.getTextContent();
    return shape.getAttribute(this.attrName);
  }
}
