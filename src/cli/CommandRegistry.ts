import { Command } from "../commands/Command";

/**
 * Builder 的返回值：要么是构造成功的命令，要么是"参数个数/格式错误"。
 * 让"构造"这一步也能失败，Dispatcher 用统一方式处理。
 */
export type BuildResult =
  | { command: Command }
  | { error: string };

export type CommandBuilder = (args: string[]) => BuildResult;

/**
 * 命令名 → builder 的注册表。
 *
 * 这是架构方案里"按名分派②"的唯一允许位置（另一个是 core/ShapeFactory），
 * 已在架构方案中标注为待插件化重构点：未来替换为 CommandProvider 插槽。
 *
 * 本类只负责"注册与查找"，不含任何命令构造逻辑；
 * 内置命令的注册在 builtin-commands.ts 中完成。
 */
export class CommandRegistry {
  private builders = new Map<string, CommandBuilder>();

  register(name: string, builder: CommandBuilder): void {
    this.builders.set(name, builder);
  }

  has(name: string): boolean {
    return this.builders.has(name);
  }

  /** 找不到返回 null；builder 报错返回 { error }；成功返回 { command }。 */
  build(name: string, args: string[]): BuildResult | null {
    const builder = this.builders.get(name);
    if (!builder) return null;
    return builder(args);
  }

  /** 已注册的全部命令名（顺序不稳定，需要稳定序由调用方 sort）。 */
  names(): string[] {
    return Array.from(this.builders.keys());
  }
}