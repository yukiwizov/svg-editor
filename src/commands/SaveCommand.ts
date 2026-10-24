import * as fs from "node:fs";
import { Command } from "./Command";
import { CommandResult, err, ok } from "./CommandResult";
import { EditorContext } from "./EditorContext";

/**
 * save [file.svg] —— 保存当前文档；无参数时保存到读入时的路径。
 * 成功后 history.disable()（撤销屏障，不改变编辑历史内容）。
 * 同时更新 document.sourcePath，让下一次无参 save 能写回同一个文件。
 */
export class SaveCommand implements Command {
  readonly name = "save";
  readonly category = "document" as const;

  constructor(private readonly filePath: string | null) {}

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) {
      return err("no document. use 'init' or 'read' first");
    }
    const target = this.filePath ?? ctx.document.sourcePath;
    if (!target) {
      return err("no file path: save requires a filename or prior read");
    }
    try {
      const xml = ctx.writer.serialize(ctx.document);
      fs.writeFileSync(target, xml, "utf-8");
    } catch {
      return err(`cannot write file: ${target}`);
    }
    ctx.document.sourcePath = target;
    ctx.history.disable();
    return ok(`saved to ${target} (${ctx.document.countElements()} elements)`);
  }
}