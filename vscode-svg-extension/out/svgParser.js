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
/**
 * 解析 SVG 文本生成大纲树。
 * 若 XML 明显畸形/不完整或标签闭合不匹配，返回空数组 [] 以保证不崩溃。
 */
function parseSvgOutline(source) {
    try {
        const text = source.replace(/^\uFEFF/, "");
        if (!text.trim()) {
            return [];
        }
        // 去除注释与 CDATA 以便扫描标签
        const sanitized = text
            .replace(/<!--[\s\S]*?-->/g, (m) => " ".repeat(m.length))
            .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => " ".repeat(m.length));
        const offsets = buildLineOffsets(text);
        const roots = [];
        const stack = [];
        // 匹配 <?...?>、<!...>、</tag>、<tag ...>
        const tokenRegex = /<\?[\s\S]*?\?>|<!(?!--)[\s\S]*?>|<\/\s*([A-Za-z_][\w:.-]*)\s*>|<([A-Za-z_][\w:.-]*)((?:\s+[^<>]*?)?)(\/?)>/g;
        let match;
        while ((match = tokenRegex.exec(sanitized)) !== null) {
            const full = match[0];
            const matchStart = match.index;
            const matchEnd = matchStart + full.length;
            // 跳过 XML 声明 / DOCTYPE
            if (full.startsWith("<?") || full.startsWith("<!")) {
                continue;
            }
            // 闭合标签 </tag>
            if (match[1]) {
                const closeTag = match[1];
                if (stack.length === 0) {
                    return [];
                }
                const top = stack[stack.length - 1];
                if (top.node.tagName !== closeTag) {
                    // 标签错位/未闭合（编辑过程中的不完整 XML）
                    return [];
                }
                const endPos = offsetToPos(offsets, matchEnd);
                top.node.endLine = endPos.line;
                top.node.endChar = endPos.character;
                stack.pop();
                continue;
            }
            // 开始标签或自闭合标签
            const tagName = match[2];
            const rawAttrs = match[3] ?? "";
            const selfClosing = match[5] === "/";
            // 检查属性引号是否成对闭合，防止半截属性导致误判
            const singleQuotes = (rawAttrs.match(/'/g) ?? []).length;
            const doubleQuotes = (rawAttrs.match(/"/g) ?? []).length;
            if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
                return [];
            }
            const id = extractIdAttr(rawAttrs);
            const label = id ? `${tagName}#${id}` : tagName;
            const startPos = offsetToPos(offsets, matchStart);
            const endPos = offsetToPos(offsets, matchEnd);
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
                stack.push({ node, startOffset: matchStart });
            }
        }
        // 存在未闭合标签或根元素缺失/多个未闭合块，视为不完整 XML
        if (stack.length > 0 || roots.length === 0) {
            return [];
        }
        // 根元素应为 svg（若正在输入刚改完根标签导致不是 svg，安全返回 [] 或根节点）
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