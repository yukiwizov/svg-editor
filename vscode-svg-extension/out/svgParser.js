"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSvgOutline = parseSvgOutline;
function buildLineOffsets(text) {
    const offsets = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === "\n") {
            offsets.push(i + 1);
        }
    }
    return offsets;
}
function offsetToPos(offsets, offset) {
    const clamped = Math.max(0, Math.min(offset, offsets[offsets.length - 1] ?? 0));
    let low = 0;
    let high = offsets.length - 1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (offsets[mid] <= clamped) {
            low = mid + 1;
        }
        else {
            high = mid - 1;
        }
    }
    const line = Math.max(0, high);
    return { line, character: clamped - offsets[line] };
}
function extractIdAttr(rawAttrs) {
    const match = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(rawAttrs);
    const val = match?.[1] ?? match?.[2];
    return val && val.trim().length > 0 ? val.trim() : undefined;
}
function hasBalancedQuotes(str) {
    let quote = null;
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (quote) {
            if (ch === quote) {
                quote = null;
            }
        }
        else if (ch === '"' || ch === "'") {
            quote = ch;
        }
    }
    return quote === null;
}
function parseSvgOutline(source) {
    try {
        const text = source.replace(/^\uFEFF/, "");
        if (!text.trim()) {
            return [];
        }
        const sanitized = text
            .replace(/<!--[\s\S]*?-->/g, (m) => " ".repeat(m.length))
            .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => " ".repeat(m.length));
        const offsets = buildLineOffsets(text);
        const roots = [];
        const stack = [];
        let i = 0;
        while (i < sanitized.length) {
            if (sanitized[i] !== "<") {
                i++;
                continue;
            }
            if (sanitized.startsWith("<?", i)) {
                const endDecl = sanitized.indexOf("?>", i + 2);
                if (endDecl === -1)
                    return [];
                i = endDecl + 2;
                continue;
            }
            if (sanitized.startsWith("<!", i)) {
                const endBang = sanitized.indexOf(">", i + 2);
                if (endBang === -1)
                    return [];
                i = endBang + 1;
                continue;
            }
            const closeIdx = sanitized.indexOf(">", i + 1);
            if (closeIdx === -1) {
                return [];
            }
            const inner = sanitized.slice(i + 1, closeIdx);
            if (!hasBalancedQuotes(inner)) {
                return [];
            }
            const trimmedInner = inner.trim();
            if (!trimmedInner) {
                return [];
            }
            // 闭合标签 </tag>
            if (trimmedInner.startsWith("/")) {
                const closeTag = trimmedInner.slice(1).trim();
                if (!/^[A-Za-z_][\w:.-]*$/.test(closeTag)) {
                    return [];
                }
                if (stack.length === 0) {
                    return [];
                }
                const top = stack[stack.length - 1];
                if (top.node.tagName !== closeTag) {
                    return [];
                }
                const endPos = offsetToPos(offsets, closeIdx + 1);
                top.node.endLine = endPos.line;
                top.node.endChar = endPos.character;
                stack.pop();
                i = closeIdx + 1;
                continue;
            }
            // 开始或自闭合标签 <tag ...> / <tag ... />
            const selfClosing = trimmedInner.endsWith("/");
            const body = selfClosing ? trimmedInner.slice(0, -1).trimEnd() : trimmedInner;
            const tagMatch = /^([A-Za-z_][\w:.-]*)([\s\S]*)$/.exec(body);
            if (!tagMatch) {
                return [];
            }
            const tagName = tagMatch[1];
            const rawAttrs = tagMatch[2] ?? "";
            const id = extractIdAttr(rawAttrs);
            const label = id ? `${tagName}#${id}` : tagName;
            const startPos = offsetToPos(offsets, i);
            const endPos = offsetToPos(offsets, closeIdx + 1);
            const node = {
                tagName,
                id,
                label,
                startLine: startPos.line,
                startChar: startPos.character,
                endLine: endPos.line,
                endChar: endPos.character,
                children: [],
            };
            if (stack.length > 0) {
                stack[stack.length - 1].node.children.push(node);
            }
            else {
                roots.push(node);
            }
            if (!selfClosing) {
                stack.push({ node });
            }
            i = closeIdx + 1;
        }
        if (stack.length > 0 || roots.length === 0) {
            return [];
        }
        if (roots[0].tagName !== "svg") {
            return [];
        }
        return roots;
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=svgParser.js.map