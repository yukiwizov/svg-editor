import { ShapeFactory } from "../core/ShapeFactory";
import { ShapeProvider } from "../core/ShapeProvider";
import { CommandRegistry, CommandBuilder } from "../cli/CommandRegistry";
import { AttributeHandler } from "../commands/AttributeHandler";
import { TreeDecorator } from "../core/TreeDecorator";

export interface PluginManifest {
  name: string;
  contributes?: { shapes?: string[]; commands?: string[]; decorators?: string[]; attributes?: string[] };
  activate(context: PluginContext, options?: Record<string, unknown>): void;
}
export interface PluginContext {
  shapes: { registerProvider(provider: ShapeProvider): void };
  commands: { register(name: string, builder: CommandBuilder): void };
  registerAttribute(handler: AttributeHandler): void;
  registerDecorator(decorator: TreeDecorator): void;
}
type ContributionKind = "shapes" | "commands" | "decorators" | "attributes";
type Contributions = Record<ContributionKind, string[]>;

export class PluginHost {
  constructor(
    readonly shapes: ShapeFactory,
    readonly commands: CommandRegistry,
    readonly attributes: AttributeHandler[],
    readonly decorators: TreeDecorator[],
  ) {}

  /** Stage every registration, validate the exact manifest delta, then commit atomically. */
  activate(plugin: PluginManifest, options: Record<string, unknown> = {}, declaredOverride?: PluginManifest["contributes"]): void {
    if (!plugin || typeof plugin.name !== "string" || !plugin.name.trim() || typeof plugin.activate !== "function") {
      throw new Error("invalid plugin manifest");
    }
    const declared = normalize(declaredOverride ?? plugin.contributes);
    const staged = {
      shapes: [] as ShapeProvider[],
      commands: [] as Array<{ name: string; builder: CommandBuilder }>,
      decorators: [] as TreeDecorator[],
      attributes: [] as AttributeHandler[],
    };

    const context: PluginContext = {
      shapes: {
        registerProvider: provider => {
          if (this.shapes.isRegistered(provider.name) || staged.shapes.some(item => item.name === provider.name)) {
            throw new Error(`duplicate registration: shape/${provider.name}`);
          }
          staged.shapes.push(provider);
        },
      },
      commands: {
        register: (name, builder) => {
          if (this.commands.has(name) || staged.commands.some(item => item.name === name)) {
            throw new Error(`duplicate registration: command/${name}`);
          }
          staged.commands.push({ name, builder });
        },
      },
      registerAttribute: handler => {
        if (this.attributes.some(item => item.name === handler.name) || staged.attributes.some(item => item.name === handler.name)) {
          throw new Error(`duplicate registration: attribute/${handler.name}`);
        }
        staged.attributes.push(handler);
      },
      registerDecorator: decorator => {
        if (this.decorators.some(item => item.name === decorator.name) || staged.decorators.some(item => item.name === decorator.name)) {
          throw new Error(`duplicate registration: decorator/${decorator.name}`);
        }
        staged.decorators.push(decorator);
      },
    };

    plugin.activate(context, options);
    const registered: Contributions = {
      shapes: staged.shapes.map(item => item.name).sort(),
      commands: staged.commands.map(item => item.name).sort(),
      decorators: staged.decorators.map(item => item.name).sort(),
      attributes: staged.attributes.map(item => item.name).sort(),
    };
    for (const kind of Object.keys(declared) as ContributionKind[]) declared[kind].sort();
    if ((Object.keys(declared) as ContributionKind[]).some(kind =>
      JSON.stringify(declared[kind]) !== JSON.stringify(registered[kind]))) {
      throw new Error(`manifest mismatch: ${plugin.name} (declared: ${format(declared)}, registered: ${format(registered)})`);
    }

    const committed: Contributions = { shapes: [], commands: [], decorators: [], attributes: [] };
    try {
      for (const provider of staged.shapes) {
        this.shapes.registerProvider(provider);
        committed.shapes.push(provider.name);
      }
      for (const command of staged.commands) {
        this.commands.register(command.name, command.builder);
        committed.commands.push(command.name);
      }
      for (const handler of staged.attributes) {
        this.attributes.push(handler);
        committed.attributes.push(handler.name);
      }
      for (const decorator of staged.decorators) {
        this.decorators.push(decorator);
        committed.decorators.push(decorator.name);
      }
    } catch (error) {
      for (const name of committed.shapes) this.shapes.unregister(name);
      for (const name of committed.commands) this.commands.unregister(name);
      for (const name of committed.attributes) removeNamed(this.attributes, name);
      for (const name of committed.decorators) removeNamed(this.decorators, name);
      throw error;
    }
  }
}

function normalize(input: PluginManifest["contributes"]): Contributions {
  if (input !== undefined && (input === null || typeof input !== "object" || Array.isArray(input))) {
    throw new Error("invalid plugin manifest");
  }
  const result: Contributions = {
    shapes: input?.shapes ?? [],
    commands: input?.commands ?? [],
    decorators: input?.decorators ?? [],
    attributes: input?.attributes ?? [],
  };
  for (const names of Object.values(result)) {
    if (!Array.isArray(names) || names.some(name => typeof name !== "string" || !name.trim()) || new Set(names).size !== names.length) {
      throw new Error("invalid plugin manifest");
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
