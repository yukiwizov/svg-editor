import {
  AttributeHandler,
  CliCommand,
  CliPlugin,
  PluginRegistry,
  ShapeProvider,
  TreeDecorator,
} from "./types";

const starShapeProvider: ShapeProvider = {
  kind: "star",
  createShape(attrs) {
    return {
      kind: "star",
      attrs: { points: 5, ...attrs },
    };
  },
  validateAttr(name, value) {
    if (name === "points") {
      return typeof value === "number" && value >= 3;
    }
    return true;
  },
};

const countCommand: CliCommand = {
  name: "count",
  summary: "Count total shapes",
  execute(_args, ctx) {
    return `Total shapes: ${ctx.shapes.length}`;
  },
};

const idBadgeDecorator: TreeDecorator = {
  name: "id-badge-decorator",
  decorate(node) {
    if (node.attrs && node.attrs.id !== undefined) {
      return { ...node, label: `${node.label} [id=${node.attrs.id}]` };
    }
    return node;
  },
};

const opacityAttributeHandler: AttributeHandler = {
  name: "opacity-handler",
  supports(_kind, attrName) {
    return attrName === "opacity";
  },
  parse(rawValue) {
    const num = Number(rawValue);
    if (Number.isNaN(num) || num < 0 || num > 1) {
      throw new Error(`Invalid opacity: ${rawValue}`);
    }
    return num;
  },
  apply(shape, attrName, value) {
    shape.attrs[attrName] = value;
  },
};

export const sampleExtensionsPlugin: CliPlugin = {
  name: "sample-extensions",
  register(registry: PluginRegistry) {
    registry.registerShapeProvider(starShapeProvider);
    registry.registerCommand(countCommand);
    registry.registerTreeDecorator(idBadgeDecorator);
    registry.registerAttributeHandler(opacityAttributeHandler);
  },
};