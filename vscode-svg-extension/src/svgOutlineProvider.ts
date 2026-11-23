import * as vscode from "vscode";
import { parseSvgOutline, SvgOutlineNode } from "./svgParser";

function toDocumentSymbol(node: SvgOutlineNode): vscode.DocumentSymbol {
  const start = new vscode.Position(node.startLine, node.startChar);
  const end = new vscode.Position(node.endLine, node.endChar);
  const range = new vscode.Range(start, end);
  const kind =
    node.children.length > 0
      ? vscode.SymbolKind.Namespace
      : vscode.SymbolKind.Object;

  const symbol = new vscode.DocumentSymbol(
    node.label,
    node.tagName,
    kind,
    range,
    range
  );
  symbol.children = node.children.map(toDocumentSymbol);
  return symbol;
}

export class SvgDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.DocumentSymbol[] {
    if (!document.fileName.toLowerCase().endsWith(".svg")) {
      return [];
    }
    const text = document.getText();
    const tree = parseSvgOutline(text);
    return tree.map(toDocumentSymbol);
  }
}