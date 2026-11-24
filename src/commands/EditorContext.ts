import { Document } from "../core/Document";
import { ShapeFactory } from "../core/ShapeFactory";
import { SvgReader } from "../io/SvgReader";
import { SvgWriter } from "../io/SvgWriter";
import { CommandHistory } from "./CommandHistory";
import { AttributeHandler } from "./AttributeHandler";
import { TreeDecorator } from "../cli/TreeDecorator";
import { Shape } from "../core/Shape";
import { isContainer } from "../core/Container";

/**
 * 命令层与 CLI 层共享的"环境"：
 * - document：当前文档，未 init/read 时为 null；命令层通过 withDocument 访问
 * - factory / reader / writer：图形工厂与 IO（命令层从这里取）
 * - history：撤销重做栈
 *
 * 生命周期：
 * - CLI 启动时 new 一个，贯穿整个会话
 * - init/read 会替换 ctx.document 并调用 ctx.history.reset()
 * - save 会调用 ctx.history.disable()
 *
 * 依赖方向：commands 层内部，无 cli 依赖。
 */
export class EditorContext {
  document: Document | null;
  readonly factory: ShapeFactory;
  readonly reader: SvgReader;
  readonly writer: SvgWriter;
  readonly history: CommandHistory;
  readonly attributeHandlers: AttributeHandler[] = [];
  readonly treeDecorators: TreeDecorator[] = [];

  private savedFingerprints = new Map<string, string>();

  markSaved(): void {
    this.savedFingerprints.clear();
    if (!this.document) return;
    const visit = (shape: Shape): string => {
      const children = isContainer(shape) ? shape.getChildren().map(visit) : [];
      const fingerprint = JSON.stringify({ tag: shape.getTagName(), attrs: shape.getAttributes(), text: shape.getTextContent(), children });
      this.savedFingerprints.set(shape.getId(), fingerprint);
      return fingerprint;
    };
    for (const child of this.document.root.getChildren()) visit(child);
  }

  isShapeDirty(shape: Shape): boolean {
    const visit = (current: Shape): string => {
      const children = isContainer(current) ? current.getChildren().map(visit) : [];
      return JSON.stringify({ tag: current.getTagName(), attrs: current.getAttributes(), text: current.getTextContent(), children });
    };
    const baseline = this.savedFingerprints.get(shape.getId());
    return baseline === undefined || baseline !== visit(shape);
  }

  constructor(factory: ShapeFactory = new ShapeFactory()) {
    this.document = null;
    this.factory = factory;
    this.reader = new SvgReader(this.factory);
    this.writer = new SvgWriter();
    this.history = new CommandHistory();
  }
}