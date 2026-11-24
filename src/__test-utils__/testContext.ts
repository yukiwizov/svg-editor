import { EditorContext } from "../commands/EditorContext";
import { ShapeFactory } from "../core/ShapeFactory";
import { builtinShapeProviders } from "../plugins/shapes/builtin-providers";

export function createDefaultFactory(): ShapeFactory {
  const factory = new ShapeFactory();
  for (const provider of builtinShapeProviders) factory.registerProvider(provider);
  return factory;
}

export function createEditorContext(): EditorContext {
  return new EditorContext(createDefaultFactory());
}
