import { Shape } from "../core/Shape";
import { Container, isContainer } from "../core/Container";
import { EditCommand } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { locateShape } from "./ShapeLocator";

/**
 * create <type> <id> [params…] [in <containerId>]
 *
 * 逆操作状态：
 *  - 首次 execute 时创建 shape 实例并缓存；redo 复用同一实例
 *  - 缓存 parent 引用（undo 时从 parent 移除）
 *  - 缓存 parentTag 用于重做时的成功消息
 *  - undo 时释放 id
 *
 * in 子句的 containerId 不缓存为对象：每次 execute 时按 id 重新定位
 * （即使 redo 时父容器被重建过也能找到当前实例）。
 */
export class CreateCommand implements EditCommand {
  readonly category = "edit" as const;

  private shape: Shape | null = null;
  private parent: Container | null = null;
  private parentTag: string = "svg";

  constructor(
    readonly name: string,
    private readonly type: string,
    private readonly id: string,
    private readonly params: string[],
    private readonly containerId: string | null,
  ) {}

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    const doc = ctx.document;

    if (doc.ids.has(this.id)) {
      return err(`id already exists: ${this.id}`);
    }

    let parent: Container;
    let parentTag: string;
    if (this.containerId !== null) {
      const located = locateShape(doc, this.containerId);
      if (!located) {
        return err(`no such container: ${this.containerId}`);
      }
      if (!isContainer(located.shape)) {
        return err(`not a container: ${this.containerId}`);
      }
      parent = located.shape;
      parentTag = located.shape.getTagName();
    } else {
      parent = doc.root;
      parentTag = "svg";
    }

    if (this.shape === null) {
      const result = ctx.factory.create(this.type, this.id, this.params);
      if (!(result instanceof Shape)) {
        return err(result.error);
      }
      this.shape = result;
    }

    doc.ids.reserve(this.id);
    parent.add(this.shape);
    this.parent = parent;
    this.parentTag = parentTag;

    const suffix =
      this.containerId !== null ? ` in ${parentTag}#${this.containerId}` : "";
    return ok(`${this.type}#${this.id} created${suffix}`);
  }

  undo(ctx: EditorContext): CommandResult {
    if (!ctx.document || !this.shape || !this.parent) {
      return err("internal: create command has no state to undo");
    }
    const index = this.parent.indexOf(this.shape);
    if (index < 0) {
      return err(`internal: shape ${this.id} not found in parent during undo`);
    }
    this.parent.removeAt(index);
    ctx.document.ids.release(this.id);
    return ok(`${this.type}#${this.id} creation undone`);
  }
}