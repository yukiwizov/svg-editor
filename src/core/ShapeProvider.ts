import { Shape } from "./Shape";

/** Kernel-owned shape extension contract. */
export interface ShapeProvider {
  readonly name: string;
  create(id: string, params: string[]): Shape | { error: string };
  createFromDom?(id: string, attributes: Record<string, string>, textContent: string | null, children?: Shape[]): Shape;
}
