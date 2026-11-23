import { CliPlugin, PluginRegistry } from "./types";

export interface LoadResult {
  loaded: string[];
  failed: Array<{ plugin: string; error: string }>;
}

export class PluginLoader {
  constructor(private readonly registry: PluginRegistry) {}

  loadAll(plugins: CliPlugin[]): LoadResult {
    const loaded: string[] = [];
    const failed: Array<{ plugin: string; error: string }> = [];

    for (const plugin of plugins) {
      try {
        plugin.register(this.registry);
        loaded.push(plugin.name);
      } catch (err) {
        failed.push({
          plugin: plugin.name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { loaded, failed };
  }
}