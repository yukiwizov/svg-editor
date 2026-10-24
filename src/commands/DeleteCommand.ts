import { EditCommand } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { locateShape } from "./ShapeLocator";
import { parentLabel } from "./util";
import { Shape } from "../core/Shape";
import { Container } from "../core/Container";

interface DeleteSnapshot {
  shape: Shape;
  parent: Container;
  index: number;
}

export class DeleteCommand implements EditCommand {
  readonly category = "edit" as const;
  private snapshot: DeleteSnapshot | null = null;

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
    this.snapshot = {
      shape: located.shape,
      parent: located.parent,
      index: located.index,
    };
    located.parent.removeAt(located.index);
    return ok(`${located.shape.getTagName()}#${this.id} deleted`);
  }

  undo(ctx: EditorContext): CommandResult {
    if (!ctx.document || !this.snapshot) {
      return err("internal: delete command has no state to undo");
    }
    this.snapshot.parent.insertAt(this.snapshot.index, this.snapshot.shape);
    return ok(
      `${this.snapshot.shape.getTagName()}#${this.id} restored into ${parentLabel(
        this.snapshot.parent,
        ctx.document,
      )}`,
    );
  }
}