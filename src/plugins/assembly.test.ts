import { describe, it, expect } from "vitest";
import { ShapeFactory } from "../core/ShapeFactory";
import { EditorContext } from "../commands/EditorContext";
import { CommandRegistry } from "../cli/CommandRegistry";
import { registerBuiltinCommands } from "../cli/builtin-commands";
import { CommandDispatcher } from "../cli/CommandDispatcher";
import { PluginHost, PluginManifest } from "./PluginHost";
import builtinShapes from "./shapes/plugin";
import { activateAssemblyA } from "./assembleA";
import box from "./box/plugin";
import star from "./tree-star/plugin";
import boxTree from "./box-tree/plugin";
import stats from "./commands/stats";
import dir from "./commands/dir";

function assemble(assembly: "A" | "B") {
  const factory = new ShapeFactory();
  const registry = new CommandRegistry();
  registerBuiltinCommands(registry);
  const ctx = new EditorContext(factory);
  const host = new PluginHost(factory, registry, ctx.attributeHandlers, ctx.treeDecorators);
  host.activate(builtinShapes);
  const bPlugins: PluginManifest[] = [box, star, boxTree, stats, dir];
  if (assembly === "A") activateAssemblyA(host);
  else for (const plugin of bPlugins) host.activate(plugin);
  return { ctx, host, registry, dispatcher: new CommandDispatcher(registry) };
}

function transcript(assembly: "A" | "B"): string[] {
  const runtime = assemble(assembly);
  const output: string[] = [];
  for (const command of [
    "init 120 80",
    'create box b1 5 6 40 20 blue "hello"',
    "set b1 label updated",
    "tree",
    "stats",
    "dir",
  ]) {
    const result = runtime.dispatcher.dispatch(command, runtime.ctx);
    output.push(...(result.error ? [`error: ${result.error}`] : result.lines));
  }
  return output;
}

describe("plugin assembly parity", () => {
  it("registers the same contributions and produces byte-identical sessions", () => {
    const a = assemble("A");
    const b = assemble("B");
    expect(a.host.shapes.names().sort()).toEqual(b.host.shapes.names().sort());
    expect(a.registry.names().sort()).toEqual(b.registry.names().sort());
    expect(a.host.attributes.map(x => x.name).sort()).toEqual(b.host.attributes.map(x => x.name).sort());
    expect(a.host.decorators.map(x => x.name).sort()).toEqual(b.host.decorators.map(x => x.name).sort());
    expect(transcript("A")).toEqual(transcript("B"));
  });
});
