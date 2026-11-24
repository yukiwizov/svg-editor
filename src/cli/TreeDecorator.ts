import { Shape } from "../core/Shape";

/** Optional end-of-line tree text. Return undefined to leave the row unchanged. */
export interface TreeDecorator {
  readonly name: string;
  decorate(shape: Shape, dirty: boolean): string | undefined;
}
