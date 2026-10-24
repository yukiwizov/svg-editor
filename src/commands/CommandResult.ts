/**
 * 命令执行结果。
 * - error 为空：成功，lines 是反馈（0 到多行）。
 * - error 非空：失败，lines 无意义，命令不得对状态做任何修改。
 *
 * error 内容不带 "error: " 前缀；前缀由 CLI 打印时统一加。
 */
export interface CommandResult {
  lines: string[];
  error?: string;
}

export function ok(...lines: string[]): CommandResult {
  return { lines };
}

export function err(message: string): CommandResult {
  return { lines: [], error: message };
}

export function isErr(r: CommandResult): boolean {
  return r.error !== undefined;
}