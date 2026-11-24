import { ShapeFactory } from "../core/ShapeFactory";
import { CommandRegistry, CommandBuilder } from "../cli/CommandRegistry";
import { AttributeHandler } from "../commands/AttributeHandler";
import { TreeDecorator } from "../core/TreeDecorator";

export interface PluginManifest {
  name: string;
  contributes?: { shapes?: string[]; commands?: string[]; decorators?: string[]; attributes?: string[] };
  activate(context: PluginContext, options?: Record<string, unknown>): void;
}
export interface PluginContext {
  shapes: ShapeFactory;
  commands: CommandRegistry;
  registerAttribute(handler: AttributeHandler): void;
  registerDecorator(decorator: TreeDecorator): void;
}
type ContributionKind = "shapes" | "commands" | "decorators" | "attributes";
type Contributions = Record<ContributionKind, string[]>;

export class PluginHost implements PluginContext {
  constructor(
    readonly shapes: ShapeFactory,
    readonly commands: CommandRegistry,
    readonly attributes: AttributeHandler[],
    readonly decorators: TreeDecorator[],
  ) {}

  registerAttribute(handler: AttributeHandler): void {
    if (this.attributes.some(x => x.name === handler.name)) throw new Error(`duplicate registration: attribute/${handler.name}`);
    this.attributes.push(handler);
  }

  registerDecorator(decorator: TreeDecorator): void {
    if (this.decorators.some(x => x.name === decorator.name)) throw new Error(`duplicate registration: decorator/${decorator.name}`);
    this.decorators.push(decorator);
  }

  activate(plugin: PluginManifest, options: Record<string, unknown> = {}): void {
    const before: Contributions = {
      shapes: this.shapes.names(),
      commands: this.commands.names(),
      decorators: this.decorators.map(x => x.name),
      attributes: this.attributes.map(x => x.name),
    };
    try {
      plugin.activate(this, options);
      const after: Contributions = {
        shapes: this.shapes.names(),
        commands: this.commands.names(),
        decorators: this.decorators.map(x => x.name),
        attributes: this.attributes.map(x => x.name),
      };
      const declared = normalize(plugin.contributes);
      const registered = {} as Contributions;
      for (const kind of Object.keys(before) as ContributionKind[]) {
        registered[kind] = after[kind].filter(name => !before[kind].includes(name)).sort();
        declared[kind].sort();
      }
      if ((Object.keys(before) as ContributionKind[]).some(kind =>
        JSON.stringify(declared[kind]) !== JSON.stringify(registered[kind]))) {
        throw new Error(`manifest mismatch: ${plugin.name} (declared: ${format(declared)}, registered: ${format(registered)})`);
      }
    } catch (error) {
      const after: Contributions = {
        shapes: this.shapes.names(),
        commands: this.commands.names(),
        decorators: this.decorators.map(x => x.name),
        attributes: this.attributes.map(x => x.name),
      };
      for (const kind of Object.keys(before) as ContributionKind[]) {
        for (const name of after[kind]) {
          if (before[kind].includes(name)) continue;
          if (kind === "shapes") this.shapes.unregister(name);
          if (kind === "commands") this.commands.unregister(name);
          if (kind === "decorators") removeNamed(this.decorators, name);
          if (kind === "attributes") removeNamed(this.attributes, name);
        }
      }
      throw error;
    }
  }
}

function normalize(input: PluginManifest["contributes"]): Contributions {
  const result: Contributions = {
    shapes: input?.shapes ?? [],
    commands: input?.commands ?? [],
    decorators: input?.decorators ?? [],
    attributes: input?.attributes ?? [],
  };
  for (const names of Object.values(result)) {
    if (!Array.isArray(names) || names.some(name => typeof name !== "string" || !name) || new Set(names).size !== names.length) {
      throw new Error("invalid contribution manifest");
    }
  }
  return result;
}
function format(value: Contributions): string {
  return (Object.keys(value) as ContributionKind[]).map(key => `${key}=[${value[key].join(",")}]`).join("; ");
}
function removeNamed<T extends {name: string}>(items: T[], name: string): void {
  const index = items.findIndex(item => item.name === name);
  if (index >= 0) items.splice(index, 1);
}
