import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Repl } from "./Repl";
import { MemoryIO } from "./__test-utils__/MemoryIO";
import { CommandRegistry } from "./CommandRegistry";
import { registerBuiltinCommands } from "./builtin-commands";
import { CommandDispatcher } from "./CommandDispatcher";
import { EditorContext } from "../commands/EditorContext";

const BANNER = "svg-editor 0.1 — type 'help' for commands";

/** 执行一整段 transcript，返回"跳过 banner + 空行"的输出。 */
async function runTranscript(lines: string[]): Promise<string[]> {
  const registry = new CommandRegistry();
  registerBuiltinCommands(registry);
  const dispatcher = new CommandDispatcher(registry);
  const ctx = new EditorContext();
  const io = new MemoryIO(lines);
  const repl = new Repl(io, dispatcher, ctx);
  await repl.run();
  expect(io.writes[0]).toBe(BANNER);
  expect(io.writes[1]).toBe("");
  return io.writes.slice(2);
}

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "svg-e2e-"));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// 文档 §6 的主会话（不含 read/save，因为它们依赖真实文件；单独测）
// ---------------------------------------------------------------------------

describe("端到端 — §6 主会话（不含 IO）", () => {
  it("从 init 到 set 的全部输出逐行精确匹配", async () => {
    const out = await runTranscript([
      "init 800 600",
      "create rect bg 0 0 800 600 #ffffff",
      'create text title 20 40 "My Diagram"',
      "create circle c1 100 100 20 red",
      "create rect box 200 80 60 60 #3366ff",
      "group markers c1 box",
      "tree",
      "move c1 30 0",
      "undo",
      "redo",
      'set title text "My Diagram v2"',
      "undo",
      "group bad c1 markers",
      "delete box",
      "undo",
    ]);

    expect(out).toEqual([
      "canvas 800x600 created",
      "rect#bg created",
      "text#title created",
      "circle#c1 created",
      "rect#box created",
      "g#markers created with 2 children",
      "svg (800x600)",
      "├── rect#bg        x=0 y=0 w=800 h=600 fill=#ffffff",
      '├── text#title     (20,40) "My Diagram"',
      "└── g#markers",
      "    ├── circle#c1  cx=100 cy=100 r=20 fill=red",
      "    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff",
      "circle#c1 moved to (130,100)",
      "circle#c1 moved back to (100,100)",
      "circle#c1 moved to (130,100)",
      'text#title updated: text="My Diagram v2"',
      'text#title updated: text="My Diagram"',
      "error: cannot group a container into its own descendant: markers",
      "rect#box deleted",
      "rect#box restored into g#markers",
    ]);
  });
});

// ---------------------------------------------------------------------------
// save + undo 被禁 + read other.svg（依赖真实文件）
// ---------------------------------------------------------------------------

const OTHER_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1">
    <rect id="r2" x="0" y="0" width="10" height="10"/>
    <circle id="c2" cx="5" cy="5" r="2"/>
  </g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>`;

describe("端到端 — save 后 undo 被禁 + read 外部 SVG", () => {
  it("save → undo 报 io 错误 → read other.svg → tree", async () => {
    const otherPath = path.join(tmpDir, "other.svg");
    fs.writeFileSync(otherPath, OTHER_SVG, "utf-8");
    const savePath = path.join(tmpDir, "demo.svg");

    const out = await runTranscript([
      "init 800 600",
      "create rect bg 0 0 800 600 #ffffff",
      'create text title 20 40 "My Diagram"',
      "create circle c1 100 100 20 red",
      "create rect box 200 80 60 60 #3366ff",
      "group markers c1 box",
      `save ${savePath}`,
      "undo",
      `read ${otherPath}`,
      "tree",
    ]);

    expect(out).toEqual([
      "canvas 800x600 created",
      "rect#bg created",
      "text#title created",
      "circle#c1 created",
      "rect#box created",
      "g#markers created with 2 children",
      `saved to ${savePath} (5 elements)`,
      "error: undo not allowed after io command",
      "warning: assigned id rect1 to unnamed <rect>",
      `read ${otherPath} (7 elements)`,
      "svg (400x300)",
      "├── rect#rect1     x=0 y=0 w=400 h=300 fill=#ffffff",
      '├── text#t1        (10,290) "imported"',
      "├── circle#c1      cx=50 cy=50 r=10",
      "├── g#g1",
      "│   ├── rect#r2    x=0 y=0 w=10 h=10",
      "│   └── circle#c2  cx=5 cy=5 r=2",
      "└── ellipse#e1     cx=1 cy=2 rx=3 ry=4",
    ]);

    // save 生成的文件也可以二次 read 回来
    expect(fs.existsSync(savePath)).toBe(true);
    const content = fs.readFileSync(savePath, "utf-8");
    expect(content).toContain('<svg xmlns=');
    expect(content).toContain('<rect id="bg"');
    expect(content).toContain('<g id="markers">');
  });
});

// ---------------------------------------------------------------------------
// §6.1 两节点流程图（版本 A：用 in 子句 + group）
//
// 注意：文档 §6.1 的 tree 输出是手算示例，其列对齐与 §5.1 的精确定义不完全一致。
// 本测试以"P1-C14 实现的 19 列对齐规则"为准，重新计算期望值，不照抄文档。
// 差异仅出现在"head 已超过 19 列"的深层节点（pad 退化为 2 空格）。
// ---------------------------------------------------------------------------

describe("端到端 — §6.1 两节点流程图（in 子句）", () => {
  it("用 in 子句自顶向下构建 + move + undo + set", async () => {
    const out = await runTranscript([
      "init 800 600",
      "create g flowchart",
      "create g node1 in flowchart",
      "create rect start 120 100 160 60 #4a90d9 in node1",
      'create text start-label 155 135 "开始" in node1',
      "create g node2 in flowchart",
      "create rect process 520 100 160 60 #f5a623 in node2",
      'create text process-label 545 135 "处理数据" in node2',
      "create line arrow1 280 130 520 130 black in flowchart",
      "tree",
      "move node2 0 100",
      "undo",
      'set process-label text "处理数据 v2"',
    ]);

    expect(out).toEqual([
      "canvas 800x600 created",
      "g#flowchart created",
      "g#node1 created in g#flowchart",
      "rect#start created in g#node1",
      "text#start-label created in g#node1",
      "g#node2 created in g#flowchart",
      "rect#process created in g#node2",
      "text#process-label created in g#node2",
      "line#arrow1 created in g#flowchart",
      "svg (800x600)",
      "└── g#flowchart",
      "    ├── g#node1",
      "    │   ├── rect#start  x=120 y=100 w=160 h=60 fill=#4a90d9",
      '    │   └── text#start-label  (155,135) "开始"',
      "    ├── g#node2",
      "    │   ├── rect#process  x=520 y=100 w=160 h=60 fill=#f5a623",
      '    │   └── text#process-label  (545,135) "处理数据"',
      "    └── line#arrow1  (280,130) -> (520,130) stroke=black",
      "g#node2 moved by (0,100)",
      "g#node2 moved back by (0,-100)",
      'text#process-label updated: text="处理数据 v2"',
    ]);
  });
});

// ---------------------------------------------------------------------------
// §4.2 错误信息全集
// ---------------------------------------------------------------------------

describe("端到端 — §4.2 错误信息全集", () => {
  it("逐个触发 4.2 里的错误码", async () => {
    const out = await runTranscript([
      // 未 init/read
      "tree",
      // init 后
      "init 400 200",
      // id 已存在
      "create rect dup 0 0 10 10",
      "create rect dup 0 0 10 10",
      // id 不存在
      "delete nope",
      // in 目标不存在
      "create rect r1 0 0 10 10 in nope",
      // in 目标不是容器
      "create rect r2 0 0 10 10",
      "create rect r3 0 0 10 10 in r2",
      // 未注册图形类型
      "create hexagon h1 1 2 3",
      // scale 非正数
      "scale r2 0",
      "scale r2 -1",
      // ungroup 顶层容器
      "create g top",
      "ungroup top",
      // group 容器入子孙
      "create g outer",
      "create g inner in outer",
      "group bad outer inner",
      // 文件不存在
      "read /definitely/not/exist.svg",
    ]);

    expect(out).toEqual([
      "error: no document. use 'init' or 'read' first",
      "canvas 400x200 created",
      "rect#dup created",
      "error: id already exists: dup",
      "error: no such shape: nope",
      "error: no such container: nope",
      "rect#r2 created",
      "error: not a container: r2",
      "error: unknown shape type: hexagon (is the plugin loaded?)",
      "error: scale factor must be positive",
      "error: scale factor must be positive",
      "g#top created",
      "error: cannot ungroup top-level container: top",
      "g#outer created",
      "g#inner created in g#outer",
      "error: cannot group a container into its own descendant: outer",
      "error: cannot read file: /definitely/not/exist.svg",
    ]);
  });
});

// ---------------------------------------------------------------------------
// undo/redo 边界
// ---------------------------------------------------------------------------

describe("端到端 — undo/redo 边界", () => {
  it("空栈报错；undo 后新编辑清空 redo", async () => {
    const out = await runTranscript([
      "init 100 100",
      "undo",
      "redo",
      "create rect r1 0 0 10 10",
      "create rect r2 0 0 10 10",
      "undo",
      "redo",
      "create rect r3 0 0 10 10",
      "redo",
    ]);

    expect(out).toEqual([
      "canvas 100x100 created",
      "error: undo not allowed after io command",
      "error: redo not allowed after io command",
      "rect#r1 created",
      "rect#r2 created",
      "rect#r2 creation undone",
      "rect#r2 created",
      "rect#r3 created",
      "error: nothing to redo",
    ]);
  });

  it("edit 之后 undo 解禁，可以连续 undo 到底", async () => {
    const out = await runTranscript([
      "init 100 100",
      "create rect a 0 0 10 10",
      "create rect b 0 0 10 10",
      "undo",
      "undo",
      "undo",
    ]);

    expect(out).toEqual([
      "canvas 100x100 created",
      "rect#a created",
      "rect#b created",
      "rect#b creation undone",
      "rect#a creation undone",
      "error: nothing to undo",
    ]);
  });
});