import { Document } from "../core/Document";
import { Shape } from "../core/Shape";
import { isContainer } from "../core/Container";

const SVG_NS = "http://www.w3.org/2000/svg";
const INDENT = "  ";

/**
 * 把 Document 序列化为 SVG 文本。纯函数，不碰 fs。
 * 文件 IO 属于 SaveCommand 的职责（见 P6 阶段）。
 */
export class SvgWriter {
  serialize(doc: Document): string {
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(this.openRoot(doc));
    for (const child of doc.root.getChildren()) {
      this.appendShape(child, 1, lines);
    }
    lines.push("</svg>");
    return lines.join("\n") + "\n";
  }

  private openRoot(doc: Document): string {
    const w = String(doc.width);
    const h = String(doc.height);
    return `<svg xmlns="${SVG_NS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  }

  private appendShape(shape: Shape, depth: number, lines: string[]): void {
    const pad = INDENT.repeat(depth);
    const attrs: Record<string, string> = {
      id: shape.getId(),
      ...shape.getAttributes(),
    };
    const attrStr = serializeAttributes(attrs);
    const tag = shape.getTagName();

    if (isContainer(shape)) {
      const children = shape.getChildren();
      if (children.length === 0) {
        lines.push(`${pad}<${tag}${attrStr}/>`);
        return;
      }
      lines.push(`${pad}<${tag}${attrStr}>`);
      for (const child of children) {
        this.appendShape(child, depth + 1, lines);
      }
      lines.push(`${pad}</${tag}>`);
      return;
    }

    const text = shape.getTextContent();
    if (text !== null) {
      lines.push(`${pad}<${tag}${attrStr}>${escapeText(text)}</${tag}>`);
      return;
    }
    lines.push(`${pad}<${tag}${attrStr}/>`);
  }
}

function serializeAttributes(attrs: Record<string, string>): string {
  const parts: string[] = [];
  for (const key of Object.keys(attrs)) {
    parts.push(`${key}="${escapeAttr(attrs[key])}"`);
  }
  return parts.length === 0 ? "" : " " + parts.join(" ");
}

/** 属性值转义：必须先把 & 转掉，否则 &lt; 会被二次转义。 */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 文本内容转义：不需要转 " 与 '（不是属性分隔符）。 */
function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}