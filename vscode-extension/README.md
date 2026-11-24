# SVG Editor VS Code extension

This extension adds two editor-host integrations without modifying SVG files:

- Explorer decoration: SVG files receive the `[]` badge; filenames and file contents are untouched.
- Outline: a `DocumentSymbolProvider` exposes nested SVG elements. Labels use `tag#id` when an id exists and `tag` otherwise. Selecting a symbol navigates to its opening tag.

## Build and run

1. Open `vscode-extension/` in VS Code.
2. Run `npm install`, then `npm run compile`.
3. Press F5 to launch the Extension Development Host.
4. Open `examples/nested.svg`; inspect Explorer and the Outline view.

The provider rescans the in-memory text document whenever VS Code requests symbols after edits. Unclosed tags, mismatched closing tags, or incomplete comments clear the outline and do not throw.

## Host/plugin responsibilities

VS Code owns the Explorer, Outline tree, editor navigation, document lifecycle, and refresh scheduling. This extension contributes adapters through VS Code's `FileDecorationProvider` and `DocumentSymbolProvider` APIs; it does not own the SVG document model or rewrite source text.

The decoration provider is an Adapter over the host's file-decoration API: it maps the editor's SVG-file concept to the host's `FileDecoration` value. The outline provider is likewise an adapter from XML element structure to VS Code `DocumentSymbol` objects. This extension is independent of the Phase 1 CLI kernel; the CLI remains reusable without VS Code installed.
