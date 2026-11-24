"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginLoader = void 0;
class PluginLoader {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    loadAll(plugins) {
        const loaded = [];
        const failed = [];
        for (const plugin of plugins) {
            try {
                plugin.register(this.registry);
                loaded.push(plugin.name);
            }
            catch (err) {
                failed.push({
                    plugin: plugin.name,
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }
        return { loaded, failed };
    }
}
exports.PluginLoader = PluginLoader;
//# sourceMappingURL=PluginLoader.js.map