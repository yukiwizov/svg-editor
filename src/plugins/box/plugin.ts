import { PluginManifest } from "../PluginHost";
import { boxShapeProvider, boxAttributeHandler } from "./index";

const plugin: PluginManifest = {
  name: "box",
  contributes: { shapes: ["box"], attributes: ["box-attributes"] },
  activate(context) {
    context.shapes.registerProvider(boxShapeProvider);
    context.registerAttribute(boxAttributeHandler);
  },
};
export default plugin;
