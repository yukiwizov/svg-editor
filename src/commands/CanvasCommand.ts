import { Command } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";
import { parseNumber } from "../core/Shape";

/**
 * canvas [w] [h]
 *  - 无参数：显示画布尺寸，不改变历史状态
 *  - 有参数：修改尺寸 + history.disable()（撤销屏障）
 */
export class CanvasCommand implements Command {
  readonly name = "canvas";
  readonly category = "document" as const;

  constructor(
    private readonly widthArg: string | null,
    private readonly heightArg: string | null,
  ) {}

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }

    const noArgs = this.widthArg === null && this.heightArg === null;
    if (noArgs) {
      return ok(`canvas ${ctx.document.width}x${ctx.document.height}`);
    }

    let width = ctx.document.width;
    let height = ctx.document.height;
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

    ctx.document.setSize(width, height);
    ctx.history.disable();
    return ok(`canvas ${width}x${height}`);
  }
}