import { Shape } from "../core/Shape";
import { Container, isContainer } from "../core/Container";
import { Document } from "../core/Document";

/**
 * 把"父容器"渲染成给用户看的短标签。
 * 顶层父容器（doc.root）显示为 "svg"。
 */
export function parentLabel(parent: Container, doc: Document): string {
  if (parent === doc.root) return "svg";
  return `${parent.getTagName()}#${parent.getId()}`;
}

/**
 * 检查 targetId 是否在 root 的子树里（含 root 自身）。
 * 用于 Group 的"容器在子孙里"冲突检测、AddTo 的防环检测。
 */
export function subtreeContains(root: Shape, targetId: string): boolean {
  if (root.getId() === targetId) return true;
  if (isContainer(root)) {
    for (const child of root.getChildren()) {
      if (subtreeContains(child, targetId)) return true;
    }
  }
  return false;
}