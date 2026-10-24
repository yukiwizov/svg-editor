import { CommandRegistry, BuildResult } from "./CommandRegistry";
import { CreateCommand } from "../commands/CreateCommand";
import { DeleteCommand } from "../commands/DeleteCommand";
import { MoveCommand } from "../commands/MoveCommand";
import { ScaleCommand } from "../commands/ScaleCommand";
import { SetCommand } from "../commands/SetCommand";
import { GroupCommand } from "../commands/GroupCommand";
import { UngroupCommand } from "../commands/UngroupCommand";
import { AddToCommand } from "../commands/AddToCommand";
import { FrontCommand } from "../commands/FrontCommand";
import { BackCommand } from "../commands/BackCommand";
import { InitCommand } from "../commands/InitCommand";
import { ReadCommand } from "../commands/ReadCommand";
import { SaveCommand } from "../commands/SaveCommand";
import { CanvasCommand } from "../commands/CanvasCommand";
import { UndoCommand } from "../commands/UndoCommand";
import { RedoCommand } from "../commands/RedoCommand";

/**
 * 把内置的 16 条命令注册到 registry。
 * 本阶段不含 tree / show / help（Renderer 在 P1-C14 加入）。
 *
 * 每条的构造参数对齐对应的命令构造函数（见 commands/*.ts）。
 */
export function registerBuiltinCommands(registry: CommandRegistry): void {
  registry.register("create", buildCreate);
  registry.register("delete", buildDelete);
  registry.register("move", buildMove);
  registry.register("scale", buildScale);
  registry.register("set", buildSet);
  registry.register("group", buildGroup);
  registry.register("ungroup", buildUngroup);
  registry.register("addto", buildAddTo);
  registry.register("front", buildFront);
  registry.register("back", buildBack);
  registry.register("init", buildInit);
  registry.register("read", buildRead);
  registry.register("save", buildSave);
  registry.register("canvas", buildCanvas);
  registry.register("undo", buildUndo);
  registry.register("redo", buildRedo);
}

// ---- 各命令的 builder ----

/**
 * create <type> <id> [params…] [in <containerId>]
 *
 * in 子句判定：
 *  - 至少 4 个参数（type、id、in、containerId）
 *  - 倒数第二个参数 === "in"
 * 否则把"in"当作普通参数（例如 `create text t1 0 0 "in"` 里的 "in" 是文字内容）。
 */
function buildCreate(args: string[]): BuildResult {
  if (args.length < 2) {
    return { error: "usage: create <type> <id> [params…] [in <containerId>]" };
  }
  let containerId: string | null = null;
  let tailEnd = args.length;
  if (args.length >= 4 && args[args.length - 2] === "in") {
    containerId = args[args.length - 1];
    tailEnd = args.length - 2;
  }
  const type = args[0];
  const id = args[1];
  const params = args.slice(2, tailEnd);
  return { command: new CreateCommand("create", type, id, params, containerId) };
}

function buildDelete(args: string[]): BuildResult {
  if (args.length !== 1) return { error: "usage: delete <id>" };
  return { command: new DeleteCommand("delete", args[0]) };
}

function buildMove(args: string[]): BuildResult {
  if (args.length !== 3) return { error: "usage: move <id> <dx> <dy>" };
  return { command: new MoveCommand("move", args[0], args[1], args[2]) };
}

function buildScale(args: string[]): BuildResult {
  if (args.length !== 2) return { error: "usage: scale <id> <factor>" };
  return { command: new ScaleCommand("scale", args[0], args[1]) };
}

function buildSet(args: string[]): BuildResult {
  if (args.length !== 3) return { error: "usage: set <id> <attr> <value>" };
  return { command: new SetCommand("set", args[0], args[1], args[2]) };
}

function buildGroup(args: string[]): BuildResult {
  if (args.length < 2) return { error: "usage: group <newGid> <id1> <id2>…" };
  return { command: new GroupCommand("group", args[0], args.slice(1)) };
}

function buildUngroup(args: string[]): BuildResult {
  if (args.length !== 1) return { error: "usage: ungroup <gid>" };
  return { command: new UngroupCommand("ungroup", args[0]) };
}

function buildAddTo(args: string[]): BuildResult {
  if (args.length !== 2) return { error: "usage: addto <gid> <id>" };
  return { command: new AddToCommand("addto", args[0], args[1]) };
}

function buildFront(args: string[]): BuildResult {
  if (args.length !== 1) return { error: "usage: front <id>" };
  return { command: new FrontCommand("front", args[0]) };
}

function buildBack(args: string[]): BuildResult {
  if (args.length !== 1) return { error: "usage: back <id>" };
  return { command: new BackCommand("back", args[0]) };
}

function buildInit(args: string[]): BuildResult {
  if (args.length > 2) return { error: "usage: init [w] [h]" };
  const w = args.length > 0 ? args[0] : null;
  const h = args.length > 1 ? args[1] : null;
  return { command: new InitCommand(w, h) };
}

function buildRead(args: string[]): BuildResult {
  if (args.length !== 1) return { error: "usage: read <file.svg>" };
  return { command: new ReadCommand(args[0]) };
}

function buildSave(args: string[]): BuildResult {
  if (args.length > 1) return { error: "usage: save [file.svg]" };
  const p = args.length > 0 ? args[0] : null;
  return { command: new SaveCommand(p) };
}

function buildCanvas(args: string[]): BuildResult {
  if (args.length > 2) return { error: "usage: canvas [w] [h]" };
  const w = args.length > 0 ? args[0] : null;
  const h = args.length > 1 ? args[1] : null;
  return { command: new CanvasCommand(w, h) };
}

function buildUndo(_args: string[]): BuildResult {
  return { command: new UndoCommand() };
}

function buildRedo(_args: string[]): BuildResult {
  return { command: new RedoCommand() };
}