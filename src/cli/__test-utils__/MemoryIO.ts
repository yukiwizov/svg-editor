import { ReplIO } from "../Repl";

/**
 * 测试用的 ReplIO 实现：预置输入行，收集输出行。
 * 不依赖 process.stdin/stdout，跨平台、可重复、完全可控。
 */
export class MemoryIO implements ReplIO {
  writes: string[] = [];

  constructor(private readonly lines: string[]) {}

  write(line: string): void {
    this.writes.push(line);
  }

  async *read(): AsyncIterable<string> {
    for (const line of this.lines) {
      yield line;
    }
  }
}