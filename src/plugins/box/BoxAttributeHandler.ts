import { AttributeHandler } from "../../commands/AttributeHandler";
import { Shape, SetResult } from "../../core/Shape";
import { BoxShape } from "./BoxShape";

export class BoxAttributeHandler implements AttributeHandler {
  readonly name = "box-attributes";
  handles(shape: Shape, attribute: string): boolean {
    return shape instanceof BoxShape && (attribute === "fill" || attribute === "label");
  }
  capture(shape: Shape, attribute: string): unknown {
    if (!(shape instanceof BoxShape)) throw new Error("box handler received a non-box shape");
    return attribute === "fill" ? shape.rect.getAttribute("fill") : shape.label.content;
  }
  restore(shape: Shape, attribute: string, snapshot: unknown): void {
    if (!(shape instanceof BoxShape)) throw new Error("box handler received a non-box shape");
    if (attribute === "fill") {
      if (snapshot === null) shape.rect.removeAttribute("fill");
      else shape.rect.setAttribute("fill", String(snapshot));
    } else if (attribute === "label") shape.label.setAttribute("text", String(snapshot ?? ""));
  }
  apply(shape: Shape, attribute: string, value: string): SetResult {
    if (!(shape instanceof BoxShape)) return "unknown";
    if (attribute === "fill") return shape.rect.setAttribute("fill", value);
    if (attribute === "label") return shape.label.setAttribute("text", value);
    return "unknown";
  }
}
