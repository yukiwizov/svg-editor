/**
 * id 唯一性注册表。Document 持有一个实例，所有图形元素（含容器）的 id 都在这里登记。
 * 空字符串、root 等特殊情况由调用方（命令层）控制，本类不特殊处理。
 */
export class IdRegistry {
  private taken = new Set<string>();

  has(id: string): boolean {
    return this.taken.has(id);
  }

  /** 尝试占用；已在被占用则返回 false，不抛异常。 */
  reserve(id: string): boolean {
    if (this.taken.has(id)) return false;
    this.taken.add(id);
    return true;
  }

  /** 释放；不存在时静默成功。 */
  release(id: string): void {
    this.taken.delete(id);
  }

  clear(): void {
    this.taken.clear();
  }

  /** 只读快照，测试/调试用。 */
  snapshot(): readonly string[] {
    return Array.from(this.taken);
  }
}