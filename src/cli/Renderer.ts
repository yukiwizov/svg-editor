import { Document } from "../core/Document";
import { Shape } from "../core/Shape";
import { Container, isContainer } from "../core/Container";
import { locateShape } from "../commands/ShapeLocator";
import { parentLabel } from "../commands/util";

/**
 * 树形/明细输出格式化。
 * 与 commands 层解耦：只依赖 Document（core）与 commands 的两个查找工具。
 */

/** 属性对齐到这一列（0-indexed）。超过则退化为至少 2 空格。 */
const TREE_ATTR_COLUMN = 19;

export class Renderer {
  /**
   * 全文档树。第一行 svg (w×h)，其余是子节点。
   */
  renderTree(doc: Document): string[] {
    const lines: string[] = [`svg (${doc.width}x${doc.height})`];
    const children = doc.root.getChildren();
    for (let i = 0; i < children.length; i++) {
      this.appendNode(children[i], "", i === children.length - 1, lines);
    }
    return lines;
  }

  /**
   * 以 id 为根的子树。找不到返回 null（命令层据此报错）。
   */
  renderSubtree(doc: Document, id: string): string[] | null {
    const located = locateShape(doc, id);
    if (!located) return null;
    const shape = located.shape;
    const lines: string[] = [this.nodeLine("", shape)];
    if (isContainer(shape)) {
      const children = shape.getChildren();
      for (let i = 0; i < children.length; i++) {
        this.appendNode(children[i], "", i === children.length - 1, lines);
      }
    }
    return lines;
  }

  /**
   * 单个图形的属性明细。找不到返回 null。
   * 格式：
   *   tag#id  parent=<parentLabel>
   *     <geom line>
   *     <presentation line>
   */
  renderShow(doc: Document, id: string): string[] | null {
    const located = locateShape(doc, id);
    if (!located) return null;
    const shape = located.shape;
    const parent = parentLabel(located.parent, doc);
    const lines: string[] = [`${shape.getTagName()}#${shape.getId()}  parent=${parent}`];
    for (const line of shape.describeForShow()) {
      lines.push(`  ${line}`);
    }
    return lines;
  }

  // ---- private ----

  private appendNode(
    shape: Shape,
    parentPrefix: string,
    isLast: boolean,
    lines: string[],
  ): void {
    const connector = isLast ? "└── " : "├── ";
    lines.push(this.nodeLine(parentPrefix + connector, shape));
    if (isContainer(shape)) {
      const children = shape.getChildren();
      const nextPrefix = parentPrefix + (isLast ? "    " : "│   ");
      for (let i = 0; i < children.length; i++) {
        this.appendNode(children[i], nextPrefix, i === children.length - 1, lines);
      }
    }
  }

  private nodeLine(prefix: string, shape: Shape): string {
    const head = `${prefix}${shape.getTagName()}#${shape.getId()}`;
    const attrs = shape.describeForTree();
    if (!attrs) return head;
    const pad = Math.max(2, TREE_ATTR_COLUMN - head.length);
    return head + " ".repeat(pad) + attrs;
  }
}