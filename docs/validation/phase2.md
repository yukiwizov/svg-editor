# Phase 2 测试与验证材料索引

本文件是测试证据导航，不替代测试代码。可复现的自动化验证由仓库中的 Vitest 测试和 GitHub Actions 完成；VS Code UI 行为由 Extension Development Host 人工验收。

## 1. 自动化测试位置

| 验收主题 | 测试文件 | 覆盖内容 |
|---|---|---|
| 架构依赖约束 | `src/__arch__/dependency-rules.test.ts` | 内核/上层依赖方向和结构约束 |
| dir 命令 | `src/cli/DirCommand.test.ts` | 测试替身、目录优先、文件排序、隐藏项、空目录、读取失败、真实临时目录适配器 |
| stats 命令 | `src/cli/StatsCommand.test.ts` | 空文档、DFS 叶子计数、容器计数 |
| TreeDecorator | `src/cli/TreeDecorator.test.ts` | decorator 输出与树渲染 |
| PluginHost | `src/plugins/PluginHost.test.ts` | manifest 不匹配、重复注册、暂存失败不残留 |
| PluginLoader | `src/plugins/PluginLoader.test.ts` | 模块缺失、无 default export、模块求值/依赖失败、配置错误、激活失败回滚 |
| A/B 装配一致性 | `src/plugins/assembly.test.ts` | 两种装配的贡献集合与命令会话输出一致 |
| Box Composite | `src/plugins/box/box.test.ts` | box 结构、属性、组合不变量和相关行为 |
| CLI 端到端 | `src/cli/e2e-transcript.test.ts` | 命令会话与输出回归 |
| VS Code 扩展 | `vscode-extension/src/extension.ts`、`svgOutline.ts` | 扩展入口、Explorer decoration、Outline parser；构建由 TypeScript 编译验证 |

## 2. 本地复现命令

在仓库根目录运行：

```powershell
npm ci
npm run build
npm test
npm run metrics
```

在 VS Code 扩展目录运行：

```powershell
cd vscode-extension
npm install
npm run compile
```

随后在 VS Code 中打开 `vscode-extension/` 并按 F5，启动 Extension Development Host。

## 3. CI 记录

Phase 2 validation workflow：

https://github.com/yukiwizov/svg-editor/actions/runs/45374607891

该次 run 的 CLI 与 vscode-extension jobs 均成功。CI 自动执行 CLI 安装、构建、测试、metrics，以及扩展依赖安装和 TypeScript 编译；Explorer/Outline 的实际交互仍需人工截图证明。

## 4. VS Code 人工验收截图

请把真实运行截图放在 `docs/images/`，建议命名如下：

- `vscode-svg-badge.png`：Explorer 中 SVG 文件有 `[]`，普通文件和目录无标记。
- `vscode-svg-outline.png`：Outline 展示嵌套层级，点击节点后源码对应位置高亮。
- `vscode-svg-update.png`：编辑元素 id 后 Outline 同步更新。
- `vscode-svg-invalid-xml.png`：不完整 XML 不导致扩展崩溃，Outline 安全清空。

截图要求：来自真实 Extension Development Host；尽量同时显示 Outline 与编辑器；保留文件名、节点 label 和相关源码；不要使用拼接或绘制的效果图。

截图添加后，在本节下方补充 Markdown 图片链接。当前仓库树尚未包含这些截图文件。
