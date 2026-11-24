import { Shape } from "./Shape";
import { ShapeProvider } from "./ShapeProvider";

export type FactoryResult = Shape | { error: string };
type Creator = (id: string, params: string[]) => FactoryResult;
type DomCreator = (id: string, attrs: Record<string, string>, text: string | null, children?: Shape[]) => Shape;

/** Kernel registry: knows only ShapeProvider contracts, never concrete shape classes. */
export class ShapeFactory {
  private creators = new Map<string, Creator>();
  private domCreators = new Map<string, DomCreator>();

  registerProvider(provider: ShapeProvider): void {
    if (this.isRegistered(provider.name)) throw new Error(`duplicate registration: shape/${provider.name}`);
    this.creators.set(provider.name, (id, params) => provider.create(id, params));
    this.domCreators.set(provider.name, (id, attrs, text, children) => {
      if (!provider.createFromDom) throw new Error(`shape provider ${provider.name} cannot import SVG`);
      return provider.createFromDom(id, attrs, text, children);
    });
  }
  unregister(name: string): void { this.creators.delete(name); this.domCreators.delete(name); }
  names(): string[] { return Array.from(this.creators.keys()); }
  isRegistered(name: string): boolean { return this.creators.has(name); }
  create(type: string, id: string, params: string[]): FactoryResult {
    const creator = this.creators.get(type);
    return creator ? creator(id, params) : { error: `unknown shape type: ${type} (is the plugin loaded?)` };
  }
  createFromDom(tagName: string, id: string, attrs: Record<string, string>, text: string | null, children?: Shape[]): Shape | undefined {
    const creator = this.domCreators.get(tagName);
    return creator?.(id, attrs, text, children);
  }
}
