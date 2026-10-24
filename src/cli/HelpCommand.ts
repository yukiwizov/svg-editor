import { Command } from "../commands/Command";
import { CommandResult } from "../commands/CommandResult";
import { EditorContext } from "../commands/EditorContext";
import { HELP_LINES } from "./HelpText";

export class HelpCommand implements Command {
  readonly name = "help";
  readonly category = "display" as const;

  execute(_ctx: EditorContext): CommandResult {
    return { lines: [...HELP_LINES] };
  }
}