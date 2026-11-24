import { Shape, SetResult } from "../core/Shape";

/**
 * Atomic extension contract for custom attributes.
 * capture/restore provide a memento so SetCommand can roll back a handler that throws.
 */
export interface AttributeHandler {
  readonly name: string;
  handles(shape: Shape, attribute: string): boolean;
  capture(shape: Shape, attribute: string): unknown;
  apply(shape: Shape, attribute: string, value: string): SetResult;
  restore(shape: Shape, attribute: string, snapshot: unknown): void;
}
