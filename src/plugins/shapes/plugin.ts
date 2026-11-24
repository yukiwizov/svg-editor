import { PluginManifest } from "../PluginHost";
import { builtinShapeProviders } from "./builtin-providers";
const plugin: PluginManifest = {
  name: "builtin-shapes",
  contributes: { shapes: ["rect", "circle", "ellipse", "line", "text", "g"] },
  activate(context) { for (const provider of builtinShapeProviders) context.shapes.registerProvider(provider); },
};
export default plugin;
