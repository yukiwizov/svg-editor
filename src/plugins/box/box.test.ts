import { describe, it, expect } from "vitest";
import { Document } from "../../core/Document";
import { CreateCommand } from "../../commands/CreateCommand";
import { SetCommand } from "../../commands/SetCommand";
import { EditorContext } from "../../commands/EditorContext";
import { ShapeFactory } from "../../core/ShapeFactory";
import { boxShapeProvider, boxAttributeHandler } from "./index";
import { BoxShape } from "./BoxShape";
import { locateShape } from "../../commands/ShapeLocator";

function setup(): EditorContext {
  const factory = new ShapeFactory();
  factory.registerProvider(boxShapeProvider);
  const ctx = new EditorContext(factory);
  ctx.attributeHandlers.push(boxAttributeHandler);
  ctx.document = new Document(200, 100);
  return ctx;
}

describe("box composite plugin", () => {
  it("creates required children and reserves their ids as part of the composite", () => {
    const ctx = setup();
    const result = new CreateCommand("create", "box", "b1", ["10","20","80","40","blue","Hello"], null).execute(ctx);
    expect(result.error).toBeUndefined();
    const box = locateShape(ctx.document!, "b1")!.shape as BoxShape;
    expect(box.getChildren().map(child => child.getId())).toEqual(["b1-rect", "b1-label"]);
    expect(ctx.document!.ids.has("b1-rect")).toBe(true);
    expect(ctx.document!.ids.has("b1-label")).toBe(true);
  });

  it("routes fill and label through the handler and restores both on undo", () => {
    const ctx = setup();
    new CreateCommand("create", "box", "b1", ["0","0","40","20","blue","before"], null).execute(ctx);
    const fill = new SetCommand("set", "b1", "fill", "red");
    expect(fill.execute(ctx).error).toBeUndefined();
    expect((locateShape(ctx.document!, "b1")!.shape as BoxShape).rect.getAttribute("fill")).toBe("red");
    fill.undo(ctx);
    expect((locateShape(ctx.document!, "b1")!.shape as BoxShape).rect.getAttribute("fill")).toBe("blue");

    const label = new SetCommand("set", "b1", "label", "after");
    expect(label.execute(ctx).error).toBeUndefined();
    expect((locateShape(ctx.document!, "b1")!.shape as BoxShape).label.content).toBe("after");
    label.undo(ctx);
    expect((locateShape(ctx.document!, "b1")!.shape as BoxShape).label.content).toBe("before");
  });

  it("cannot ungroup the composite", () => {
    const ctx = setup();
    new CreateCommand("create", "box", "b1", ["0","0","40","20"], null).execute(ctx);
    expect((locateShape(ctx.document!, "b1")!.shape).isUngroupable()).toBe(false);
  });
});
