import { Document } from "../core/Document";
import { ShapeFactory } from "../core/ShapeFactory";
import { SvgReader } from "../io/SvgReader";
import { SvgWriter } from "../io/SvgWriter";
import { CommandHistory } from "./CommandHistory";

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

  constructor() {
    this.document = null;
    this.factory = new ShapeFactory();
    this.reader = new SvgReader(this.factory);
    this.writer = new SvgWriter();
    this.history = new CommandHistory();
  }
}