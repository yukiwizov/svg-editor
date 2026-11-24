import { PluginManifest } from "../../PluginHost";
import { StatsCommand } from "../../../cli/StatsCommand";
const plugin: PluginManifest = {
  name: "stats",
  contributes: { commands: ["stats"] },
  activate(context) {
    context.commands.register("stats", args => args.length
      ? { error: "usage: stats" }
      : { command: new StatsCommand() });
  },
};
export default plugin;
