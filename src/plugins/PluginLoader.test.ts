import { afterEach, describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { PluginHost } from "./PluginHost";
import { loadConfiguredPlugins } from "./PluginLoader";
import { ShapeFactory } from "../core/ShapeFactory";
import { CommandRegistry } from "../cli/CommandRegistry";

const tempDirs: string[] = [];
function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "svg-plugin-loader-"));
  tempDirs.push(dir);
  const config = path.join(dir, "plugins.config.json");
  const host = new PluginHost(new ShapeFactory(), new CommandRegistry(), [], []);
  const messages: string[] = [];
  const write = (name: string, source: string) => fs.writeFileSync(path.join(dir, name), source);
  const load = (plugins: unknown) => {
    fs.writeFileSync(config, JSON.stringify({ plugins }));
    loadConfiguredPlugins(host, config, message => messages.push(message));
  };
  return { dir, config, host, messages, write, load };
}
afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe("configured plugin loader errors", () => {
  it("reports missing modules separately", () => {
    const env = setup();
    env.load([{ module: "./missing-plugin", enabled: true }]);
    expect(env.messages).toEqual(["error: plugin not found: ./missing-plugin"]);
  });

  it("reports a module without a default export", () => {
    const env = setup();
    env.write("no-default.js", "module.exports = { named: true };");
    env.load([{ module: "./no-default.js" }]);
    expect(env.messages).toEqual(["error: plugin has no default export: ./no-default.js"]);
  });

  it("reports module evaluation and dependency errors as activation failures", () => {
    const env = setup();
    env.write("bad-dependency.js", 'require("./missing-dependency");');
    env.load([{ module: "./bad-dependency.js" }]);
    expect(env.messages[0]).toContain("error: plugin failed to activate: ./bad-dependency.js");
    expect(env.messages[0]).toContain("missing-dependency");
  });

  it("reports invalid configuration", () => {
    const env = setup();
    env.load([{ module: "" }]);
    expect(env.messages).toEqual(["error: invalid plugin config"]);
  });

  it("rolls back a plugin that throws during activation", () => {
    const env = setup();
    env.write("explode.js", 'module.exports = { default: { name: "explode", contributes: {}, activate() { throw new Error("boom"); } } };');
    env.load([{ module: "./explode.js" }]);
    expect(env.messages).toEqual(["error: plugin failed to activate: explode (boom)"]);
    expect(env.host.shapes.names()).toEqual([]);
    expect(env.host.commands.names()).toEqual([]);
  });
});
