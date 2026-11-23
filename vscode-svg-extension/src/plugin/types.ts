export interface ShapeDescriptor {
  kind: string;
  attrs: Record<string, string | number>;
}

export interface ShapeProvider {
  readonly kind: string;
  createShape(attrs: Record<string, string | number>): ShapeDescriptor;
  validateAttr?(name: string, value: string | number): boolean;
}

export interface CommandContext {
  shapes: ShapeDescriptor[];
  output: string[];
  registry: PluginRegistry;
}

export interface CliCommand {
  readonly name: string;
  readonly summary: string;
  execute(args: string[], ctx: CommandContext): string;
}

export interface TreeNode {
  id: string;
  kind: string;
  label: string;
  attrs?: Record<string, string | number>;
  children?: TreeNode[];
}

export interface TreeDecorator {
  readonly name: string;
  decorate(node: TreeNode, ctx: CommandContext): TreeNode;
}

export interface AttributeHandler {
  readonly name: string;
  supports(kind: string, attrName: string): boolean;
  parse(rawValue: string): string | number;
  apply(shape: ShapeDescriptor, attrName: string, value: string | number): void;
}

export interface CliPlugin {
  readonly name: string;
  register(registry: PluginRegistry): void;
}

export interface PluginRegistry {
  registerShapeProvider(provider: ShapeProvider): void;
  getShapeProvider(kind: string): ShapeProvider | undefined;
  listShapeProviders(): ShapeProvider[];

  registerCommand(command: CliCommand): void;
  getCommand(name: string): CliCommand | undefined;
  listCommands(): CliCommand[];

  registerTreeDecorator(decorator: TreeDecorator): void;
  listTreeDecorators(): TreeDecorator[];

  registerAttributeHandler(handler: AttributeHandler): void;
  listAttributeHandlers(): AttributeHandler[];
}