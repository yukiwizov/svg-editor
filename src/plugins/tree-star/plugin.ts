import { TreeDecorator } from "../../core/TreeDecorator";
import { PluginManifest } from "../PluginHost";
const decorator: TreeDecorator = {
  name: "modified-star",
  decorate(_shape, dirty) { return dirty ? "*" : undefined; },
};
const plugin: PluginManifest = {
  name: "tree-star",
  contributes: { decorators: ["modified-star"] },
  activate(context) { context.registerDecorator(decorator); },
};
export default plugin;
