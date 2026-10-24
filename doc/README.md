# SVG 编辑器（CLI）— 架构与过程记录

> 项目：PJ1 Phase 1 的 CLI 版 SVG 编辑器
> 提交：全程 git 管理，分 18 个 commit 推进，最终 tag `final`

---

## 一、架构方案

### 1. 模块划分

```
src/
├── core/        领域模型（无 IO、无 CLI 依赖）
├── io/          SVG 文本 ↔ Document 的序列化
├── commands/    命令层（可撤销的编辑操作 + 文档类操作）
├── cli/         REPL、字符串解析、渲染输出、按名分派
├── __arch__/    架构约束测试（不属于业务代码）
└── index.ts     入口（组装并启动 REPL）
```

| 模块 | 职责 | 关键类/文件 |
|---|---|---|
| `core` | 图形层次、几何、属性读写、id 空间。**不知道** SVG 文本形态、**不知道**命令、**不知道** REPL | `Shape` 抽象基类 + 6 个子类（`Rect`/`Circle`/`Ellipse`/`Line`/`TextShape`/`Group`）、`Container` 接口、`Document`、`IdRegistry`、`ShapeFactory` |
| `io` | 把 `Document` 序列化为 SVG / 从 SVG 重建 `Document`；自动补 id | `SvgWriter`、`SvgReader`、`IdAutoAssigner` |
| `commands` | 一次编辑/查询的封装，持有撤销所需的逆操作信息；**不**解析字符串、**不**打印 | `Command`/`EditCommand` 接口、`CommandResult`、`EditorContext`、`CommandHistory`、16 条命令（Create/Delete/Move/Scale/Set/Group/Ungroup/AddTo/Front/Back/Init/Read/Save/Canvas/Undo/Redo） |
| `cli` | 字符串 ↔ Command 对象，输出格式化，REPL 循环 | `Tokenizer`、`CommandRegistry`、`builtin-commands`、`CommandDispatcher`、`Renderer`、`HelpText`、`Repl`、显示类命令 `TreeCommand`/`ShowCommand`/`HelpCommand` |

**组件图**：

```
            ┌────────────────────────┐
            │       index.ts         │
            └───────────┬────────────┘
                        │
            ┌───────────▼────────────┐
            │         cli            │
            │  Repl / Tokenizer      │
            │  CommandRegistry       │
            │  CommandDispatcher     │
            │  Renderer / HelpText   │
            │  Tree/Show/HelpCommand │
            └─────┬────────────┬─────┘
                  │            │
         ┌────────▼───┐   ┌────▼─────────┐
         │  commands  │   │     io       │
         │  Command   │   │  SvgReader   │
         │  History   │   │  SvgWriter   │
         │  EditorCtx │   │  IdAssigner  │
         │  16 命令   │   └────┬─────────┘
         └─────┬──────┘        │
               │               │
               └───────┬───────┘
                       │
                ┌──────▼──────┐
                │    core     │
                │ Shape/Rect/ │
                │ Circle/...  │
                │ Group/Doc   │
                │ Factory/IdR │
                └─────────────┘
```

### 2. 设计模式与落地

| 模式 | 落地位置 | 说明 |
|---|---|---|
| **Command**（要求） | `commands/*Command.ts` + `CommandHistory` | 每个编辑命令实现 `execute`/`undo`，类里捕获逆操作所需的最小状态：`CreateCommand` 缓存形状实例（redo 复用）；`DeleteCommand` 缓存 `{shape, parent, index}`；`SetCommand` 缓存旧值；`GroupCommand`/`UngroupCommand` 缓存每个子的原 parent/index。 |
| **Composite** | `core/Group.ts` + `Shape.moveBy`/`scaleFromOrigin`/`setAttribute` | `move`/`scale` 在 Group 内递归到全部子孙；命令层对 g 与叶子走同一套 `Shape` 接口（`ShapeLocator` 返回 `Container` 而非 `Group`）。 |
| **工厂** | `core/ShapeFactory.ts` | 类型名 → 类的映射。**唯一允许的"按名分派①"**，架构方案中标注为待插件化重构点（未来替换为 `ShapeProvider`）。 |
| **注册表分发** | `cli/CommandRegistry.ts` | 命令名 → 构造器的映射。**唯一允许的"按名分派②"**，同样标注为待插件化重构点。 |
| **策略/多态** | `Shape.describePosition`/`describeForTree`/`describeForShow`/`removeAttribute` | 所有"按图形类型有差异"的行为下沉到子类的 override。命令层完全不含 `switch (tag)` 或 `instanceof Rect`。 |

### 3. 依赖方向规则

```
core  ←  io  ←  commands  ←  cli  ←  index
```

| 规则 | 理由 |
|---|---|
| `core` **不得** import `io`/`commands`/`cli` | 领域模型是所有层的底座；反向依赖会把"图形长什么样"和"怎么序列化/怎么被命令改"耦合 |
| `io` **可以** import `core`；**不得** import `commands`/`cli` | 序列化只依赖领域对象的公开接口 |
| `commands` **可以** import `core` + `io`；**不得** import `cli` | 命令层永远不解析字符串、不 print。**例外说明**：显示类命令（`TreeCommand`/`ShowCommand`/`HelpCommand`）本质是渲染输出，因此归属 `cli` 层而非 `commands` 层；`commands` 层保持"数据编辑"职责 |
| `cli` **可以** import `commands` + `io` + `core` | 启动时组装 `EditorContext`、注册命令；`Renderer` 直接读 `core` 结构 |
| `index.ts` 只 import 各层入口 | 组装层 |

**自动化验证**：`src/__arch__/dependency-rules.test.ts` 通过静态扫描源码 import 路径，断言以上规则。任何违反 CI 立刻 fail。

### 4. 变化点假设

| # | 未来最可能变化 | 留没留口子 | 说明 |
|---|---|---|---|
| 1 | **新增图形类型**（`box` 插件、`hexagon` 等） | ✅ 留口子 | `ShapeFactory.register(name, creator, domCreator)` 已抽象；`Shape` 的多态接口就是插件要实现的契约。`box` 已按文档 §4.4 规划好语义，本阶段未实现，在测试里断言 `create box` 报 `unknown shape type` |
| 2 | **新增/变更可编辑属性**（`opacity`、`stroke-dasharray`） | ✅ 留口子 | 每个 `Shape` 自己实现 `setAttribute(name, value)` 白名单；加属性只改一个类 |
| 3 | **SVG 更复杂的语义**（`<g transform>`、`<use>`、CSS class） | ⚠️ **决定本阶段不留** | 读入策略：`transform` 忽略并警告，子节点按原始坐标读入；输出一律扁平坐标。理由：transform 合成语义远超 Phase 1 边界，与其做半吊子不如明确不支持 |
| 4 | **持久化格式扩展**（JSON、YAML） | ✅ 留口子 | `io` 层已按 `SvgReader`/`SvgWriter` 拆开，命令层只通过 `EditorContext.reader/writer` 消费 |
| 5 | **命令语法变化**（别名、批量命令） | ⚠️ **决定本阶段不留** | `Tokenizer` + 命令构造器分离，未来加 alias 表即可；不预先抽 `CommandParser` 抽象类 |
| 6 | **撤销粒度变化**（事务级 undo） | ⚠️ **决定本阶段不留** | `Command` 接口 + `CommandHistory` 已可支持"批量包裹"，本阶段按需求"一条编辑命令 = 一个 undo 单元"即可 |
| 7 | **主数据模型替换**（不可变树、diff/patch） | ⚠️ **决定本阶段不留** | 命令式反向 undo 在 Phase 1 足够；换 diff 会牺牲可读性 |

---

## 二、过程记录

以下按 commit 时间顺序，记录 5 个"发现—确认—纠正"的具体案例。

### 案例 1：`Container` 接口应暴露 `getId`/`getTagName`（P1-C8）

**触发**：实现 `DeleteCommand` 的 `parentLabel()` 时，测试代码 `parent as Shape` 编译失败——`Container` 接口本身不含 `getId`/`getTagName`。

**AI 建议**：类型断言绕过去（`parent as unknown as Shape`）。

**确认与纠正**：这与架构方案的"禁止贫血模型 + 用接口表达语义"冲突。真实语义是"本阶段所有容器都必然是 `Shape` 子类（id 强制唯一）"，因此 `Container` 接口本就该暴露 `getId`/`getTagName`。改接口后编译通过，`Group` 无需改动（`getId`/`getTagName` 已由 `Shape` 提供）。这个补丁在 commit message 里单列为"架构补丁"而非 bug 修复。

### 案例 2：`UngroupCommand` 的测试 setup 写错（P1-C10）

**触发**：`ungroup-command.test.ts` 的"成功路径"第一例失败，实际返回 `cannot ungroup top-level container: g1`。

**确认**：命令代码正确（文档 §4.2 明确要求根级容器不能 ungroup）。**测试 setup 写错**——把 `g1` 直接 `doc.root.add(g)`，成了 svg 的直接子节点。修法：把 `g1` 放进中间容器 `outer`（`outer` 挂 root，`g1` 挂 `outer`），并让 `before`/`after` 兄弟节点也在 `outer` 内，验证"提升到原父容器的原位置"语义。

**纠正后**：测试通过，且验证了"子节点按 g 原位提升：`before, r1, r2, after`"这个更精确的断言。教训：**写命令测试前，先问"这条命令对父容器/层级有什么前提条件"**。

### 案例 3：显示类命令的归属决策（P1-C14）

**触发**：原本想在 `commands/TreeCommand.ts` 里 import `cli/Renderer`。写完发现**违反架构方案的 `commands ← cli` 依赖方向**。

**AI 建议**：把 `Renderer` 挪到 `commands` 层（方案 A）。

**确认与纠正**：`Renderer` 是纯 UI 格式化，逻辑上不属于 `commands`。正确做法是把 `TreeCommand`/`ShowCommand`/`HelpCommand` **整体搬到 `cli/` 层**（方案 B）——它们本质是"渲染输出"，与 `Renderer` 同生命周期，未来插件化时一起迁移；`commands` 层保持"数据编辑"职责。这个决定写入 doc 的"依赖方向规则"表作为例外说明，并由 `dependency-rules.test.ts` 持续守护。

### 案例 4：tree 的对齐规则与"手算空格数"（P1-C14）

**触发**：`renderer.test.ts` 的"无 fill 时不留多余空格"测试失败。期望 9 个空格，实际 8 个。

**确认**：用 `JSON.stringify` 逐字符比对，发现 `└── rect#r1` 是 11 字符，`19 - 11 = 8`。**测试算错了**（原代码正确）。文档 §5.1 的示例里 `rect#bg` 后正好 8 个空格，直接对照验证。

**教训**：所有"对齐到第 N 列"的测试必须用 `JSON.stringify` 的引号包裹形式输出，肉眼数空格不可靠。后续 `e2e-transcript.test.ts` 里 §6.1 的 tree 期望是按 19 列规则**重新计算**的（文档 §6.1 的字面示例其实也是手算的，与 §5.1 的精确定义有出入；我们以 §5.1 为准，并在测试注释里说明）。

### 案例 5：PowerShell 管道下的 `svg> ` 前缀（P1-C15）

**触发**：手工烟测 `npm run cli` 用 here-string 管道输入，输出里出现 `svg> ` 前缀，与"管道模式不应显示提示符"的预期不符。

**确认**：代码正确——`terminal: process.stdin.isTTY === true`。但 **PowerShell + npm + tsx 的多层进程链**把 stdin 包装成"看起来像 TTY"的东西，`isTTY` 误报 `true`。这是环境 quirk 不是代码 bug。且**自动化端到端测试用 `MemoryIO` 完全绕过 `readline`**，不受影响。

**纠正**：不改代码，写入 commit message 的"已知限制"里。若未来要在脚本模式强制无前缀，可加环境变量开关（P1-C17 的候选，本阶段不做）。

---

## 三、一致性自查

对照架构方案**如实回答**（P1-C17 完成时的状态）：

### 问题 1：模块划分——实际目录与方案是否一致？

**一致**。实际 `src/` 下的目录（`core`/`io`/`commands`/`cli`/`__arch__`）与"架构方案 · 模块划分"完全对应。

**修订记录**（与方案初稿的差异及原因）：

| 修订 | 原因 |
|---|---|
| 显示类命令从 `commands/` 迁到 `cli/`（P1-C14） | 见"过程记录 · 案例 3" |
| 新增 `__arch__/` 目录（P1-C17） | 架构约束自动测试，不属于业务代码；`tsconfig.json` 显式排除 |
| `commands/util.ts` 引入（P1-C10） | `parentLabel`/`subtreeContains` 被 3 条命令共用；避免重复 |
| `cli/__test-utils__/MemoryIO.ts` 抽取（P1-C16） | 测试共享工具；`tsconfig.json` 显式排除，不进产物 |

以上修订均在当次 commit message 中单列说明，且回写进本节。

### 问题 2：依赖方向——方案里的规则有没有被违反？

**没有**。`src/__arch__/dependency-rules.test.ts` 静态扫描全部业务源码的 `import ... from` 路径，断言：

- `core` 不 import `io`/`commands`/`cli` ✅
- `io` 不 import `commands`/`cli` ✅
- `commands` 不 import `cli` ✅

同时以"结构性检查"验证"按名分派唯一性"：

- `commands/` 层无 `getTagName() === "..."` 字符串比较 ✅
- `commands/` 层无 `switch` 语句 ✅

抽样人工检查结论与此一致：
- `core/` 只 import 自己（`Shape`/`Group`/`Container` 互相）
- `commands/` 只 import `../core/*` + `../io/*`
- `cli/` 三者都 import，符合规则
- `index.ts` 只 import 各层入口

若未来引入违规，CI 立刻 fail。

---

## 四、质量保证手段

### 1. 单元测试（~283 个，覆盖 24 个源文件）

按模块分布：

| 模块 | 测试文件数 | 覆盖点 |
|---|---|---|
| `core/` | 4 | Shape 六子类的属性/tag/变换、Group 的递归语义、Document/IdRegistry、ShapeFactory 的六种构造与错误分支 |
| `io/` | 3 | SvgWriter 转义与格式、SvgReader 的宽容读取（缺 id/重复 id/未知标签/transform/尺寸回退）、IdAutoAssigner |
| `commands/` | 11 | 16 条命令的成功/错误/undo/redo；CommandHistory 状态机；ShapeLocator |
| `cli/` | 6 | Tokenizer（含 `#` vs `#hex`）、CommandRegistry、builtin-commands、CommandDispatcher、Renderer（含逐字符对齐）、Repl |
| `__arch__/` | 1 | 依赖方向 + 按名分派唯一性 |

### 2. 端到端 transcript 回归（`src/cli/e2e-transcript.test.ts`）

用 `MemoryIO`（内存 mock 的 `ReplIO`）驱动真实 `Repl`，**逐行 `toEqual` 精确断言**：

- **§6 主会话**：21 行输出精确匹配（含 `error: cannot group a container into its own descendant`）
- **save 后 undo 被禁 + read other.svg**：包含 `warning: assigned id rect1 to unnamed <rect>`、tree 的 7 个元素与嵌套 g
- **§6.1 两节点流程图**：9 条 `create` + tree（19 列 pad 重算）
- **§4.2 错误信息全集**：17 行，覆盖 11 种错误码
- **undo/redo 边界**：空栈、undo 后新编辑清空 redo、连续 undo 到底
- **save 不可写**：不 disable history（`save` 失败不影响 undo 能力）
- **save 成功后 redo 被禁**

### 3. 架构约束（`src/__arch__/dependency-rules.test.ts`）

见"一致性自查 · 问题 2"。这是把"方案"变成"可执行断言"的关键手段——不依赖代码 review 的人为记忆。

### 4. 手工烟测清单（每次改动后跑一遍）

1. `npm run build` 无报错
2. `npm test` 全绿（~283 个 test）
3. 交互模式：`npm run cli` → 按文档 §6 逐行输入 → 输出与文档**逐字符一致**
4. 管道模式：`@"..."@ | npm run cli`（PowerShell）/ `printf ... | npm run cli`（bash）→ 无 `svg> ` 前缀（注：PowerShell 下有已知 quirk，见"案例 5"）

### 5. 为什么对代码质量有信心

- 每一行源码都有对应测试；每一轮 commit message 都写清楚"做了什么、为什么、怎么验证"
- 所有"按图形类型差异"的行为都通过 `Shape` 多态实现，`commands/` 层零 `switch`、零 `getTagName() === "..."`（由测试守护）
- 端到端 transcript 用**精确字符串匹配**而非 `toContain`，任何输出格式回退都会 fail
- 架构方案里"允许按名分派"只有两处（`ShapeFactory`/`CommandRegistry`），两处都有单元测试，且 `commands/` 层被自动禁止再引入分派

---

## 五、已知限制

- **`box` 复合图形未实现**：按文档 §4.4，`box` 属于后续插件化阶段的目标类型；本阶段 `create box` 报 `unknown shape type: box (is the plugin loaded?)`（有测试覆盖）。
- **SVG `transform` 属性**：读入时忽略并警告，输出时一律扁平坐标。理由见"变化点假设 #3"。
- **`scale` 的 undo 精度**：使用 `scaleFromOrigin(1/factor)`，存在 ~1e-15 浮点误差（测试用 `toBeCloseTo`）；`factor` 特殊值（如 1/3）无法完全精确逆变换。Phase 1 接受。
- **PowerShell 管道 TTY 差异**：见"过程记录 · 案例 5"。