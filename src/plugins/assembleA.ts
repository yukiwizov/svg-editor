import { PluginHost } from "./PluginHost";
import box from "./box/plugin";
import star from "./tree-star/plugin";
import boxTree from "./box-tree/plugin";
import stats from "./commands/stats";
import dir from "./commands/dir";

/** Code-composition assembly. Registration order intentionally matches plugins.config.json. */
export function activateAssemblyA(host: PluginHost): void {
  for (const plugin of [box, star, boxTree, stats, dir]) host.activate(plugin);
}
