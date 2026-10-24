import { Shape } from "./Shape";

/**
 * 容器接口。Group 实现它；未来 box 插件等复合类型也可实现它。
 * 依赖方向：core 内部，无外部依赖。
 *
 * 契约补充（P1-C8 完善）：
 *   - 本阶段所有容器必然是 Shape 子类（每个图形元素都有唯一 id）
 *   - 因此容器接口显式暴露 getId / getTagName，
 *     使上层无需 "as Shape" 就能按 id / 标签名识别容器
 */
export interface Container {
  /** 容器自身的 id（唯一）。 */
  getId(): string;

  /** 容器自身的 SVG 标签名（g / 未来插件类型）。 */
  getTagName(): string;

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

/**
 * 容器识别：duck typing（存在 getChildren 方法即为容器）。
 * 不用 instanceof Group —— 未来 box 等插件类型只要实现 Container 接口即可。
 */
export function isContainer(shape: Shape): shape is Shape & Container {
  return typeof (shape as Partial<Container>).getChildren === "function";
}