import * as vscode from "vscode";

type NodeFrame = { symbol: vscode.DocumentSymbol; start: vscode.Position; name: string };

/**
 * Small XML-aware scanner for SVG outline data. It deliberately fails closed:
 * incomplete or mismatched markup produces an empty outline rather than throwing.
 */
export function parseSvgOutline(document: vscode.TextDocument): vscode.DocumentSymbol[] {
  const text = document.getText();
  const roots: vscode.DocumentSymbol[] = [];
  const stack: NodeFrame[] = [];
  let i = 0;

  while (i < text.length) {
    const open = text.indexOf("<", i);
    if (open < 0) break;
    if (text.startsWith("<!--", open)) {
      const end = text.indexOf("-->", open + 4);
      if (end < 0) return [];
      i = end + 3;
      continue;
    }
    if (text.startsWith("<![CDATA[", open)) {
      const end = text.indexOf("]]>", open + 9);
      if (end < 0) return [];
      i = end + 3;
      continue;
    }
    if (text.startsWith("<?", open) || text.startsWith("<!", open)) {
      const end = scanTagEnd(text, open + 2);
      if (end < 0) return [];
      i = end + 1;
      continue;
    }

    const end = scanTagEnd(text, open + 1);
    if (end < 0) return [];
    const raw = text.slice(open + 1, end).trim();
    if (!raw) return [];
    const closing = raw.startsWith("/");
    const selfClosing = !closing && raw.endsWith("/");
    const body = closing ? raw.slice(1).trim() : raw.replace(/\/$/, "").trim();
    const nameMatch = /^([A-Za-z_][\w:.-]*)/.exec(body);
    if (!nameMatch) return [];
    const name = nameMatch[1].split(":").pop()!;
    const start = document.positionAt(open);
    const tagEnd = document.positionAt(end + 1);

    if (closing) {
      const top = stack.pop();
      if (!top || top.name !== name) return [];
      top.symbol.range = new vscode.Range(top.start, tagEnd);
      top.symbol.selectionRange = new vscode.Range(top.start, tagEnd);
    } else {
      const id = readAttribute(body, "id");
      const label = id ? name + "#" + id : name;
      const symbol = new vscode.DocumentSymbol(
        label,
        "",
        vscode.SymbolKind.Object,
        new vscode.Range(start, tagEnd),
        new vscode.Range(start, tagEnd),
      );
      if (stack.length) stack[stack.length - 1].symbol.children.push(symbol);
      else roots.push(symbol);
      if (!selfClosing) stack.push({ symbol, start, name });
    }
    i = end + 1;
  }

  // Unclosed tags are treated as malformed; the caller receives an empty outline.
  return stack.length === 0 ? roots : [];
}

function scanTagEnd(text: string, from: number): number {
  let quote = "";
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = "";
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ">") {
      return i;
    }
  }
  return -1;
}

function readAttribute(tagBody: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp("(?:^|\\s)" + escaped + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')").exec(tagBody);
  return match?.[1] ?? match?.[2];
}
