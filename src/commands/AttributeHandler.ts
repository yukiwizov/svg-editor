import { Shape, SetResult } from "../core/Shape";

/** Attribute handlers are consulted before Shape.setAttribute. */
export interface AttributeHandler {
  readonly name: string;
  handles(shape: Shape, attribute: string): boolean;
  apply(shape: Shape, attribute: string, value: string): SetResult;
}
