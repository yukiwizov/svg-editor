import { ShapeFactory } from "../core/ShapeFactory";
import { ShapeProvider } from "../core/ShapeProvider";
import { CommandRegistry, CommandBuilder } from "../cli/CommandRegistry";
import { AttributeHandler } from "../commands/AttributeHandler";
import { TreeDecorator } from "../cli/TreeDecorator";

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
export class PluginHost implements PluginContext {
  readonly attributes: AttributeHandler[] = [];
  readonly decorators: TreeDecorator[] = [];
  constructor(readonly shapes: ShapeFactory, readonly commands: CommandRegistry) {}
  registerShape(provider: ShapeProvider): void { this.shapes.registerProvider(provider); }
  registerCommand(name: string, builder: CommandBuilder): void { this.commands.register(name, builder); }
  registerAttribute(handler: AttributeHandler): void {
    if (this.attributes.some(x => x.name === handler.name)) throw new Error(`duplicate registration: attribute/${handler.name}`);
    this.attributes.push(handler);
  }
  registerDecorator(decorator: TreeDecorator): void {
    if (this.decorators.some(x => x.name === decorator.name)) throw new Error(`duplicate registration: decorator/${decorator.name}`);
    this.decorators.push(decorator);
  }
}
