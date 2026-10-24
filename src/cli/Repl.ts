import { CommandDispatcher } from "./CommandDispatcher";
import { EditorContext } from "../commands/EditorContext";

/**
 * REPL 的 IO 抽象：读一行、写一行。
 * 真实运行时用 readline；测试时用内存 mock。
 */
export interface ReplIO {
  /** 输出一行（自动加换行）。 */
  write(line: string): void;
  /** 逐行读入；异步迭代器自然结束时 REPL 退出。 */
  read(): AsyncIterable<string>;
}

/**
 * CLI 交互主循环。
 *
 * 行为：
 *  - 启动时输出 banner + 空行
 *  - 逐行读入 → 交 CommandDispatcher
 *  - 成功：逐行输出 result.lines；失败：加 "error: " 前缀
 *  - exit / quit（trim 后精确匹配）退出；# exit 不触发
 *  - 输入流 EOF 也退出
 *  - 退出时不打印任何消息
 */
export class Repl {
  constructor(
    private readonly io: ReplIO,
    private readonly dispatcher: CommandDispatcher,
    private readonly ctx: EditorContext,
  ) {}

  async run(): Promise<void> {
    this.io.write("svg-editor 0.1 — type 'help' for commands");
    this.io.write("");

    for await (const line of this.io.read()) {
      const trimmed = line.trim();
      if (trimmed === "exit" || trimmed === "quit") {
        break;
      }
      const result = this.dispatcher.dispatch(line, this.ctx);
      if (result.error !== undefined) {
        this.io.write(`error: ${result.error}`);
      } else {
        for (const l of result.lines) {
          this.io.write(l);
        }
      }
    }
  }
}