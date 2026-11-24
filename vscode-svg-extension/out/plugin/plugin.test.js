"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const PluginRegistry_1 = require("./PluginRegistry");
const PluginLoader_1 = require("./PluginLoader");
const builtinPlugin_1 = require("./builtinPlugin");
const sampleExtensionsPlugin_1 = require("./sampleExtensionsPlugin");
function createTestEnv() {
    const registry = new PluginRegistry_1.DefaultPluginRegistry();
    const loader = new PluginLoader_1.PluginLoader(registry);
    const result = loader.loadAll([builtinPlugin_1.builtinPlugin, sampleExtensionsPlugin_1.sampleExtensionsPlugin]);
    const ctx = {
        shapes: [],
        output: [],
        registry,
    };
    const run = (cmdLine) => {
        const [name, ...args] = cmdLine.trim().split(/\s+/);
        const cmd = registry.getCommand(name);
        strict_1.default.ok(cmd, `Command not found: ${name}`);
        return cmd.execute(args, ctx);
    };
    return { registry, loader, result, ctx, run };
}
(0, node_test_1.default)("builtin plugin keeps six shapes and core commands", () => {
    const registry = new PluginRegistry_1.DefaultPluginRegistry();
    new PluginLoader_1.PluginLoader(registry).loadAll([builtinPlugin_1.builtinPlugin]);
    const kinds = registry.listShapeProviders().map((p) => p.kind);
    strict_1.default.deepEqual(kinds, ["rect", "circle", "line", "ellipse", "polygon", "text"]);
    strict_1.default.ok(registry.getCommand("add"));
    strict_1.default.ok(registry.getCommand("set"));
    strict_1.default.ok(registry.getCommand("tree"));
});
(0, node_test_1.default)("four extension points work end-to-end", () => {
    const { run, ctx } = createTestEnv();
    strict_1.default.equal(run("add star id=s1 points=6"), "Added star");
    strict_1.default.equal(ctx.shapes[0].kind, "star");
    strict_1.default.equal(run("set 0 opacity 0.5"), "Updated opacity");
    strict_1.default.equal(ctx.shapes[0].attrs.opacity, 0.5);
    strict_1.default.equal(run("count"), "Total shapes: 1");
    const treeOut = run("tree");
    strict_1.default.match(treeOut, /star#s1 \[id=s1\]/);
});
//# sourceMappingURL=plugin.test.js.map