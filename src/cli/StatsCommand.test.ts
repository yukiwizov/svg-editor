import { describe, it, expect } from "vitest";
import { StatsCommand } from "./StatsCommand";
import { EditorContext } from "../commands/EditorContext";
import { Document } from "../core/Document";
import { Group } from "../core/Group";
import { Rect } from "../core/Rect";
import { Circle } from "../core/Circle";

describe("stats command", () => {
  it("reports the empty document without counting the root svg", () => {
    const ctx = new EditorContext();
    ctx.document = new Document(100, 100);
    expect(new StatsCommand().execute(ctx).lines).toEqual(["(total 0, containers 0)"]);
  });

  it("counts leaf types in DFS first-seen order and containers separately", () => {
    const ctx = new EditorContext();
    ctx.document = new Document(100, 100);
    const group = new Group("g1");
    group.add(new Rect("r1", 0, 0, 1, 1));
    group.add(new Circle("c1", 0, 0, 1));
    group.add(new Rect("r2", 1, 1, 2, 2));
    ctx.document.root.add(group);
    ctx.document.root.add(new Circle("c2", 2, 2, 2));
    expect(new StatsCommand().execute(ctx).lines).toEqual([
      "rect: 2", "circle: 2", "total: 4", "containers: 1",
    ]);
  });
});
