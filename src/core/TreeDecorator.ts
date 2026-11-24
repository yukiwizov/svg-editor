import { Shape } from "./Shape";

/** Kernel extension point for optional end-of-line tree annotations. */
export interface TreeDecorator {
  readonly name: string;
  decorate(shape: Shape, dirty: boolean): string | undefined;
}
