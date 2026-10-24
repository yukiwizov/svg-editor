import { Command } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { Document } from "../core/Document";
import { parseNumber } from "../core/Shape";

/**
 * init [w] [h] —— 新建空画布（默认 800×600），作为当前文档。
 * 成功后 history.reset()（Document 被替换，旧历史失效）。
 */
export class InitCommand implements Command {
  readonly name = "init";
  readonly category = "document" as const;

  constructor(
    private readonly widthArg: string | null,
    private readonly heightArg: string | null,
  ) {}

  execute(ctx: EditorContext): CommandResult {
    let width = 800;
    let height = 600;
    if (this.widthArg !== null) {
      const w = parseNumber(this.widthArg);
      if (w === null) return err(`invalid value for canvas width: ${this.widthArg}`);
      width = w;
    }
    if (this.heightArg !== null) {
      const h = parseNumber(this.heightArg);
      if (h === null) return err(`invalid value for canvas height: ${this.heightArg}`);
      height = h;
    }
    if (width <= 0 || height <= 0) {
      return err("canvas size must be positive");
    }
    ctx.document = new Document(width, height);
    ctx.history.reset();
    return ok(`canvas ${width}x${height} created`);
  }
}