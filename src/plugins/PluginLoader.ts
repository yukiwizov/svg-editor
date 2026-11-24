import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";
import { PluginHost, PluginManifest } from "./PluginHost";

/** Loads B-mode plugins. All paths and packages are resolved relative to the config file. */
export function loadConfiguredPlugins(
  host: PluginHost,
  configPath = path.resolve(process.cwd(), "plugins.config.json"),
  report: (message: string) => void = message => console.error(message),
): void {
  if (!fs.existsSync(configPath)) return;
  let config: unknown;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    report("error: invalid plugin config");
    return;
  }
  if (!config || typeof config !== "object" || !Array.isArray((config as { plugins?: unknown }).plugins)) {
    report("error: invalid plugin config");
    return;
  }

  const requireFromConfig = createRequire(configPath);
  for (const entry of (config as { plugins: unknown[] }).plugins) {
    if (!entry || typeof entry !== "object") {
      report("error: invalid plugin config");
      continue;
    }
    const item = entry as { module?: unknown; enabled?: unknown; options?: unknown };
    if (typeof item.module !== "string" || !item.module.trim() ||
        (item.enabled !== undefined && typeof item.enabled !== "boolean") ||
        (item.options !== undefined && (!item.options || typeof item.options !== "object" || Array.isArray(item.options)))) {
      report("error: invalid plugin config");
      continue;
    }
    if (item.enabled === false) continue;

    const moduleId = item.module.startsWith(".")
      ? path.resolve(path.dirname(configPath), item.module)
      : item.module;
    let resolvedModule: string;
    try {
      resolvedModule = requireFromConfig.resolve(moduleId);
    } catch {
      report(`error: plugin not found: ${item.module}`);
      continue;
    }

    let loaded: unknown;
    try {
      loaded = requireFromConfig(resolvedModule);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      report(`error: plugin failed to activate: ${item.module} (${reason})`);
      continue;
    }
    const plugin = (loaded as { default?: PluginManifest } | null)?.default;
    if (!plugin) {
      report(`error: plugin has no default export: ${item.module}`);
      continue;
    }

    try {
      const packageContributes = findPackageContributions(resolvedModule);
      host.activate(plugin, (item.options ?? {}) as Record<string, unknown>, packageContributes ?? plugin.contributes);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (reason.startsWith("manifest mismatch:")) report(`error: plugin ${reason}`);
      else if (reason.startsWith("duplicate registration:")) report(`error: ${reason}`);
      else report(`error: plugin failed to activate: ${plugin.name} (${reason})`);
    }
  }
}

function findPackageContributions(modulePath: string): PluginManifest["contributes"] | undefined {
  let directory = path.dirname(modulePath);
  while (true) {
    const manifestPath = path.join(directory, "package.json");
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { contributes?: PluginManifest["contributes"] };
        if (manifest.contributes !== undefined) return manifest.contributes;
      } catch {
        throw new Error(`invalid package manifest: ${manifestPath}`);
      }
    }
    const parent = path.dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}
