import { EditCommand } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { locateShape } from "./ShapeLocator";
import { parentLabel, subtreeContains } from "./util";
import { Shape } from "../core/Shape";
import { Container, isContainer } from "../core/Container";

interface AddToSnapshot {
  shape: Shape;
  parent: Container;
  index: number;
}

/**
 * addto <gid> <id>
 *
 * 把已有图形移入容器（作为最后一个子节点）。
 *
 * 逆操作：从 gid 摘除，恢复到原 parent 原 index。
 *
 * 错误：
 *  - no such container: <gid>
 *  - not a container: <gid>
 *  - no such shape: <id>
 *  - cannot add a container into itself: <gid>
 *  - cannot add container into its own descendant: <id>
 */
export class AddToCommand implements EditCommand {
  readonly category = "edit" as const;
  private snapshot: AddToSnapshot | null = null;

  constructor(
    readonly name: string,
    private readonly gid: string,
    private readonly id: string,
  ) {}

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    const doc = ctx.document;

    const containerLocated = locateShape(doc, this.gid);
    if (!containerLocated) {
      return err(`no such container: ${this.gid}`);
    }
    if (!isContainer(containerLocated.shape)) {
      return err(`not a container: ${this.gid}`);
    }
    const shapeLocated = locateShape(doc, this.id);
    if (!shapeLocated) {
      return err(`no such shape: ${this.id}`);
    }

    // 防环：id 就是 gid
    if (shapeLocated.shape === containerLocated.shape) {
      return err(`cannot add a container into itself: ${this.gid}`);
    }
    // 防环：id 是 gid 的祖先（即 gid 在 id 的子树里）
    if (subtreeContains(shapeLocated.shape, this.gid)) {
      return err(`cannot add container into its own descendant: ${this.id}`);
    }

    this.snapshot = {
      shape: shapeLocated.shape,
      parent: shapeLocated.parent,
      index: shapeLocated.index,
    };

    shapeLocated.parent.removeAt(shapeLocated.index);
    containerLocated.shape.add(shapeLocated.shape);

    return ok(
      `${shapeLocated.shape.getTagName()}#${this.id} added to g#${this.gid}`,
    );
  }

  undo(ctx: EditorContext): CommandResult {
    if (!ctx.document || !this.snapshot) {
      return err("internal: addto command has no state to undo");
    }
    const doc = ctx.document;

    const containerLocated = locateShape(doc, this.gid);
    if (!containerLocated || !isContainer(containerLocated.shape)) {
      return err(`internal: container ${this.gid} not found during undo`);
    }
    const idx = containerLocated.shape.indexOf(this.snapshot.shape);
    if (idx < 0) {
      return err(`internal: shape ${this.id} not in container during undo`);
    }
    containerLocated.shape.removeAt(idx);
    this.snapshot.parent.insertAt(this.snapshot.index, this.snapshot.shape);

    return ok(
      `${this.snapshot.shape.getTagName()}#${this.id} moved back to ${parentLabel(
        this.snapshot.parent,
        doc,
      )}`,
    );
  }
}