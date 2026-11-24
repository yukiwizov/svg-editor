import { describe, it, expect } from "vitest";
import { Document } from "../core/Document";
import { CreateCommand } from "../commands/CreateCommand";
import { SetCommand } from "../commands/SetCommand";
import { createEditorContext } from "../__test-utils__/testContext";
import { TreeDecorator } from "../core/TreeDecorator";
import { Renderer } from "./Renderer";
import { Rect } from "../core/Rect";

describe("modified-star decorator semantics", () => {
  it("compares against saved state and clears after undo returns to the baseline", () => {
    const ctx = createEditorContext();
    ctx.document = new Document(100, 100);
    ctx.markSaved();
    const star: TreeDecorator = { name: "modified-star", decorate: (_shape, dirty) => dirty ? "*" : undefined };
    ctx.treeDecorators.push(star);
    new CreateCommand("create", "rect", "r1", ["0","0","10","10"], null).execute(ctx);
    const rect = ctx.document.root.getChildren()[0] as Rect;
    expect(ctx.isShapeDirty(rect)).toBe(true);
    expect(ctx.isShapeDirty(ctx.document.root)).toBe(true);
    ctx.markSaved();
    expect(ctx.isShapeDirty(rect)).toBe(false);
    expect(ctx.isShapeDirty(ctx.document.root)).toBe(false);
    const set = new SetCommand("set", "r1", "fill", "red");
    set.execute(ctx);
    expect(ctx.isShapeDirty(rect)).toBe(true);
    expect(ctx.isShapeDirty(ctx.document.root)).toBe(true);
    set.undo(ctx);
    expect(ctx.isShapeDirty(rect)).toBe(false);
    expect(ctx.isShapeDirty(ctx.document.root)).toBe(false);
    const lines = new Renderer(ctx.treeDecorators, shape => ctx.isShapeDirty(shape)).renderTree(ctx.document);
    expect(lines.join("\n")).not.toContain("*");
  });
});
