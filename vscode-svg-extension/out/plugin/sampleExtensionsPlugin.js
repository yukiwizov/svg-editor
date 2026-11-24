"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleExtensionsPlugin = void 0;
const starShapeProvider = {
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
const countCommand = {
    name: "count",
    summary: "Count total shapes",
    execute(_args, ctx) {
        return `Total shapes: ${ctx.shapes.length}`;
    },
};
const idBadgeDecorator = {
    name: "id-badge-decorator",
    decorate(node) {
        if (node.attrs && node.attrs.id !== undefined) {
            return { ...node, label: `${node.label} [id=${node.attrs.id}]` };
        }
        return node;
    },
};
const opacityAttributeHandler = {
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
exports.sampleExtensionsPlugin = {
    name: "sample-extensions",
    register(registry) {
        registry.registerShapeProvider(starShapeProvider);
        registry.registerCommand(countCommand);
        registry.registerTreeDecorator(idBadgeDecorator);
        registry.registerAttributeHandler(opacityAttributeHandler);
    },
};
//# sourceMappingURL=sampleExtensionsPlugin.js.map