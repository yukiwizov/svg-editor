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
import { TreeCommand } from "./TreeCommand";
import { ShowCommand } from "./ShowCommand";
import { HelpCommand } from "./HelpCommand";

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
  registry.register("tree", buildTree);
  registry.register("show", buildShow);
  registry.register("help", buildHelp);
}

// ---- builder 与 P1-C13 保持一致，此处省略（保留原内容） ----

function buildCreate(args: string[]): BuildResult {
  if (args.length < 2) return { error: "usage: create <type> <id> [params…] [in <containerId>]" };
  let containerId: string | null = null;
  let tailEnd = args.length;
  if (args.length >= 4 && args[args.length - 2] === "in") {
    containerId = args[args.length - 1];
    tailEnd = args.length - 2;
  }
  return { command: new CreateCommand("create", args[0], args[1], args.slice(2, tailEnd), containerId) };
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
  return { command: new InitCommand(args[0] ?? null, args[1] ?? null) };
}

function buildRead(args: string[]): BuildResult {
  if (args.length !== 1) return { error: "usage: read <file.svg>" };
  return { command: new ReadCommand(args[0]) };
}

function buildSave(args: string[]): BuildResult {
  if (args.length > 1) return { error: "usage: save [file.svg]" };
  return { command: new SaveCommand(args[0] ?? null) };
}

function buildCanvas(args: string[]): BuildResult {
  if (args.length > 2) return { error: "usage: canvas [w] [h]" };
  return { command: new CanvasCommand(args[0] ?? null, args[1] ?? null) };
}

function buildUndo(_args: string[]): BuildResult {
  return { command: new UndoCommand() };
}

function buildRedo(_args: string[]): BuildResult {
  return { command: new RedoCommand() };
}

function buildTree(args: string[]): BuildResult {
  if (args.length > 1) return { error: "usage: tree [id]" };
  return { command: new TreeCommand(args[0] ?? null) };
}

function buildShow(args: string[]): BuildResult {
  if (args.length !== 1) return { error: "usage: show <id>" };
  return { command: new ShowCommand(args[0]) };
}

function buildHelp(_args: string[]): BuildResult {
  return { command: new HelpCommand() };
}