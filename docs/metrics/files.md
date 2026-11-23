# CLI 文件清单与职责（基准: `final`，当前 HEAD: `1252ff6`）

> 由 `scripts/collect-metrics.ts` 自动生成，排除 `node_modules/`、`dist/`、`vscode-svg-extension/` 与 `docs/`。

| 文件路径 | 分类 | 行数 | 圈复杂度 | 职责 |
|---|---:|---:|---:|---|
| `.gitignore` | 内核 | 4 | 0 | 项目配置/源码文件 |
| `doc/README.md` | 内核 | 243 | 0 | 项目配置/源码文件 |
| `package.json` | 内核 | 14 | 0 | 项目配置/源码文件 |
| `scripts/collect-metrics.ts` | 内核 | 334 | 93 | 项目配置/源码文件 |
| `src/__arch__/dependency-rules.test.ts` | 内核 | 148 | 34 | 单元测试：dependency-rules |
| `src/cli/CommandDispatcher.ts` | 内核 | 41 | 7 | 命令行分发与执行协调 |
| `src/cli/CommandRegistry.ts` | 内核 | 44 | 5 | 命令注册表 |
| `src/cli/HelpCommand.ts` | 内核 | 13 | 1 | 帮助信息命令 |
| `src/cli/HelpText.ts` | 内核 | 33 | 0 | 帮助文案生成 |
| `src/cli/Renderer.ts` | 内核 | 90 | 16 | 文档与结构树文本渲染器 |
| `src/cli/Repl.ts` | 内核 | 52 | 6 | 交互式/管道 REPL 主循环 |
| `src/cli/ShowCommand.ts` | 内核 | 22 | 3 | 图形详情查看命令 |
| `src/cli/Tokenizer.ts` | 内核 | 69 | 21 | 命令行词法切分与引号处理 |
| `src/cli/TreeCommand.ts` | 内核 | 26 | 4 | 结构树查看命令 |
| `src/cli/__test-utils__/MemoryIO.ts` | 内核 | 21 | 3 | CLI 交互与渲染组件（MemoryIO） |
| `src/cli/builtin-commands.test.ts` | 内核 | 80 | 16 | 单元测试：builtin-commands |
| `src/cli/builtin-commands.ts` | 内核 | 142 | 44 | Phase 1 内置命令注册 |
| `src/cli/command-dispatcher.test.ts` | 内核 | 135 | 18 | 单元测试：command-dispatcher |
| `src/cli/command-registry.test.ts` | 内核 | 48 | 14 | 单元测试：command-registry |
| `src/cli/e2e-transcript.test.ts` | 内核 | 357 | 17 | 单元测试：e2e-transcript |
| `src/cli/renderer.test.ts` | 内核 | 130 | 17 | 单元测试：renderer |
| `src/cli/repl.test.ts` | 内核 | 159 | 26 | 单元测试：repl |
| `src/cli/tokenizer.test.ts` | 内核 | 101 | 22 | 单元测试：tokenizer |
| `src/cli/tree-show-help.test.ts` | 内核 | 71 | 13 | 单元测试：tree-show-help |
| `src/commands/AddToCommand.ts` | 内核 | 104 | 13 | 编辑/文档/历史命令与上下文（AddToCommand） |
| `src/commands/BackCommand.ts` | 内核 | 58 | 8 | 编辑/文档/历史命令与上下文（BackCommand） |
| `src/commands/CanvasCommand.ts` | 内核 | 50 | 10 | 编辑/文档/历史命令与上下文（CanvasCommand） |
| `src/commands/Command.ts` | 内核 | 47 | 2 | 编辑/文档/历史命令与上下文（Command） |
| `src/commands/CommandHistory.ts` | 内核 | 95 | 16 | 编辑/文档/历史命令与上下文（CommandHistory） |
| `src/commands/CommandResult.ts` | 内核 | 23 | 3 | 编辑/文档/历史命令与上下文（CommandResult） |
| `src/commands/CreateCommand.ts` | 内核 | 92 | 14 | 编辑/文档/历史命令与上下文（CreateCommand） |
| `src/commands/DeleteCommand.ts` | 内核 | 53 | 6 | 编辑/文档/历史命令与上下文（DeleteCommand） |
| `src/commands/EditorContext.ts` | 内核 | 34 | 0 | 编辑/文档/历史命令与上下文（EditorContext） |
| `src/commands/FrontCommand.ts` | 内核 | 61 | 8 | 编辑/文档/历史命令与上下文（FrontCommand） |
| `src/commands/GroupCommand.ts` | 内核 | 125 | 20 | 编辑/文档/历史命令与上下文（GroupCommand） |
| `src/commands/InitCommand.ts` | 内核 | 40 | 7 | 编辑/文档/历史命令与上下文（InitCommand） |
| `src/commands/MoveCommand.ts` | 内核 | 72 | 12 | 编辑/文档/历史命令与上下文（MoveCommand） |
| `src/commands/ReadCommand.ts` | 内核 | 43 | 4 | 编辑/文档/历史命令与上下文（ReadCommand） |
| `src/commands/RedoCommand.ts` | 内核 | 15 | 1 | 编辑/文档/历史命令与上下文（RedoCommand） |
| `src/commands/SaveCommand.ts` | 内核 | 35 | 5 | 编辑/文档/历史命令与上下文（SaveCommand） |
| `src/commands/ScaleCommand.ts` | 内核 | 57 | 8 | 编辑/文档/历史命令与上下文（ScaleCommand） |
| `src/commands/SetCommand.ts` | 内核 | 79 | 13 | 编辑/文档/历史命令与上下文（SetCommand） |
| `src/commands/ShapeLocator.ts` | 内核 | 35 | 6 | 编辑/文档/历史命令与上下文（ShapeLocator） |
| `src/commands/UndoCommand.ts` | 内核 | 16 | 1 | 编辑/文档/历史命令与上下文（UndoCommand） |
| `src/commands/UngroupCommand.ts` | 内核 | 104 | 13 | 编辑/文档/历史命令与上下文（UngroupCommand） |
| `src/commands/addto-command.test.ts` | 内核 | 125 | 18 | 单元测试：addto-command |
| `src/commands/back-command.test.ts` | 内核 | 123 | 23 | 单元测试：back-command |
| `src/commands/command-history.test.ts` | 内核 | 148 | 19 | 单元测试：command-history |
| `src/commands/create-command.test.ts` | 内核 | 124 | 19 | 单元测试：create-command |
| `src/commands/delete-command.test.ts` | 内核 | 116 | 17 | 单元测试：delete-command |
| `src/commands/document-commands.test.ts` | 内核 | 252 | 34 | 单元测试：document-commands |
| `src/commands/front-command.test.ts` | 内核 | 131 | 24 | 单元测试：front-command |
| `src/commands/group-command.test.ts` | 内核 | 135 | 17 | 单元测试：group-command |
| `src/commands/move-command.test.ts` | 内核 | 116 | 17 | 单元测试：move-command |
| `src/commands/scale-command.test.ts` | 内核 | 105 | 15 | 单元测试：scale-command |
| `src/commands/set-command.test.ts` | 内核 | 120 | 16 | 单元测试：set-command |
| `src/commands/shape-locator.test.ts` | 内核 | 56 | 6 | 单元测试：shape-locator |
| `src/commands/ungroup-command.test.ts` | 内核 | 119 | 16 | 单元测试：ungroup-command |
| `src/commands/util.test.ts` | 内核 | 38 | 6 | 单元测试：util |
| `src/commands/util.ts` | 内核 | 26 | 7 | 编辑/文档/历史命令与上下文（util） |
| `src/core/Circle.ts` | 内核 | 54 | 18 | 核心领域模型与注册/工厂（Circle） |
| `src/core/Container.ts` | 内核 | 41 | 1 | 核心领域模型与注册/工厂（Container） |
| `src/core/Document.ts` | 内核 | 57 | 9 | 核心领域模型与注册/工厂（Document） |
| `src/core/Ellipse.ts` | 内核 | 59 | 21 | 核心领域模型与注册/工厂（Ellipse） |
| `src/core/Group.ts` | 内核 | 51 | 15 | 核心领域模型与注册/工厂（Group） |
| `src/core/IdRegistry.ts` | 内核 | 32 | 6 | 核心领域模型与注册/工厂（IdRegistry） |
| `src/core/Line.ts` | 内核 | 62 | 21 | 核心领域模型与注册/工厂（Line） |
| `src/core/Rect.ts` | 内核 | 66 | 21 | 核心领域模型与注册/工厂（Rect） |
| `src/core/Shape.ts` | 内核 | 114 | 34 | 核心领域模型与注册/工厂（Shape） |
| `src/core/ShapeFactory.ts` | 内核 | 221 | 60 | 核心领域模型与注册/工厂（ShapeFactory） |
| `src/core/TextShape.ts` | 内核 | 57 | 18 | 核心领域模型与注册/工厂（TextShape） |
| `src/core/group.test.ts` | 内核 | 102 | 18 | 单元测试：group |
| `src/core/shape-factory.test.ts` | 内核 | 109 | 20 | 单元测试：shape-factory |
| `src/core/shapes.test.ts` | 内核 | 93 | 14 | 单元测试：shapes |
| `src/index.ts` | 装配处 | 47 | 6 | CLI 进程入口、Readline IO 适配与启动装配 |
| `src/io/IdAutoAssigner.ts` | 内核 | 36 | 4 | SVG 序列化/反序列化与 ID 分配（IdAutoAssigner） |
| `src/io/SvgReader.ts` | 内核 | 163 | 41 | SVG 序列化/反序列化与 ID 分配（SvgReader） |
| `src/io/SvgWriter.ts` | 内核 | 85 | 13 | SVG 序列化/反序列化与 ID 分配（SvgWriter） |
| `src/io/id-auto-assigner.test.ts` | 内核 | 36 | 6 | 单元测试：id-auto-assigner |
| `src/io/svg-reader.test.ts` | 内核 | 171 | 29 | 单元测试：svg-reader |
| `src/io/svg-writer.test.ts` | 内核 | 121 | 15 | 单元测试：svg-writer |
| `src/smoke.test.ts` | 内核 | 7 | 2 | 单元测试：smoke |
| `tsconfig.json` | 内核 | 17 | 0 | 项目配置/源码文件 |
| `vitest.config.ts` | 内核 | 7 | 0 | 项目配置/源码文件 |
