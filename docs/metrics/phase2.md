# Generated Phase 2 metrics

- Baseline tag: 1252ff61d90b3a841d91cb4b44dc2afd4a988708
- Measured HEAD: ef29e4ff9d720c3c959c28f848eaa2b75623751e
- Commits after baseline: 37

## Module inventory

| Module | Files | Lines | Complexity proxy |
|---|---:|---:|---:|
| architecture-tests | 1 | 148 | 23 |
| assembly | 3 | 159 | 46 |
| kernel-cli | 26 | 1790 | 104 |
| kernel-commands | 37 | 3051 | 194 |
| kernel-core | 16 | 951 | 90 |
| kernel-io | 6 | 625 | 68 |
| other | 1 | 7 | 0 |
| plugins | 17 | 694 | 136 |
| test-support | 1 | 13 | 1 |

## Complexity comparison

- Phase 1 baseline complexity proxy: 452
- Current complexity proxy: 662
- Delta: 210

Proxy counts if/for/while/case/catch, &&, || and conditional operators after stripping comments and quoted strings. It is a reproducible trend indicator, not an AST cyclomatic-complexity score.

## File inventory

| File | Responsibility | Lines | Complexity proxy |
|---|---|---:|---:|
| src/__arch__/dependency-rules.test.ts | Architecture regression checks | 148 | 23 |
| src/__test-utils__/testContext.ts | Shared test fixtures | 13 | 1 |
| src/cli/CommandDispatcher.ts | REPL, command registry, rendering and display commands | 41 | 6 |
| src/cli/CommandRegistry.ts | REPL, command registry, rendering and display commands | 46 | 1 |
| src/cli/DirCommand.test.ts | REPL, command registry, rendering and display commands | 49 | 0 |
| src/cli/DirCommand.ts | REPL, command registry, rendering and display commands | 28 | 8 |
| src/cli/DirectoryAdapter.ts | REPL, command registry, rendering and display commands | 20 | 0 |
| src/cli/HelpCommand.ts | REPL, command registry, rendering and display commands | 13 | 0 |
| src/cli/HelpText.ts | REPL, command registry, rendering and display commands | 35 | 0 |
| src/cli/Renderer.ts | REPL, command registry, rendering and display commands | 47 | 11 |
| src/cli/Repl.ts | REPL, command registry, rendering and display commands | 52 | 5 |
| src/cli/ShowCommand.ts | REPL, command registry, rendering and display commands | 22 | 2 |
| src/cli/StatsCommand.test.ts | REPL, command registry, rendering and display commands | 29 | 0 |
| src/cli/StatsCommand.ts | REPL, command registry, rendering and display commands | 37 | 10 |
| src/cli/Tokenizer.ts | REPL, command registry, rendering and display commands | 69 | 20 |
| src/cli/TreeCommand.ts | REPL, command registry, rendering and display commands | 17 | 3 |
| src/cli/TreeDecorator.test.ts | REPL, command registry, rendering and display commands | 34 | 1 |
| src/cli/TreeDecorator.ts | REPL, command registry, rendering and display commands | 1 | 0 |
| src/cli/__test-utils__/MemoryIO.ts | REPL, command registry, rendering and display commands | 21 | 1 |
| src/cli/builtin-commands.test.ts | REPL, command registry, rendering and display commands | 80 | 2 |
| src/cli/builtin-commands.ts | REPL, command registry, rendering and display commands | 142 | 30 |
| src/cli/command-dispatcher.test.ts | REPL, command registry, rendering and display commands | 136 | 0 |
| src/cli/command-registry.test.ts | REPL, command registry, rendering and display commands | 48 | 1 |
| src/cli/e2e-transcript.test.ts | REPL, command registry, rendering and display commands | 358 | 2 |
| src/cli/renderer.test.ts | REPL, command registry, rendering and display commands | 130 | 0 |
| src/cli/repl.test.ts | REPL, command registry, rendering and display commands | 163 | 0 |
| src/cli/tokenizer.test.ts | REPL, command registry, rendering and display commands | 101 | 0 |
| src/cli/tree-show-help.test.ts | REPL, command registry, rendering and display commands | 71 | 1 |
| src/commands/AddToCommand.ts | Editing commands, undo history and attribute transactions | 106 | 14 |
| src/commands/AttributeHandler.ts | Editing commands, undo history and attribute transactions | 13 | 0 |
| src/commands/BackCommand.ts | Editing commands, undo history and attribute transactions | 59 | 7 |
| src/commands/CanvasCommand.ts | Editing commands, undo history and attribute transactions | 50 | 11 |
| src/commands/Command.ts | Editing commands, undo history and attribute transactions | 47 | 1 |
| src/commands/CommandHistory.ts | Editing commands, undo history and attribute transactions | 95 | 8 |
| src/commands/CommandResult.ts | Editing commands, undo history and attribute transactions | 23 | 1 |
| src/commands/CreateCommand.ts | Editing commands, undo history and attribute transactions | 101 | 21 |
| src/commands/DeleteCommand.ts | Editing commands, undo history and attribute transactions | 54 | 5 |
| src/commands/EditorContext.ts | Editing commands, undo history and attribute transactions | 63 | 4 |
| src/commands/FrontCommand.ts | Editing commands, undo history and attribute transactions | 62 | 7 |
| src/commands/GroupCommand.ts | Editing commands, undo history and attribute transactions | 126 | 19 |
| src/commands/InitCommand.ts | Editing commands, undo history and attribute transactions | 41 | 8 |
| src/commands/MoveCommand.ts | Editing commands, undo history and attribute transactions | 73 | 16 |
| src/commands/ReadCommand.ts | Editing commands, undo history and attribute transactions | 44 | 2 |
| src/commands/RedoCommand.ts | Editing commands, undo history and attribute transactions | 15 | 0 |
| src/commands/SaveCommand.ts | Editing commands, undo history and attribute transactions | 36 | 5 |
| src/commands/ScaleCommand.ts | Editing commands, undo history and attribute transactions | 58 | 10 |
| src/commands/SetCommand.ts | Editing commands, undo history and attribute transactions | 80 | 25 |
| src/commands/ShapeLocator.ts | Editing commands, undo history and attribute transactions | 39 | 7 |
| src/commands/UndoCommand.ts | Editing commands, undo history and attribute transactions | 16 | 0 |
| src/commands/UngroupCommand.ts | Editing commands, undo history and attribute transactions | 105 | 12 |
| src/commands/addto-command.test.ts | Editing commands, undo history and attribute transactions | 126 | 0 |
| src/commands/back-command.test.ts | Editing commands, undo history and attribute transactions | 124 | 0 |
| src/commands/command-history.test.ts | Editing commands, undo history and attribute transactions | 148 | 0 |
| src/commands/create-command.test.ts | Editing commands, undo history and attribute transactions | 125 | 0 |
| src/commands/delete-command.test.ts | Editing commands, undo history and attribute transactions | 117 | 0 |
| src/commands/document-commands.test.ts | Editing commands, undo history and attribute transactions | 253 | 2 |
| src/commands/front-command.test.ts | Editing commands, undo history and attribute transactions | 132 | 0 |
| src/commands/group-command.test.ts | Editing commands, undo history and attribute transactions | 136 | 0 |
| src/commands/move-command.test.ts | Editing commands, undo history and attribute transactions | 117 | 2 |
| src/commands/scale-command.test.ts | Editing commands, undo history and attribute transactions | 106 | 1 |
| src/commands/set-command.test.ts | Editing commands, undo history and attribute transactions | 121 | 1 |
| src/commands/shape-locator.test.ts | Editing commands, undo history and attribute transactions | 56 | 0 |
| src/commands/ungroup-command.test.ts | Editing commands, undo history and attribute transactions | 120 | 0 |
| src/commands/util.test.ts | Editing commands, undo history and attribute transactions | 38 | 0 |
| src/commands/util.ts | Editing commands, undo history and attribute transactions | 26 | 5 |
| src/core/Circle.ts | Domain model, shape/container contracts and registries | 54 | 8 |
| src/core/Container.ts | Domain model, shape/container contracts and registries | 45 | 2 |
| src/core/Document.ts | Domain model, shape/container contracts and registries | 57 | 6 |
| src/core/Ellipse.ts | Domain model, shape/container contracts and registries | 59 | 10 |
| src/core/Group.ts | Domain model, shape/container contracts and registries | 51 | 2 |
| src/core/IdRegistry.ts | Domain model, shape/container contracts and registries | 32 | 1 |
| src/core/Line.ts | Domain model, shape/container contracts and registries | 62 | 10 |
| src/core/Rect.ts | Domain model, shape/container contracts and registries | 66 | 10 |
| src/core/Shape.ts | Domain model, shape/container contracts and registries | 117 | 20 |
| src/core/ShapeFactory.ts | Domain model, shape/container contracts and registries | 32 | 7 |
| src/core/ShapeProvider.ts | Domain model, shape/container contracts and registries | 8 | 2 |
| src/core/TextShape.ts | Domain model, shape/container contracts and registries | 57 | 8 |
| src/core/TreeDecorator.ts | Domain model, shape/container contracts and registries | 7 | 0 |
| src/core/group.test.ts | Domain model, shape/container contracts and registries | 102 | 2 |
| src/core/shape-factory.test.ts | Domain model, shape/container contracts and registries | 109 | 2 |
| src/core/shapes.test.ts | Domain model, shape/container contracts and registries | 93 | 0 |
| src/index.ts | Runtime composition root | 55 | 3 |
| src/io/IdAutoAssigner.ts | SVG parsing, serialization and id assignment | 36 | 1 |
| src/io/SvgReader.ts | SVG parsing, serialization and id assignment | 176 | 58 |
| src/io/SvgWriter.ts | SVG parsing, serialization and id assignment | 85 | 7 |
| src/io/id-auto-assigner.test.ts | SVG parsing, serialization and id assignment | 36 | 0 |
| src/io/svg-reader.test.ts | SVG parsing, serialization and id assignment | 171 | 2 |
| src/io/svg-writer.test.ts | SVG parsing, serialization and id assignment | 121 | 0 |
| src/plugins/PluginHost.test.ts | Shape providers and optional Phase 2 plugin implementations | 53 | 0 |
| src/plugins/PluginHost.ts | Shape providers and optional Phase 2 plugin implementations | 137 | 53 |
| src/plugins/PluginLoader.test.ts | Shape providers and optional Phase 2 plugin implementations | 64 | 1 |
| src/plugins/PluginLoader.ts | Shape providers and optional Phase 2 plugin implementations | 93 | 42 |
| src/plugins/assembleA.ts | Shape providers and optional Phase 2 plugin implementations | 11 | 1 |
| src/plugins/assembly.test.ts | Shape providers and optional Phase 2 plugin implementations | 67 | 4 |
| src/plugins/box-tree/plugin.ts | Shape providers and optional Phase 2 plugin implementations | 13 | 1 |
| src/plugins/box/BoxAttributeHandler.ts | Shape providers and optional Phase 2 plugin implementations | 27 | 13 |
| src/plugins/box/BoxShape.ts | Shape providers and optional Phase 2 plugin implementations | 43 | 12 |
| src/plugins/box/box.test.ts | Shape providers and optional Phase 2 plugin implementations | 111 | 1 |
| src/plugins/box/index.ts | Shape providers and optional Phase 2 plugin implementations | 26 | 22 |
| src/plugins/box/plugin.ts | Shape providers and optional Phase 2 plugin implementations | 12 | 0 |
| src/plugins/commands/dir-plugin/plugin.ts | Shape providers and optional Phase 2 plugin implementations | 12 | 1 |
| src/plugins/commands/dir.ts | Shape providers and optional Phase 2 plugin implementations | 13 | 1 |
| src/plugins/commands/stats-plugin/plugin.ts | Shape providers and optional Phase 2 plugin implementations | 12 | 1 |
| src/plugins/commands/stats.ts | Shape providers and optional Phase 2 plugin implementations | 13 | 1 |
| src/plugins/shapes/builtin-providers.ts | Shape providers and optional Phase 2 plugin implementations | 71 | 23 |
| src/plugins/shapes/plugin.ts | Shape providers and optional Phase 2 plugin implementations | 8 | 1 |
| src/plugins/tree-star/plugin.ts | Shape providers and optional Phase 2 plugin implementations | 12 | 1 |
| src/smoke.test.ts | Other source and tests | 7 | 0 |

## Commit history

- 280a7d0 feat(vscode): add SVG Explorer decoration and nested Outline extension
- 3e27a6c feat(cli): add read-only stats and dir commands
- 9345022 feat(plugins): define shape and attribute extension contracts with box provider
- 4def294 feat(plugins): add plugin host, box and tree decorator modules
- 98a9298 feat(plugins): load enabled plugins from configuration
- 626d552 fix(box): recognize box groups during SVG import and protect ungroup
- 354c616 refactor(plugins): register stats and dir as optional command plugins
- 494e036 fix(plugins): validate manifests and rollback failed activations
- 65b32bb feat(tree): track saved baseline and decorate modified nodes
- 4c95190 fix(box): preserve required SVG children and reserve composite ids
- cc7dfd9 fix(box): preserve required SVG children and reserve composite ids
- 0356be1 refactor(shapes): move built-in shape implementations behind providers
- c56e4e1 feat(plugins): add code assembly A and box tree decorator
- a491d68 test(plugins): inject default shape providers into phase1 test fixtures
- b9fedf7 refactor(architecture): move tree decorator contract into kernel
- dafcba9 test(phase2): cover plugin rollback, box attributes, stats and dir
- 9c1d756 fix(box): validate SVG structure and complete attribute rollback
- dfe2299 fix(box): protect structural children from independent edits
- 1ae968c fix(commands): make attribute handler mementos transactional
- 1fd398c fix(box): block direct edits to required composite children
- a0c0211 test(core): wire phase1 suites to the default provider composition
- 0238733 docs(phase2): add extension architecture ADRs and generated metrics tooling
- 13e7481 fix(stats): count only g and box as containers
- cd0c5dc refactor(plugins): stage registrations before manifest validation
- 0ad10c8 refactor(plugins): extract config-based loader for A/B composition
- 202941a test(box): cover structural guards and saved-state decorator behavior
- 2d97374 test(plugins): compare A/B contribution graphs and CLI transcripts
- 2e3632a test(plugins): cover config loader error cases and activation rollback
- e700fc5 docs(phase2): align ADRs and metrics with staged plugin activation
- d99004e docs(metrics): include per-file responsibility inventory
- 9ab6cd0 feat(plugins): source contribution manifests from plugin package metadata
- 7d9b8ce test(plugins): compare package-manifest assembly with code assembly
- 5c08445 fix(tree): propagate modified state through the SVG root
- ec4455e fix(cli): load shape providers in REPL fixtures and preserve registry overwrite
- dfdedc4 fix(phase2): validate package metadata and archive metrics output
- 3aaa9fb fix(vscode): reject non-SVG and multiple-root outline documents
- ef29e4f docs(phase2): document package manifests and CI artifacts
