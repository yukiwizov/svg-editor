import { EditCommand } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { locateShape } from "./ShapeLocator";
import { Shape } from "../core/Shape";
import { Container } from "../core/Container";
import { Document } from "../core/Document";

interface DeleteSnapshot {
  shape: Shape;
  parent: Container;
  index: number;
}

/**
 * delete <id>
 *
 * 逆操作状态：
 *  - execute 每次按 id 重新定位，缓存 {shape, parent, index}
 *  - undo 时把 shape 插回 parent 的 index 位置
 *  - 不释放 id（撤销"删除"回到"删除前"，删除前 id 是占用的）
 */
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

/**
 * 把"父容器"渲染成给用户看的短标签。
 * 由于 Container 接口已暴露 getTagName / getId，这里无需再 as Shape。
 */
function parentLabel(parent: Container, doc: Document): string {
  if (parent === doc.root) return "svg";
  return `${parent.getTagName()}#${parent.getId()}`;
}