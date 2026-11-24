import { describe, it, expect } from "vitest";
import { Document } from "../../core/Document";
import { CreateCommand } from "../../commands/CreateCommand";
import { SetCommand } from "../../commands/SetCommand";
import { EditorContext } from "../../commands/EditorContext";
import { ShapeFactory } from "../../core/ShapeFactory";
import { boxShapeProvider, boxAttributeHandler } from "./index";
import { BoxShape } from "./BoxShape";
import { locateShape } from "../../commands/ShapeLocator";
import { SvgReader } from "../../io/SvgReader";
import { SvgWriter } from "../../io/SvgWriter";
import { AttributeHandler } from "../../commands/AttributeHandler";
import { createDefaultFactory } from "../../__test-utils__/testContext";

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
    fill.execute(ctx);
    expect((locateShape(ctx.document!, "b1")!.shape as BoxShape).rect.getAttribute("fill")).toBe("red");
    fill.undo(ctx);

    const label = new SetCommand("set", "b1", "label", "after");
    expect(label.execute(ctx).error).toBeUndefined();
    expect((locateShape(ctx.document!, "b1")!.shape as BoxShape).label.content).toBe("after");
    label.undo(ctx);
    expect((locateShape(ctx.document!, "b1")!.shape as BoxShape).label.content).toBe("before");
    label.execute(ctx);
    expect((locateShape(ctx.document!, "b1")!.shape as BoxShape).label.content).toBe("after");
  });

  it("rolls back a handler that mutates and then throws", () => {
    const ctx = setup();
    new CreateCommand("create", "box", "b1", ["0","0","40","20","blue","before"], null).execute(ctx);
    const failing: AttributeHandler = {
      name: "failing-box-fill",
      handles: (shape, attribute) => shape instanceof BoxShape && attribute === "fill",
      capture: shape => (shape as BoxShape).rect.getAttribute("fill"),
      apply: shape => { (shape as BoxShape).rect.setAttribute("fill", "partial"); throw new Error("synthetic failure"); },
      restore: (shape, _attribute, snapshot) => { (shape as BoxShape).rect.setAttribute("fill", String(snapshot)); },
    };
    ctx.attributeHandlers.unshift(failing);
    const result = new SetCommand("set", "b1", "fill", "red").execute(ctx);
    expect(result.error).toContain("attribute handler failed: synthetic failure");
    expect((locateShape(ctx.document!, "b1")!.shape as BoxShape).rect.getAttribute("fill")).toBe("blue");
  });

  it("round-trips box SVG and rejects missing structural children", () => {
    const factory = createDefaultFactory();
    factory.registerProvider(boxShapeProvider);
    const reader = new SvgReader(factory);
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80"><g id="b1" data-kind="box"><rect id="b1-rect" x="2" y="3" width="40" height="20" fill="green"/><text id="b1-label" x="10" y="18">caption</text></g></svg>`;
    const first = reader.read(xml).document;
    const box = first.root.getChildren()[0] as BoxShape;
    expect(box.label.content).toBe("caption");
    expect(box.rect.getAttribute("fill")).toBe("green");
    const serialized = new SvgWriter().serialize(first);
    const second = reader.read(serialized).document.root.getChildren()[0] as BoxShape;
    expect(second.label.content).toBe("caption");
    expect(second.rect.getAttribute("fill")).toBe("green");
    expect(() => reader.read(`<svg><g id="b1" data-kind="box"><rect id="b1-rect"/></g></svg>`)).toThrow(/exactly rect followed by text/);
    const fallback = new SvgReader(createDefaultFactory()).read(xml).document.root.getChildren()[0];
    expect(fallback.getTagName()).toBe("g");
    expect(fallback).not.toBeInstanceOf(BoxShape);
  });

  it("cannot ungroup the composite", () => {
    const ctx = setup();
    new CreateCommand("create", "box", "b1", ["0","0","40","20"], null).execute(ctx);
    expect((locateShape(ctx.document!, "b1")!.shape).isUngroupable()).toBe(false);
  });
});
