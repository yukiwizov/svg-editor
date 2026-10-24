import { describe, it, expect } from "vitest";
import { CommandRegistry } from "./CommandRegistry";

describe("CommandRegistry", () => {
  it("register / has / build 基本流程", () => {
    const reg = new CommandRegistry();
    expect(reg.has("foo")).toBe(false);
    reg.register("foo", (args) => ({
      command: {
        name: "foo",
        category: "display",
        execute: () => ({ lines: [`got ${args.length} args`] }),
      },
    }));
    expect(reg.has("foo")).toBe(true);
    const r = reg.build("foo", ["a", "b"]);
    expect(r).not.toBeNull();
    expect("command" in r!).toBe(true);
  });

  it("未注册返回 null", () => {
    const reg = new CommandRegistry();
    expect(reg.build("nope", [])).toBeNull();
  });

  it("builder 返回 error", () => {
    const reg = new CommandRegistry();
    reg.register("bar", () => ({ error: "bad args" }));
    const r = reg.build("bar", []);
    expect(r).not.toBeNull();
    expect("error" in r!).toBe(true);
  });

  it("names 返回已注册名", () => {
    const reg = new CommandRegistry();
    reg.register("a", () => ({ error: "x" }));
    reg.register("b", () => ({ error: "y" }));
    expect(reg.names().sort()).toEqual(["a", "b"]);
  });

  it("重复注册覆盖（最后一次生效）", () => {
    const reg = new CommandRegistry();
    reg.register("x", () => ({ error: "old" }));
    reg.register("x", () => ({ error: "new" }));
    const r = reg.build("x", []);
    expect("error" in r! && r.error).toBe("new");
  });
});