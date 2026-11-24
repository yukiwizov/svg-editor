import { TreeDecorator } from "../../cli/TreeDecorator";
import { PluginManifest } from "../PluginHost";
import { BoxShape } from "../box/BoxShape";
const decorator: TreeDecorator = {
  name: "box",
  decorate(shape) { return shape instanceof BoxShape ? "(box)" : undefined; },
};
const plugin: PluginManifest = {
  name: "box-tree",
  contributes: { decorators: ["box"] },
  activate(context) { context.registerDecorator(decorator); },
};
export default plugin;
