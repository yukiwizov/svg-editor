import * as vscode from "vscode";
import { SvgFileDecorationProvider } from "./svgBadgeProvider";
import { SvgDocumentSymbolProvider } from "./svgOutlineProvider";

export function activate(context: vscode.ExtensionContext): void {
  const badgeProvider = new SvgFileDecorationProvider();
  const badgeDisposable = vscode.window.registerFileDecorationProvider(badgeProvider);

  const watcher = vscode.workspace.createFileSystemWatcher("**/*.svg");
  watcher.onDidCreate((uri) => badgeProvider.refresh(uri));
  watcher.onDidChange((uri) => badgeProvider.refresh(uri));
  watcher.onDidDelete((uri) => badgeProvider.refresh(uri));

  const selector: vscode.DocumentSelector = [
    { scheme: "file", pattern: "**/*.svg" },
  ];
  const outlineDisposable = vscode.languages.registerDocumentSymbolProvider(
    selector,
    new SvgDocumentSymbolProvider()
  );

  badgeProvider.refresh(undefined);

  context.subscriptions.push(badgeDisposable, watcher, outlineDisposable);
}

export function deactivate(): void {}