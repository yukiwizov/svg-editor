# Phase 2 扩展开发与验证说明

## 四大扩展点
- **ShapeProvider**：注册图形类型与创建/属性校验逻辑（如内置 6 种图形及扩展示例 `star`）。
- **CliCommand**：注册 CLI 命令及执行逻辑（如 `add`、`set`、`tree`、`help` 及扩展示例 `count`）。
- **TreeDecorator**：对树节点进行展示装饰（如 `id-badge-decorator`）。
- **AttributeHandler**：针对特定属性解析与写入（如 `opacity-handler`）。

## 验证截图
- `images/badge.png`：资源管理器中 `.svg` 文件显示 `[]` 标记，非 `.svg` 与文件夹无标记。
- `images/outline.png`：打开 SVG 源码时大纲树与源码跳转状态。