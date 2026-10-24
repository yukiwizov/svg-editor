import { Shape } from "./Shape";

/**
 * 容器接口。Group 实现它；未来 box 插件等复合类型也可实现它。
 * 依赖方向：core 内部，无外部依赖。
 */
export interface Container {
  /** 子节点的有序视图（z-order 从底到顶）。调用方不得修改返回数组。 */
  getChildren(): readonly Shape[];

  /** 追加到末尾（最前/最顶层）。不检查"是否已在别处"——由命令层保证。 */
  add(child: Shape): void;

  /** 插入到 index 位置；用于 undo 恢复原 z-order。 */
  insertAt(index: number, child: Shape): void;

  /** 移除并返回 index 位置的子节点；越界返回 undefined。 */
  removeAt(index: number): Shape | undefined;

  /** 返回子节点在 children 中的索引；不在返回 -1。 */
  indexOf(child: Shape): number;
}