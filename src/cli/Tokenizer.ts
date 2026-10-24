/**
 * 把一行 CLI 输入切分成 token。
 *
 * 规则：
 *  - 空行 / 纯空白 → []
 *  - 跳过前导空白后首字符是 '#' → 整行注释，返回 []
 *  - 空格分隔 token
 *  - 双引号包裹的内容是一个 token，内部空格保留；允许空字符串 ""
 *  - 双引号不闭合 → 返回 error
 *  - 行内的 '#' 是普通字符（例如 '#4a90d9' 是合法 color token）
 */
export interface TokenizeResult {
  tokens: string[];
  error?: string;
}

export function tokenize(line: string): TokenizeResult {
  const n = line.length;
  let i = 0;

  // 1) 跳过前导空白
  while (i < n && isSpace(line[i])) i++;

  // 2) 空行或注释
  if (i >= n) return { tokens: [] };
  if (line[i] === "#") return { tokens: [] };

  // 3) 切 token
  const tokens: string[] = [];
  while (i < n) {
    // 跳过分隔空格
    while (i < n && isSpace(line[i])) i++;
    if (i >= n) break;

    if (line[i] === '"') {
      // 引号包裹
      i++; // 跳过开引号
      let buf = "";
      let closed = false;
      while (i < n) {
        if (line[i] === '"') {
          closed = true;
          i++;
          break;
        }
        buf += line[i];
        i++;
      }
      if (!closed) {
        return { tokens: [], error: "unterminated double quote" };
      }
      tokens.push(buf);
    } else {
      // 普通 token，直到下一个空白
      let buf = "";
      while (i < n && !isSpace(line[i])) {
        buf += line[i];
        i++;
      }
      tokens.push(buf);
    }
  }

  return { tokens };
}

function isSpace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\r" || ch === "\n" || ch === "\f" || ch === "\v";
}