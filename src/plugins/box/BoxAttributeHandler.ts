import { AttributeHandler } from "../../commands/AttributeHandler";
import { Shape, SetResult } from "../../core/Shape";
import { BoxShape } from "./BoxShape";

export class BoxAttributeHandler implements AttributeHandler {
  readonly name = "box-attributes";
  handles(shape: Shape, attribute: string): boolean {
    return shape instanceof BoxShape && (attribute === "fill" || attribute === "label");
  }
  apply(shape: Shape, attribute: string, value: string): SetResult {
    if (!(shape instanceof BoxShape)) return "unknown";
    if (attribute === "fill") return shape.rect.setAttribute("fill", value);
    if (attribute === "label") return shape.label.setAttribute("text", value);
    return "unknown";
  }
}
