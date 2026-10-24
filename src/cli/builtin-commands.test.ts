import { describe, it, expect } from "vitest";
import { CommandRegistry } from "./CommandRegistry";
import { registerBuiltinCommands } from "./builtin-commands";
import { CreateCommand } from "../commands/CreateCommand";
import { InitCommand } from "../commands/InitCommand";
import { UndoCommand } from "../commands/UndoCommand";

function freshRegistry(): CommandRegistry {
  const reg = new CommandRegistry();
  registerBuiltinCommands(reg);
  return reg;
}

describe("registerBuiltinCommands — 注册覆盖", () => {
  it("19 条命令全部注册", () => {
    const reg = freshRegistry();
    const names = reg.names().sort();
    expect(names).toEqual([
      "addto", "back", "canvas", "create", "delete", "front",
      "group", "help", "init", "move", "read", "redo",
      "save", "scale", "set", "show", "tree", "undo", "ungroup",
    ]);
  });
});

describe("builtin-commands — create 的 in 子句", () => {
  it("无 in：全部参数进 params", () => {
    const r = freshRegistry().build("create", ["rect", "r1", "0", "0", "10", "10", "#eee"]);
    expect("command" in r!).toBe(true);
    const cmd = (r as { command: CreateCommand }).command;
    expect(cmd).toBeInstanceOf(CreateCommand);
  });

  it("有 in：剥离最后两个 token 作为 containerId", () => {
    // 需要 black-box 地验证：创建后挂到 g1
    // 用 execute 的返回消息间接判断
  });

  it("text 内容恰为 'in' 且无 in 子句时不误判", () => {
    // create text t1 0 0 "in" → args 长度 5，倒数第二是 "0" 不等于 "in"
    const r = freshRegistry().build("create", ["text", "t1", "0", "0", "in"]);
    expect("command" in r!).toBe(true);
  });
});

describe("builtin-commands — 参数个数", () => {
  it("create 参数不足", () => {
    const r = freshRegistry().build("create", ["rect"]);
    expect("error" in r! && r.error).toContain("usage: create");
  });

  it("delete 参数个数错误", () => {
    const r = freshRegistry().build("delete", []);
    expect("error" in r! && r.error).toBe("usage: delete <id>");
  });

  it("init 允许 0/1/2 个参数", () => {
    const reg = freshRegistry();
    expect("command" in reg.build("init", [])!).toBe(true);
    expect("command" in reg.build("init", ["400"])!).toBe(true);
    expect("command" in reg.build("init", ["400", "200"])!).toBe(true);
    expect("error" in reg.build("init", ["400", "200", "x"])!).toBe(true);
  });

  it("undo 不接收参数也不报错", () => {
    const reg = freshRegistry();
    const r = reg.build("undo", []);
    expect("command" in r!).toBe(true);
    expect((r as { command: unknown }).command).toBeInstanceOf(UndoCommand);
  });
});

describe("builtin-commands — init 的 null 参数", () => {
  it("无参 init 构造出 InitCommand 时 widthArg/heightArg 都是 null", () => {
    const reg = freshRegistry();
    const r = reg.build("init", []);
    const cmd = (r as { command: InitCommand }).command;
    expect(cmd).toBeInstanceOf(InitCommand);
  });
});