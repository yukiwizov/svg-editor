import * as vscode from "vscode";

export class SvgFileDecorationProvider implements vscode.FileDecorationProvider {
  private readonly _onDidChangeFileDecorations = new vscode.EventEmitter<
    vscode.Uri | vscode.Uri[] | undefined
  >();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  refresh(uri?: vscode.Uri): void {
    this._onDidChangeFileDecorations.fire(uri);
  }

  provideFileDecoration(
    uri: vscode.Uri,
    _token: vscode.CancellationToken
  ): vscode.FileDecoration | undefined {
    if (uri.scheme !== "file") {
      return undefined;
    }
    if (!uri.fsPath.toLowerCase().endsWith(".svg")) {
      return undefined;
    }

    const decoration = new vscode.FileDecoration("[]", "SVG File");
    decoration.propagate = false;
    return decoration;
  }
}