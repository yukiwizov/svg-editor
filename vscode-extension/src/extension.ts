import * as vscode from "vscode";
import { parseSvgOutline } from "./svgOutline";

class SvgDecorationProvider implements vscode.FileDecorationProvider {
  private readonly changed = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  readonly onDidChangeFileDecorations = this.changed.event;

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    if (!uri.path.toLowerCase().endsWith(".svg")) return undefined;
    const decoration = new vscode.FileDecoration("[]", "SVG document");
    decoration.propagate = false;
    return decoration;
  }

  refresh(): void {
    this.changed.fire(undefined);
  }

  dispose(): void {
    this.changed.dispose();
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const decorations = new SvgDecorationProvider();
  context.subscriptions.push(
    decorations,
    vscode.window.registerFileDecorationProvider(decorations),
    vscode.languages.registerDocumentSymbolProvider(
      [{ scheme: "file", language: "svg" }, { scheme: "file", language: "xml", pattern: "**/*.svg" }],
      { provideDocumentSymbols: document => parseSvgOutline(document) },
    ),
    vscode.workspace.onDidCreateFiles(() => decorations.refresh()),
    vscode.workspace.onDidDeleteFiles(() => decorations.refresh()),
    vscode.workspace.onDidRenameFiles(() => decorations.refresh()),
  );
}

export function deactivate(): void {
  // VS Code disposes all subscriptions registered by activate().
}
