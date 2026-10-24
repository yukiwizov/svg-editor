import * as fs from "node:fs";
import { Command } from "./Command";
import { CommandResult, err } from "./CommandResult";
import { EditorContext } from "./EditorContext";

/**
 * read <file.svg> —— 读入 SVG 文件为当前文档。
 * 成功后 history.reset()。
 * warning 行由本命令加 "warning: " 前缀（Reader 保持纯净）。
 */
export class ReadCommand implements Command {
  readonly name = "read";
  readonly category = "document" as const;

  constructor(private readonly filePath: string) {}

  execute(ctx: EditorContext): CommandResult {
    let xml: string;
    try {
      xml = fs.readFileSync(this.filePath, "utf-8");
    } catch {
      return err(`cannot read file: ${this.filePath}`);
    }

    let result: ReturnType<typeof ctx.reader.read>;
    try {
      result = ctx.reader.read(xml);
    } catch {
      return err(`cannot read file: ${this.filePath}`);
    }

    const { document, warnings } = result;
    document.sourcePath = this.filePath;
    ctx.document = document;
    ctx.history.reset();

    const lines = [
      ...warnings.map((w) => `warning: ${w}`),
      `read ${this.filePath} (${document.countElements()} elements)`,
    ];
    return { lines };
  }
}