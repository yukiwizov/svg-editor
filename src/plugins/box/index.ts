import { ShapeProvider } from "../../core/ShapeProvider";
import { AttributeHandler } from "../../commands/AttributeHandler";
import { BoxShape } from "./BoxShape";
import { BoxAttributeHandler } from "./BoxAttributeHandler";

export const boxShapeProvider: ShapeProvider = {
  name: "box",
  create(id, params) {
    if (params.length < 4 || params.length > 6) return { error: "box expects 4 to 6 params: <x> <y> <w> <h> [fill] [label]" };
    const values = params.slice(0, 4).map(Number);
    if (values.some(value => !Number.isFinite(value))) return { error: "invalid numeric parameter for box" };
    return new BoxShape(id, values[0], values[1], values[2], values[3], params[4] ?? "none", params[5] ?? "");
  },
  createFromDom(id, attrs, _text, children) {
    const x = Number(attrs.x ?? 0), y = Number(attrs.y ?? 0);
    const width = Number(attrs.width ?? 0), height = Number(attrs.height ?? 0);
    if (![x, y, width, height].every(Number.isFinite)) throw new Error("invalid box geometry");
    if (!children || children.length !== 2 || !(children[0] instanceof Rect) || !(children[1] instanceof TextShape)) {
      throw new Error("box SVG must contain exactly rect#<id>-rect followed by text#<id>-label");
    }
    return new BoxShape(id, x, y, width, height, attrs.fill ?? "none", "", children[0], children[1]);
  },
};
export const boxAttributeHandler: AttributeHandler = new BoxAttributeHandler();
