import { EditCommand } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { locateShape } from "./ShapeLocator";
import { subtreeContains } from "./util";
import { Group } from "../core/Group";
import { Shape } from "../core/Shape";
import { Container, isContainer } from "../core/Container";

interface GroupSnapshot {
  shape: Shape;
  parent: Container;
  index: number;
}

/**
 * group <newGid> <id1> <id2>…
 *
 * 逆操作：
 *  - 首次 execute 创建 Group 实例；undo 后 redo 复用
 *  - 收编时逐个"定位→记录当前 index→摘除"
 *  - undo 逆序恢复（multiple shapes from same parent 时正确）
 *
 * 错误：
 *  - id already exists: <gid>
 *  - no such shape: <id>
 *  - cannot group a container into its own descendant: <id>
 */
export class GroupCommand implements EditCommand {
  readonly category = "edit" as const;
  private group: Group | null = null;
  private snapshots: GroupSnapshot[] = [];

  constructor(
    readonly name: string,
    private readonly newGid: string,
    private readonly ids: string[],
  ) {}

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    const doc = ctx.document;

    if (this.ids.length === 0) {
      return err("group expects at least 1 shape id");
    }
    if (doc.ids.has(this.newGid)) {
      return err(`id already exists: ${this.newGid}`);
    }

    // 1) 预检查：所有 id 存在 + 环冲突
    const preShapes: Shape[] = [];
    for (const id of this.ids) {
      const located = locateShape(doc, id);
      if (!located) {
        return err(`no such shape: ${id}`);
      }
      preShapes.push(located.shape);
    }
    for (const shape of preShapes) {
      if (!isContainer(shape)) continue;
      for (const other of preShapes) {
        if (other === shape) continue;
        if (subtreeContains(shape, other.getId())) {
          return err(
            `cannot group a container into its own descendant: ${shape.getId()}`,
          );
        }
      }
    }

    // 2) 首次 execute 创建实例
    if (this.group === null) {
      this.group = new Group(this.newGid);
    }

    // 3) 逐个"定位→记录→摘除"（避免同 parent 内多次摘除导致 index 错乱）
    this.snapshots = [];
    for (const id of this.ids) {
      const located = locateShape(doc, id);
      if (!located) {
        // 理论上不会发生（预检查已做）；防御性处理
        return err(`internal: shape ${id} disappeared during group`);
      }
      this.snapshots.push({
        shape: located.shape,
        parent: located.parent,
        index: located.index,
      });
      located.parent.removeAt(located.index);
      this.group.add(located.shape);
    }

    // 4) 新 group 挂到 root
    doc.ids.reserve(this.newGid);
    doc.root.add(this.group);

    return ok(`g#${this.newGid} created with ${this.snapshots.length} children`);
  }

  undo(ctx: EditorContext): CommandResult {
    if (!ctx.document || !this.group) {
      return err("internal: group command has no state to undo");
    }
    const doc = ctx.document;

    // 逆序恢复：后收编的先还原，避免后续 snapshot 的 index 因前序插入而错位
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      const s = this.snapshots[i];
      const idx = this.group.indexOf(s.shape);
      if (idx < 0) {
        return err(`internal: shape ${s.shape.getId()} not in group during undo`);
      }
      this.group.removeAt(idx);
      s.parent.insertAt(s.index, s.shape);
    }
    const gIdx = doc.root.indexOf(this.group);
    if (gIdx >= 0) doc.root.removeAt(gIdx);
    doc.ids.release(this.newGid);

    return ok(`g#${this.newGid} creation undone`);
  }
}