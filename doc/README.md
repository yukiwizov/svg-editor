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

- **Phase 1 baseline 不包含 `box`**：Phase 2 通过独立 Box 插件实现该复合图形；不加载插件时，`create box` 仍返回 `unknown shape type: box (is the plugin loaded?)`。
- **SVG `transform` 属性**：读入时忽略并警告，输出时一律扁平坐标。理由见"变化点假设 #3"。
- **`scale` 的 undo 精度**：使用 `scaleFromOrigin(1/factor)`，存在 ~1e-15 浮点误差（测试用 `toBeCloseTo`）；`factor` 特殊值（如 1/3）无法完全精确逆变换。Phase 1 接受。
- **PowerShell 管道 TTY 差异**：见"过程记录 · 案例 5"。

---

## Phase 2 — 插件化 CLI 与 VS Code 扩展

### 1. Kernel extension points

| Extension point | Contract | Registration API | Implementation |
|---|---|---|---|
| ShapeProvider | src/core/ShapeProvider.ts | ShapeFactory.registerProvider | src/plugins/shapes/builtin-providers.ts（rect/circle/ellipse/line/text/g）；src/plugins/box |
| Command | src/commands/Command.ts | CommandRegistry.register | src/plugins/commands/stats-plugin/plugin.ts、dir-plugin/plugin.ts |
| TreeDecorator | src/core/TreeDecorator.ts | PluginHost.registerDecorator | src/plugins/tree-star、src/plugins/box-tree |
| AttributeHandler | src/commands/AttributeHandler.ts | PluginHost.registerAttribute | src/plugins/box/BoxAttributeHandler.ts |

内核的 ShapeFactory 只依赖 ShapeProvider 接口，不直接 import 六种具体图形类。默认组装由 src/plugins/shapes/plugin.ts 提供六种 Phase 1 图形；Phase 1 命令仍由 CLI 默认注册。可选插件禁用或配置文件缺失时，默认 CLI 仍可启动。

### 2. Plugin registration

- PluginManifest 在 src/plugins/PluginHost.ts 定义，必须提供稳定 name、contributes 和 activate。
- PluginHost.activate 为每个插件创建独立暂存上下文；先核对实际暂存项与 manifest，再提交到 live registries。激活失败或 manifest 不匹配时不产生部分注册。
- 多个 AttributeHandler 命中同一属性时，按插件注册顺序采用第一个 handler；handles 必须只判断、不修改状态。
- AttributeHandler 的 capture/apply/restore 提供 memento 事务。handler 抛错或返回非成功结果时恢复原状态；成功的 set 命令作为一个 Phase 1 undo 单元。
- plugins.config.json 的模块路径相对配置文件解析；包名按 Node 模块解析；enabled:false 跳过；options 原样传入 activate。插件包的 package.json contributes 是配置装配的声明来源，并与实际注册集合做精确比对；A 装配则使用 PluginManifest 内的 contributes。

### 3. Assembly A / B

A 是显式代码组合，入口 src/plugins/assembleA.ts；B 是配置组合，入口 plugins.config.json。两者的插件顺序一致：box、modified-star、box-tree、stats、dir；两者都先由入口注册六个默认 ShapeProvider。src/plugins/assembly.test.ts 比较两者的贡献集合与 CLI 会话输出。

~~~bash
# A — code composition
SVG_EDITOR_PLUGIN_ASSEMBLY=A npm run cli

# B — configuration composition (default)
npm run cli
~~~

PowerShell：

~~~powershell
$env:SVG_EDITOR_PLUGIN_ASSEMBLY = "A"
npm run cli
Remove-Item Env:SVG_EDITOR_PLUGIN_ASSEMBLY
~~~

### 4. Box semantics and ADRs

Box 是一个带 data-kind="box" 的 SVG g，固定包含 rect#<id>-rect 和 text#<id>-label。对 Box 的 move/scale/delete 作用于整个复合对象；set <boxId> fill <value> 与 set <boxId> label <value> 由 AttributeHandler 转发。子节点是结构必需项，不允许单独 move/scale/set/delete/reorder/group；Box 不允许 addto，也不能 ungroup。

- [ADR-001 AttributeHandler 事务与冲突策略](../docs/adr/0001-attribute-handler-transaction.md)
- [ADR-002 Box SVG 读取策略](../docs/adr/0002-box-svg-read-policy.md)
- [ADR-003 modified-star 脏状态语义](../docs/adr/0003-modified-star-dirty-state.md)
- [ADR-004 插件 manifest 校验时机](../docs/adr/0004-plugin-manifest-validation.md)

### 5. dir adapter

DirCommand 只依赖 DirectoryAdapter，读取进程的 cwd()，不读取 SVG 文件路径，也不改文档或历史。生产适配器使用 Node fs.readdirSync(..., { withFileTypes: true })；测试可注入内存适配器。只输出普通文件和目录，隐藏文件包含在内；符号链接及 socket/device 等特殊 Dirent（既非 file 也非 directory）不显示。目录优先，其次文件，名称按升序排列。

### 6. VS Code extension

扩展源码在 vscode-extension/，不改 SVG 文件名或内容：
- Explorer 的 SVG 文件显示 [] decoration；
- Outline 由 DocumentSymbolProvider 提供，按嵌套结构显示 tag 或 tag#id；
- 点击 symbol 使用 VS Code 原生 Outline 导航定位源代码；
- 文档编辑时 VS Code 重新请求 symbols；不完整或标签不匹配的 XML 返回空 Outline，不向宿主抛异常。

开发运行：在 VS Code 打开 vscode-extension/，执行 npm install、npm run compile，按 F5 启动 Extension Development Host，再打开含 SVG 的工作区。扩展与 CLI 内核分离：VS Code API 属于 host；Outline scanner 和 decoration provider 属于 extension adapter。CLI 的 ShapeProvider/Command/TreeDecorator/AttributeHandler 与 VS Code API 没有运行时依赖。

### 7. Metrics

执行 npm run metrics，脚本从 Git 的 final tag 与当前 HEAD 读取文件清单、行数和简单复杂度代理指标，生成 docs/metrics/phase2.md。Phase 2 validation workflow 会将报告上传为 phase2-metrics artifact。复杂度值是基于分支/循环/逻辑运算符的静态近似值，不等同于完整 AST cyclomatic complexity。


### 8. CI 验证

`.github/workflows/phase2.yml` 在 `phase2` 分支 push / PR 时运行：CLI 的 `npm ci`、`npm run build`、`npm test`、`npm run metrics`，以及 VS Code 扩展的 `npm install`、`npm run compile`。Metrics 作为 `phase2-metrics` workflow artifact 保存。


---

## Phase 2 补充：逐项验收说明与架构对比

### 9. 四个扩展点的契约、调用位置与缺省行为

下表按当前实现列出接口、内核调用点、插件实现和缺省行为。这里的“缺省”指禁用相应可选插件时的行为；六种 Phase 1 图形仍由默认 shapes 插件注册。

| 扩展点 | 内核契约与注册入口 | 内核调用位置 | Phase 2 实现 | 禁用可选插件时的行为 | 契约/注册失败处理 |
|---|---|---|---|---|---|
| `ShapeProvider` | `src/core/ShapeProvider.ts`；`ShapeFactory.registerProvider()` | `src/core/ShapeFactory.ts` 的 `create()`、`createFromDom()` | 六种内置 provider：`src/plugins/shapes/builtin-providers.ts`；Box：`src/plugins/box/` | 六种内置图形仍可创建和读回；未加载 Box 时创建 box 返回 `unknown shape type: box (is the plugin loaded?)` | 重复名称拒绝注册；缺少 SVG 读回能力时明确报 `shape provider <name> cannot import SVG` |
| `Command` | `src/commands/Command.ts`；命令构建器注册于 `src/cli/CommandRegistry.ts` | `CommandRegistry.build()` 查找构建器；`src/cli/CommandDispatcher.ts` 分发执行 | `src/plugins/commands/stats-plugin/plugin.ts`、`dir-plugin/plugin.ts` | 未加载 stats/dir 时对应命令按未知命令处理；Phase 1 内置命令不受影响 | 重复命令名在 PluginHost 暂存阶段拒绝；未注册命令由 Dispatcher 报未知命令 |
| `TreeDecorator` | `src/core/TreeDecorator.ts`；`PluginHost.registerDecorator()` | `src/cli/Renderer.ts` 的 `renderTree()`、`nodeLine()` 调用 `decorate()` | `src/plugins/tree-star/plugin.ts`、`src/plugins/box-tree/plugin.ts` | 不注册可选 decorator 时不追加标签，Phase 1 tree 基线格式保持不变 | 重复 decorator 名称在 PluginHost 暂存阶段拒绝；单个 decorator 返回 `undefined` 表示该行不追加标签 |
| `AttributeHandler` | `src/commands/AttributeHandler.ts`；`PluginHost.registerAttribute()` | `src/commands/SetCommand.ts` 的 `execute()`、`undo()` | `src/plugins/box/BoxAttributeHandler.ts` | 无 handler 命中时回退到 Shape 原有属性规则；不允许的属性返回 `unknown attribute: <attr>` | handler 先 capture，再 apply；抛错或非成功结果时 restore；失败不进入 undo history；多个 handler 命中时按注册顺序选择第一个 |

插件宿主与加载器的关键位置：

- `src/plugins/PluginHost.ts`：`PluginManifest`、`PluginContext`、`PluginHost.activate()`。每个插件先在独立 staging context 中注册；声明与实际注册集合完全匹配后才提交到 live registries。
- `src/plugins/PluginLoader.ts`：`loadConfiguredPlugins()`。负责读取配置、解析模块路径、加载默认导出、传递 options，并把错误转换为稳定的 `error:` 消息。
- `src/plugins/assembleA.ts`：`activateAssemblyA()`，显式代码装配入口。
- `src/index.ts`：composition root，先注册六种默认图形，再按环境变量选择 A 或 B。
- `plugins.config.json`：B 方式的配置清单。相对模块路径以配置文件目录为基准，`enabled: false` 跳过，`options` 传给插件 activate。

### 10. 插件装配 A/B 的流程

**方式 A（代码装配）**：`src/index.ts` → `activateAssemblyA()` → `PluginHost.activate()` → staging → manifest 校验 → commit 到注册表。

**方式 B（配置装配）**：`src/index.ts` → `loadConfiguredPlugins()` → 解析 `plugins.config.json` → 加载插件默认导出 → `PluginHost.activate()` → staging → package contributes 校验 → commit 到注册表。

A/B 最终共用同一个 PluginHost 注册和校验路径；两种方式的插件顺序在代码与配置中保持一致。对应的自动化对照测试为 `src/plugins/assembly.test.ts`。

### 11. Phase 1 → Phase 2 架构变化

PlantUML 源文件：[`docs/architecture/phase1-phase2.puml`](../docs/architecture/phase1-phase2.puml)。

- **Phase 1**：`index` 负责组装 CLI；CLI 直接使用 ShapeFactory 与 CommandRegistry 的具体注册能力；core、io、commands、cli 形成分层结构。
- **Phase 2**：在 core/commands/cli 的边界增加 `ShapeProvider`、`Command`、`TreeDecorator`、`AttributeHandler` 契约；插件实现放入 `src/plugins/`；PluginHost 负责暂存、校验和注册；PluginLoader 负责配置装配。
- **VS Code 扩展**独立位于 `vscode-extension/`，通过 VS Code API 适配 Explorer decoration 和 DocumentSymbol Outline；它不依赖 CLI 内核，也不与 CLI 插件宿主共用运行时。

### 12. VS Code 与经典 Decorator / Adapter 的关系

VS Code 的 Explorer 装饰和 Outline provider 都是面向宿主 API 的适配层：

- **Adapter 对应关系**：`SvgDecorationProvider` 把“是否为 SVG 文件”映射成 VS Code 的 `FileDecoration`；`parseSvgOutline` 把 SVG/XML 文本结构映射成 VS Code 的 `DocumentSymbol` 树。它们把项目内部数据转换成宿主要求的接口和对象。
- **与经典 Decorator 模式的差异**：经典 GoF Decorator 通常包装一个组件对象，并在保持同一接口的同时动态叠加职责；这里的 Explorer decoration 是 VS Code 的 provider/贡献 API，不包装文件对象，也不改变文件对象的行为。名称中的 “FileDecoration” 不等于 GoF Decorator 模式。
- **与 Adapter 模式的对应**：扩展实现 VS Code 定义的接口，由 VS Code 在需要时回调；扩展把 URI/文本文档转换为宿主可显示的数据。这更接近 Adapter（同时也是 VS Code extension contribution/provider 机制），不是把 CLI 的 TreeDecorator 直接搬进 VS Code。
- **Phase 1 复用评估**：可复用的是 SVG 的领域概念、标签名/id 语义和嵌套结构理解；CLI 的 Shape/Document 模型和 SvgReader 面向 Phase 1 支持的 SVG 子集及编辑语义，而 Outline 需要保留源文件位置并容忍编辑中的不完整文本，因此当前实现独立扫描文本并生成 VS Code DocumentSymbol，不直接复用 CLI Document 模型。CLI 的 TreeDecorator 也不是 VS Code Outline provider 的替代品。

### 13. Phase 2 的 AI 协作检查与修正记录

本节记录可由代码、测试或 Git 状态复核的协作检查；不把未经验证的 AI 建议写成已采纳的事实。

| 检查主题 | AI 协作检查 | 核验依据 / 修正动作 |
|---|---|---|
| 目录职责 | 检查文档是否会把 CLI 插件目录误称为 VS Code 扩展 | 明确区分 `src/plugins/`（CLI 插件）与 `vscode-extension/`（VS Code 扩展），两者不合并 |
| 扩展点说明 | 检查 README 是否只列接口名称而缺少调用点和缺省行为 | 增补本节扩展点表，逐项列出接口、调用位置、实现、缺省行为和错误处理；可按源码路径复核 |
| 架构演进 | 检查是否有 Phase 1 与 Phase 2 的可视化依赖对比 | 增加 PlantUML 源文件，图中区分 CLI 插件宿主和独立 VS Code 扩展 |
| Metrics 新鲜度 | 检查报告快照与最终交付分支是否一致 | `docs/metrics/phase2.md` 的 measured HEAD 为 `3df748b9...`，报告记录 39 个 Phase 1 baseline 之后的提交；后续 `d556ea1` 仅刷新报告，`b1c19f1` 仅加入 VS Code 截图，均未修改 `src/`。因此模块文件数、行数与复杂度统计仍对应最终源码；报告的 Git 历史快照明确截止于 `3df748b9`，不把生成报告自身及后续纯文档提交计入。 |

### 14. 测试与验证材料索引

测试源码直接随仓库提交，按主题索引见 [`docs/validation/phase2.md`](../docs/validation/phase2.md)。VS Code Extension Development Host 的四项人工验收截图已归档于 `docs/images/`，并在验证索引中逐项嵌入：Explorer 文件装饰、嵌套 Outline 与源码定位、编辑后的实时更新，以及无效 XML 的安全处理。

