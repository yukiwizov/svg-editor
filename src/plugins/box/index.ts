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
};
export const boxAttributeHandler: AttributeHandler = new BoxAttributeHandler();
