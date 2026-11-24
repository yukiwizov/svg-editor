import { Command } from "../commands/Command";
import { CommandResult, err } from "../commands/CommandResult";
import { EditorContext } from "../commands/EditorContext";
import { Shape } from "../core/Shape";
import { isContainer } from "../core/Container";

/** Read-only DFS statistics; leaf type order follows first encounter in document order. */
export class StatsCommand implements Command {
  readonly name = "stats";
  readonly category = "display" as const;

  execute(ctx: EditorContext): CommandResult {
    if (!ctx.document) return err("no document. use 'init' or 'read' first");
    const counts = new Map<string, number>();
    let total = 0;
    let containers = 0;

    const visit = (shape: Shape): void => {
      if (isContainer(shape) && (shape.getTagName() === "g" || shape.getTagName() === "box")) {
        containers++;
        for (const child of shape.getChildren()) visit(child);
        return;
      }
      const type = shape.getTagName();
      counts.set(type, (counts.get(type) ?? 0) + 1);
      total++;
    };

    for (const child of ctx.document.root.getChildren()) visit(child);
    if (total === 0 && containers === 0) return { lines: ["(total 0, containers 0)"] };
    return { lines: [
      ...Array.from(counts, ([type, count]) => `${type}: ${count}`),
      `total: ${total}`,
      `containers: ${containers}`,
    ] };
  }
}
