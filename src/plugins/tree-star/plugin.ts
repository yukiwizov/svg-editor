import { TreeDecorator } from "../../cli/TreeDecorator";
import { PluginManifest } from "../PluginHost";
const decorator: TreeDecorator = {
  name: "modified-star",
  decorate: () => undefined,
};
const plugin: PluginManifest = {
  name: "tree-star",
  contributes: { decorators: ["modified-star"] },
  activate(context) { context.registerDecorator(decorator); },
};
export default plugin;
