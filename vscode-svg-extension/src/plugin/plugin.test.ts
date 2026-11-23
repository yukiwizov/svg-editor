import test from "node:test";
import assert from "node:assert/strict";
import { DefaultPluginRegistry } from "./PluginRegistry";
import { PluginLoader } from "./PluginLoader";
import { builtinPlugin } from "./builtinPlugin";
import { sampleExtensionsPlugin } from "./sampleExtensionsPlugin";
import { CommandContext } from "./types";

function createTestEnv() {
  const registry = new DefaultPluginRegistry();
  const loader = new PluginLoader(registry);
  const result = loader.loadAll([builtinPlugin, sampleExtensionsPlugin]);
  const ctx: CommandContext = {
    shapes: [],
    output: [],
    registry,
  };
  const run = (cmdLine: string) => {
    const [name, ...args] = cmdLine.trim().split(/\s+/);
    const cmd = registry.getCommand(name);
    assert.ok(cmd, `Command not found: ${name}`);
    return cmd.execute(args, ctx);
  };
  return { registry, loader, result, ctx, run };
}

test("builtin plugin keeps six shapes and core commands", () => {
  const registry = new DefaultPluginRegistry();
  new PluginLoader(registry).loadAll([builtinPlugin]);
  const kinds = registry.listShapeProviders().map((p) => p.kind);
  assert.deepEqual(kinds, ["rect", "circle", "line", "ellipse", "polygon", "text"]);
  assert.ok(registry.getCommand("add"));
  assert.ok(registry.getCommand("set"));
  assert.ok(registry.getCommand("tree"));
});

test("four extension points work end-to-end", () => {
  const { run, ctx } = createTestEnv();
  assert.equal(run("add star id=s1 points=6"), "Added star");
  assert.equal(ctx.shapes[0].kind, "star");
  assert.equal(run("set 0 opacity 0.5"), "Updated opacity");
  assert.equal(ctx.shapes[0].attrs.opacity, 0.5);
  assert.equal(run("count"), "Total shapes: 1");
  const treeOut = run("tree");
  assert.match(treeOut, /star#s1 \[id=s1\]/);
});