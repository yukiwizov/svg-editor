"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultPluginRegistry = void 0;
class DefaultPluginRegistry {
    shapeProviders = new Map();
    commands = new Map();
    treeDecorators = [];
    attributeHandlers = [];
    registerShapeProvider(provider) {
        if (this.shapeProviders.has(provider.kind)) {
            throw new Error(`Duplicate ShapeProvider kind: ${provider.kind}`);
        }
        this.shapeProviders.set(provider.kind, provider);
    }
    getShapeProvider(kind) {
        return this.shapeProviders.get(kind);
    }
    listShapeProviders() {
        return Array.from(this.shapeProviders.values());
    }
    registerCommand(command) {
        if (this.commands.has(command.name)) {
            throw new Error(`Duplicate CliCommand name: ${command.name}`);
        }
        this.commands.set(command.name, command);
    }
    getCommand(name) {
        return this.commands.get(name);
    }
    listCommands() {
        return Array.from(this.commands.values());
    }
    registerTreeDecorator(decorator) {
        this.treeDecorators.push(decorator);
    }
    listTreeDecorators() {
        return [...this.treeDecorators];
    }
    registerAttributeHandler(handler) {
        this.attributeHandlers.push(handler);
    }
    listAttributeHandlers() {
        return [...this.attributeHandlers];
    }
}
exports.DefaultPluginRegistry = DefaultPluginRegistry;
//# sourceMappingURL=PluginRegistry.js.map