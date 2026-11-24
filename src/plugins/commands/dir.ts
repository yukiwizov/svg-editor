import { PluginManifest } from "../PluginHost";
import { DirCommand } from "../../cli/DirCommand";

const plugin: PluginManifest = {
  name: "dir",
  contributes: { commands: ["dir"] },
  activate(context) {
    context.commands.register("dir", args => args.length
      ? { error: "usage: dir" }
      : { command: new DirCommand() });
  },
};
export default plugin;
