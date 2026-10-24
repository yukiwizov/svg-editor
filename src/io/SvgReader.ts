import { DOMParser } from "@xmldom/xmldom";
import { Document } from "../core/Document";
import { ShapeFactory } from "../core/ShapeFactory";
import { isContainer } from "../core/Container";
import { IdAutoAssigner } from "./IdAutoAssigner";

export interface ReadResult {
  document: Document;
  /** 不带 "warning: " 前缀；前缀由 ReadCommand 打印时加。 */
  warnings: string[];
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

/**
 * 把 SVG 文本读为 Document。纯函数，不碰 fs。
 * 宽容读取：
 *   - 缺 id → 按 <tag><n> 自动分配 + warning
 *   - 重复 id → 后出现者按未命名处理 + warning
 *   - 未知标签 → 跳过整棵子树 + warning
 *   - transform → 忽略并警告（本阶段扁平坐标）
 *   - 缺失/非法尺寸 → viewBox 回退 → 默认 800×600
 */
export class SvgReader {
  constructor(private factory: ShapeFactory) {}

  read(xml: string): ReadResult {
    if (!xml || xml.trim() === "") {
      throw new Error("cannot parse svg: empty input");
    }
    const warnings: string[] = [];
    const dom = new DOMParser().parseFromString(xml, "image/svg+xml");
    const root = dom?.documentElement as Element | null | undefined;
    if (!root) {
      throw new Error("cannot parse svg: empty document");
    }
    const rootTag = localNameOf(root);
    if (rootTag !== "svg") {
      throw new Error(`not an svg document: <${rootTag}> root`);
    }

    const width = parseSize(root, "width", "viewBox", 0) ?? DEFAULT_WIDTH;
    const height = parseSize(root, "height", "viewBox", 1) ?? DEFAULT_HEIGHT;

    // 不预收集文档中的 id —— 让遍历顺序自然处理"保留 / 重复"：
    // 第一个遇到某 id 的元素保留它，后续重复的再分配。
    const assigner = new IdAutoAssigner();

    const doc = new Document(width, height);

    for (const child of elementChildren(root)) {
      const shape = this.buildShape(child, assigner, warnings);
      if (shape) doc.root.add(shape);
    }

    return { document: doc, warnings };
  }

  private buildShape(
    elem: Element,
    assigner: IdAutoAssigner,
    warnings: string[],
  ): ReturnType<ShapeFactory["createFromDom"]> extends infer _ ? import("../core/Shape").Shape | null : never {
    const tag = localNameOf(elem);

    // 1) id 解析
    const rawId = elem.getAttribute("id");
    let id: string;
    if (!rawId) {
      id = assigner.generate(tag);
      warnings.push(`assigned id ${id} to unnamed <${tag}>`);
    } else if (assigner.has(rawId)) {
      id = assigner.generate(tag);
      warnings.push(`assigned id ${id} to duplicate <${tag}> (original id="${rawId}")`);
    } else {
      id = rawId;
      assigner.reserve(rawId);
    }

    // 2) 未知标签跳过
    if (!this.factory.isRegistered(tag)) {
      warnings.push(`skipped unknown element <${tag} id="${id}">`);
      return null;
    }

    // 3) 属性收集（id / transform 单独处理，不进 attrs）
    const attrs: Record<string, string> = {};
    for (let i = 0; i < elem.attributes.length; i++) {
      const a = elem.attributes.item(i);
      if (!a) continue;
      if (a.name === "id" || a.name === "transform") continue;
      attrs[a.name] = a.value;
    }

    const textContent = tag === "text" ? (elem.textContent ?? "") : null;

    const shape = this.factory.createFromDom(tag, id, attrs, textContent);
    if (!shape) {
      warnings.push(`skipped unknown element <${tag} id="${id}">`);
      return null;
    }

    // 4) transform 忽略 + warning（本阶段扁平坐标决策）
    const transform = elem.getAttribute("transform");
    if (transform) {
      warnings.push(`ignored transform on ${tag}#${id}: ${transform}`);
    }

    // 5) 容器递归
    if (isContainer(shape)) {
      for (const child of elementChildren(elem)) {
        const childShape = this.buildShape(child, assigner, warnings);
        if (childShape) shape.add(childShape);
      }
    }

    return shape;
  }
}

// ---- 工具函数 ----

function localNameOf(elem: Element): string {
  const name = elem.localName ?? elem.tagName ?? "";
  const parts = name.split(":");
  return parts[parts.length - 1];
}

function* elementChildren(elem: Element): Iterable<Element> {
  const nodes = elem.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes.item(i);
    if (n && n.nodeType === 1) yield n as Element;
  }
}

/** 只接受纯数字（可负、可小数）；百分比等一律返回 null 触发回退。 */
function parseNumeric(v: string | null): number | null {
  if (!v) return null;
  if (!/^\s*-?\d+(\.\d+)?\s*$/.test(v)) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function parseSize(
  elem: Element,
  attrName: string,
  viewBoxName: string,
  viewBoxIndex: 0 | 1,
): number | null {
  const direct = parseNumeric(elem.getAttribute(attrName));
  if (direct !== null) return direct;
  const vb = elem.getAttribute(viewBoxName);
  if (vb) {
    const parts = vb.trim().split(/\s+/);
    if (parts.length === 4) {
      const n = parseNumeric(parts[viewBoxIndex + 2] ?? null);
      if (n !== null) return n;
    }
  }
  return null;
}