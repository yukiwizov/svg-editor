import {
  AttributeHandler,
  CliCommand,
  PluginRegistry,
  ShapeProvider,
  TreeDecorator,
} from "./types";

export class DefaultPluginRegistry implements PluginRegistry {
  private readonly shapeProviders = new Map<string, ShapeProvider>();
  private readonly commands = new Map<string, CliCommand>();
  private readonly treeDecorators: TreeDecorator[] = [];
  private readonly attributeHandlers: AttributeHandler[] = [];

  registerShapeProvider(provider: ShapeProvider): void {
    if (this.shapeProviders.has(provider.kind)) {
      throw new Error(`Duplicate ShapeProvider kind: ${provider.kind}`);
    }
    this.shapeProviders.set(provider.kind, provider);
  }

  getShapeProvider(kind: string): ShapeProvider | undefined {
    return this.shapeProviders.get(kind);
  }

  listShapeProviders(): ShapeProvider[] {
    return Array.from(this.shapeProviders.values());
  }

  registerCommand(command: CliCommand): void {
    if (this.commands.has(command.name)) {
      throw new Error(`Duplicate CliCommand name: ${command.name}`);
    }
    this.commands.set(command.name, command);
  }

  getCommand(name: string): CliCommand | undefined {
    return this.commands.get(name);
  }

  listCommands(): CliCommand[] {
    return Array.from(this.commands.values());
  }

  registerTreeDecorator(decorator: TreeDecorator): void {
    this.treeDecorators.push(decorator);
  }

  listTreeDecorators(): TreeDecorator[] {
    return [...this.treeDecorators];
  }

  registerAttributeHandler(handler: AttributeHandler): void {
    this.attributeHandlers.push(handler);
  }

  listAttributeHandlers(): AttributeHandler[] {
    return [...this.attributeHandlers];
  }
}