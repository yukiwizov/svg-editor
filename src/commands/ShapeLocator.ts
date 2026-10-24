import { Document } from "../core/Document";
import { Shape } from "../core/Shape";
import { Container, isContainer } from "../core/Container";

export interface LocatedShape {
  shape: Shape;
  parent: Container;
  index: number;
}

/**
 * 在文档树中按 id 定位图形，返回 { shape, parent, index }。
 * 找不到返回 null。
 *
 * 用途：所有需要"根据 id 找图形"的命令（create 的 in 子句、delete、
 * move、scale、set、group、addto、front、back 等）都通过此工具。
 */
export function locateShape(doc: Document, id: string): LocatedShape | null {
  return walk(doc.root, id);
}

function walk(container: Container, id: string): LocatedShape | null {
  const children = container.getChildren();
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.getId() === id) {
      return { shape: child, parent: container, index: i };
    }
    if (isContainer(child)) {
      const found = walk(child, id);
      if (found) return found;
    }
  }
  return null;
}