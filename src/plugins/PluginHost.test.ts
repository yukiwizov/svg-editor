import { describe, it, expect } from "vitest";
import { PluginHost } from "./PluginHost";
import { ShapeFactory } from "../core/ShapeFactory";
import { CommandRegistry } from "../cli/CommandRegistry";

function host(): PluginHost {
  return new PluginHost(new ShapeFactory(), new CommandRegistry(), [], []);
}

describe("PluginHost activation transactions", () => {
  it("rejects manifest mismatch and rolls back registrations", () => {
    const h = host();
    expect(() => h.activate({
      name: "broken",
      contributes: { commands: ["expected"] },
      activate(context) {
        context.commands.register("actual", () => ({ error: "unused" }));
      },
    })).toThrow(/manifest mismatch: broken/);
    expect(h.commands.has("actual")).toBe(false);
  });

  it("rejects duplicate registrations with stable category/name", () => {
    const h = host();
    h.commands.register("existing", () => ({ error: "unused" }));
    expect(() => h.activate({
      name: "duplicate",
      contributes: {},
      activate(context) {
        context.commands.register("existing", () => ({ error: "unused" }));
      },
    })).toThrow("duplicate registration: command/existing");
  });

  it("does not retain attributes registered before activation fails", () => {
    const h = host();
    expect(() => h.activate({
      name: "partial",
      contributes: {},
      activate(context) {
        context.registerDecorator({ name: "temp", decorate: () => undefined });
        throw new Error("activation failed");
      },
    })).toThrow("activation failed");
    expect(h.decorators).toHaveLength(0);
  });
});
