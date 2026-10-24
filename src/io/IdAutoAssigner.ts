/**
 * id 自动分配器。负责维护"已占用 id 集合"，并按 <tag><n> 规则产出新 id。
 *
 * 用法：调用方（SvgReader）先用 collectIds 把文档中所有已有的 id 传入构造函数，
 * 之后每读到一个元素：
 *   - 有 id 且未占用:  reserve(id)  保留原 id
 *   - 无 id:            generate(tag)  分配并按 warning 提示
 *   - 有 id 但已占用:   generate(tag)  分配并 warning（重复 id 视为未命名）
 */
export class IdAutoAssigner {
  private used: Set<string>;

  constructor(existingIds: Iterable<string> = []) {
    this.used = new Set(existingIds);
  }

  has(id: string): boolean {
    return this.used.has(id);
  }

  /** 强制占用一个 id；调用方保证不会与已有冲突。 */
  reserve(id: string): void {
    this.used.add(id);
  }

  /** 按 <tag><n> 从 1 开始找最小未占用 id，占用并返回。 */
  generate(tagName: string): string {
    let n = 1;
    while (this.used.has(`${tagName}${n}`)) {
      n++;
    }
    const id = `${tagName}${n}`;
    this.used.add(id);
    return id;
  }
}