import {
  AttributeHandler,
  CliCommand,
  CliPlugin,
  CommandContext,
  PluginRegistry,
  ShapeDescriptor,
  ShapeProvider,
  TreeNode,
} from "./types";

const BUILTIN_SIX_SHAPES = ["rect", "circle", "line", "ellipse", "polygon", "text"] as const;

function createBuiltinShapeProvider(kind: string): ShapeProvider {
  return {
    kind,
    createShape(attrs) {
      return { kind, attrs: { ...attrs } };
    },
    validateAttr(_name, value) {
      return value !== undefined && value !== null;
    },
  };
}

const defaultAttrHandler: AttributeHandler = {
  name: "default-attr-handler",
  supports() {
    return true;
  },
  parse(rawValue) {
    const num = Number(rawValue);
    return Number.isNaN(num) || rawValue.trim() === "" ? rawValue : num;
  },
  apply(shape, attrName, value) {
    shape.attrs[attrName] = value;
  },
};

function renderTree(nodes: TreeNode[], ctx: CommandContext, depth = 0): string[] {
  const lines: string[] = [];
  const decorators = ctx.registry.listTreeDecorators();

  for (const rawNode of nodes) {
    let decorated: TreeNode = {
      ...rawNode,
      attrs: rawNode.attrs ? { ...rawNode.attrs } : undefined,
    };
    for (const dec of decorators) {
      decorated = dec.decorate(decorated, ctx);
    }
    const indent = "  ".repeat(depth);
    lines.push(`${indent}- ${decorated.label}`);
    if (decorated.children && decorated.children.length > 0) {
      lines.push(...renderTree(decorated.children, ctx, depth + 1));
    }
  }
  return lines;
}

const addCommand: CliCommand = {
  name: "add",
  summary: "Add a shape: add <kind> [k=v ...]",
  execute(args, ctx) {
    const [kind, ...rest] = args;
    const provider = ctx.registry.getShapeProvider(kind);
    if (!provider) {
      return `Unknown shape kind: ${kind}`;
    }
    const attrs: Record<string, string | number> = {};
    for (const pair of rest) {
      const idx = pair.indexOf("=");
      if (idx > 0) {
        const k = pair.slice(0, idx);
        const v = pair.slice(idx + 1);
        const handler =
          ctx.registry.listAttributeHandlers().find((h) => h.supports(kind, k)) ??
          defaultAttrHandler;
        attrs[k] = handler.parse(v);
      }
    }
    const shape = provider.createShape(attrs);
    ctx.shapes.push(shape);
    return `Added ${kind}`;
  },
};

const setCommand: CliCommand = {
  name: "set",
  summary: "Set shape attribute: set <index> <attr> <value>",
  execute(args, ctx) {
    const [idxStr, attrName, rawValue] = args;
    const index = Number(idxStr);
    const shape: ShapeDescriptor | undefined = ctx.shapes[index];
    if (!shape) {
      return `Shape not found at index: ${idxStr}`;
    }
    const handler =
      ctx.registry.listAttributeHandlers().find((h) => h.supports(shape.kind, attrName)) ??
      defaultAttrHandler;
    const parsed = handler.parse(rawValue ?? "");
    const provider = ctx.registry.getShapeProvider(shape.kind);
    if (provider?.validateAttr && !provider.validateAttr(attrName, parsed)) {
      return `Invalid value for ${attrName}`;
    }
    handler.apply(shape, attrName, parsed);
    return `Updated ${attrName}`;
  },
};

const treeCommand: CliCommand = {
  name: "tree",
  summary: "Render shape tree",
  execute(_args, ctx) {
    const nodes: TreeNode[] = ctx.shapes.map((s, i) => ({
      id: String(s.attrs.id ?? i),
      kind: s.kind,
      label: s.attrs.id ? `${s.kind}#${s.attrs.id}` : `${s.kind}[${i}]`,
      attrs: s.attrs,
    }));
    return renderTree(nodes, ctx).join("\n");
  },
};

const helpCommand: CliCommand = {
  name: "help",
  summary: "List registered commands",
  execute(_args, ctx) {
    return ctx.registry
      .listCommands()
      .map((c) => `${c.name}: ${c.summary}`)
      .join("\n");
  },
};

export const builtinPlugin: CliPlugin = {
  name: "builtin-core",
  register(registry: PluginRegistry) {
    for (const kind of BUILTIN_SIX_SHAPES) {
      registry.registerShapeProvider(createBuiltinShapeProvider(kind));
    }
    registry.registerAttributeHandler(defaultAttrHandler);
    registry.registerCommand(addCommand);
    registry.registerCommand(setCommand);
    registry.registerCommand(treeCommand);
    registry.registerCommand(helpCommand);
  },
};