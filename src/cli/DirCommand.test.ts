import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { DirCommand } from "./DirCommand";
import { DirectoryAdapter, NodeDirectoryAdapter } from "./DirectoryAdapter";
import { EditorContext } from "../commands/EditorContext";

describe("dir command", () => {
  it("sorts directories before files, includes hidden files, and excludes special entries", () => {
    const adapter: DirectoryAdapter = {
      cwd: () => "/work",
      list: () => [
        { name: "z.txt", isDirectory: false, isFile: true },
        { name: ".cache", isDirectory: true, isFile: false },
        { name: ".hidden", isDirectory: false, isFile: true },
        { name: "socket", isDirectory: false, isFile: false },
      ],
    };
    const result = new DirCommand(adapter).execute(new EditorContext());
    expect(result.lines).toEqual(["[DIR]  .cache", "[FILE]  .hidden", "[FILE]  z.txt"]);
  });

  it("reports an empty directory", () => {
    const adapter: DirectoryAdapter = { cwd: () => "/empty", list: () => [] };
    expect(new DirCommand(adapter).execute(new EditorContext()).lines).toEqual(["(empty directory)"]);
  });

  it("uses the real filesystem adapter against a temporary directory", () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "svg-editor-dir-"));
    try {
      fs.mkdirSync(path.join(temp, "folder"));
      fs.writeFileSync(path.join(temp, ".hidden"), "");
      fs.writeFileSync(path.join(temp, "z.txt"), "");
      const real = new NodeDirectoryAdapter();
      const adapter: DirectoryAdapter = { cwd: () => temp, list: p => real.list(p) };
      expect(new DirCommand(adapter).execute(new EditorContext()).lines).toEqual([
        "[DIR]  folder", "[FILE]  .hidden", "[FILE]  z.txt",
      ]);
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });

  it("returns a stable error when the adapter cannot read", () => {
    const adapter: DirectoryAdapter = { cwd: () => "/missing", list: () => { throw new Error("denied"); } };
    expect(new DirCommand(adapter).execute(new EditorContext()).error).toBe("cannot read directory: /missing");
  });
});
