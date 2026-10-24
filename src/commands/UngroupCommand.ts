import { EditCommand } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { locateShape } from "./ShapeLocator";
import { Group } from "../core/Group";
import { Shape } from "../core/Shape";
import { Container, isContainer } from "../core/Container";

/**
 * ungroup <gid>
 *
 * 逆操作：
 *  - 执行：从 parent 摘除 g；把 g 的子节点依次插到 g 的原位置
 *  - undo：从 parent 摘除子节点（n 个挤在 index 处）；把子节点加回 g；
 *          把 g 插回原位置；重占 id
 *
 * 错误：
 *  - no such shape: <gid>
 *  - not a container: <gid>
 *  - cannot ungroup top-level container: <gid>
 *
 * 注：§4.2 的 'cannot ungroup composite shape' 本阶段不可达（无 box 插件），
 * 在 doc/README 的修订记录里说明。
 */
export class UngroupCommand implements EditCommand {
  readonly category = "edit" as const;
  private group: Group | null = null;
  private parent: Container | null = null;
  private index = -1;
  private children: Shape[] = [];

  constructor(
    readonly name: string,
    private readonly gid: string,
  ) {}

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    const doc = ctx.document;

    const located = locateShape(doc, this.gid);
    if (!located) {
      return err(`no such shape: ${this.gid}`);
    }
    if (!isContainer(located.shape)) {
      return err(`not a container: ${this.gid}`);
    }
    if (located.parent === doc.root) {
      return err(`cannot ungroup top-level container: ${this.gid}`);
    }

    this.group = located.shape as Group;
    this.parent = located.parent;
    this.index = located.index;
    this.children = [...located.shape.getChildren()];

    // 1) 从 parent 摘除 g
    located.parent.removeAt(located.index);

    // 2) 清空 g（物理上把 children 从 g 中移除）
    while (located.shape.getChildren().length > 0) {
      located.shape.removeAt(0);
    }

    // 3) children 依次插到 g 原位置
    for (let i = 0; i < this.children.length; i++) {
      located.parent.insertAt(located.index + i, this.children[i]);
    }

    // 4) 释放 g 的 id
    doc.ids.release(this.gid);

    return ok(
      `g#${this.gid} ungrouped (${this.children.length} children promoted)`,
    );
  }

  undo(ctx: EditorContext): CommandResult {
    if (!ctx.document || !this.group || !this.parent) {
      return err("internal: ungroup command has no state to undo");
    }
    const doc = ctx.document;

    // 1) 从 parent 摘除 children（它们在 index..index+n-1 位置）
    for (let i = 0; i < this.children.length; i++) {
      this.parent.removeAt(this.index);
    }

    // 2) 把 children 加回 g（保持顺序）
    for (const child of this.children) {
      this.group.add(child);
    }

    // 3) 把 g 插回原位置
    this.parent.insertAt(this.index, this.group);

    // 4) 重占 id
    doc.ids.reserve(this.gid);

    return ok(`g#${this.gid} regrouped (${this.children.length} children restored)`);
  }
}