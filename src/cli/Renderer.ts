import { Document } from "../core/Document";
import { Shape } from "../core/Shape";
import { isContainer } from "../core/Container";
import { locateShape } from "../commands/ShapeLocator";
import { parentLabel } from "../commands/util";
import { TreeDecorator } from "../core/TreeDecorator";
const TREE_ATTR_COLUMN = 19;
export class Renderer {
  constructor(private readonly decorators: readonly TreeDecorator[] = [], private readonly isDirty: (shape: Shape) => boolean = () => false) {}
  renderTree(doc: Document): string[] {
    const lines: string[] = [`svg (${doc.width}x${doc.height})`];
    const children = doc.root.getChildren();
    for (let i = 0; i < children.length; i++) this.appendNode(children[i], "", i === children.length - 1, lines);
    return lines;
  }
  renderSubtree(doc: Document, id: string): string[] | null {
    const located = locateShape(doc, id);
    if (!located) return null;
    const lines: string[] = [this.nodeLine("", located.shape)];
    if (isContainer(located.shape)) {
      const children = located.shape.getChildren();
      for (let i = 0; i < children.length; i++) this.appendNode(children[i], "", i === children.length - 1, lines);
    }
    return lines;
  }
  renderShow(doc: Document, id: string): string[] | null {
    const located = locateShape(doc, id);
    if (!located) return null;
    return [`${located.shape.getTagName()}#${located.shape.getId()}  parent=${parentLabel(located.parent, doc)}`, ...located.shape.describeForShow().map(line => `  ${line}`)];
  }
  private appendNode(shape: Shape, parentPrefix: string, isLast: boolean, lines: string[]): void {
    const connector = isLast ? "└── " : "├── ";
    lines.push(this.nodeLine(parentPrefix + connector, shape));
    if (isContainer(shape)) {
      const children = shape.getChildren();
      const nextPrefix = parentPrefix + (isLast ? "    " : "│   ");
      for (let i = 0; i < children.length; i++) this.appendNode(children[i], nextPrefix, i === children.length - 1, lines);
    }
  }
  private nodeLine(prefix: string, shape: Shape): string {
    const head = `${prefix}${shape.getTagName()}#${shape.getId()}`;
    const attrs = [shape.describeForTree(), ...this.decorators.map(d => d.decorate(shape, this.isDirty(shape))).filter((v): v is string => !!v)].filter(Boolean).join(" ");
    if (!attrs) return head;
    return head + " ".repeat(Math.max(2, TREE_ATTR_COLUMN - head.length)) + attrs;
  }
}
