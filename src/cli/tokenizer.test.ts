import { describe, it, expect } from "vitest";
import { tokenize } from "./Tokenizer";

describe("Tokenizer — 空与注释", () => {
  it("空字符串 → 空数组", () => {
    expect(tokenize("")).toEqual({ tokens: [] });
  });

  it("纯空白 → 空数组", () => {
    expect(tokenize("   \t  ")).toEqual({ tokens: [] });
  });

  it("行首 # → 整行注释", () => {
    expect(tokenize("# this is a comment")).toEqual({ tokens: [] });
  });

  it("前导空白后 # → 整行注释", () => {
    expect(tokenize("   # comment")).toEqual({ tokens: [] });
  });
});

describe("Tokenizer — 普通分词", () => {
  it("单 token", () => {
    expect(tokenize("help")).toEqual({ tokens: ["help"] });
  });

  it("多 token 空格分隔", () => {
    expect(tokenize("create rect r1")).toEqual({ tokens: ["create", "rect", "r1"] });
  });

  it("连续空格也正确", () => {
    expect(tokenize("  create    rect   r1  ")).toEqual({
      tokens: ["create", "rect", "r1"],
    });
  });

  it("颜色 #hex 不是注释", () => {
    expect(tokenize("create rect r1 0 0 10 10 #4a90d9")).toEqual({
      tokens: ["create", "rect", "r1", "0", "0", "10", "10", "#4a90d9"],
    });
  });

  it("tab 也当空白", () => {
    expect(tokenize("a\tb\tc")).toEqual({ tokens: ["a", "b", "c"] });
  });
});

describe("Tokenizer — 双引号", () => {
  it("引号包裹带空格", () => {
    expect(tokenize('create text t1 20 40 "hello world"')).toEqual({
      tokens: ["create", "text", "t1", "20", "40", "hello world"],
    });
  });

  it("空字符串作为独立 token", () => {
    expect(tokenize('set t1 text ""')).toEqual({ tokens: ["set", "t1", "text", ""] });
  });

  it("引号内 # 是普通字符", () => {
    expect(tokenize('set r1 fill "#4a90d9"')).toEqual({
      tokens: ["set", "r1", "fill", "#4a90d9"],
    });
  });

  it("引号内含 tab", () => {
    expect(tokenize('set t1 text "a\tb"')).toEqual({
      tokens: ["set", "t1", "text", "a\tb"],
    });
  });

  it("未闭合引号 → error", () => {
    const r = tokenize('set t1 text "abc');
    expect(r.tokens).toEqual([]);
    expect(r.error).toBe("unterminated double quote");
  });

  it("引号后紧接 token（不合法输入的宽容处理）", () => {
    // "ab"cd → token1="ab", token2="cd"（引号只包裹紧邻内容，之后视为下一个 token）
    expect(tokenize('"ab"cd').tokens).toEqual(["ab", "cd"]);
  });
});

describe("Tokenizer — 典型命令行", () => {
  it("create with in 子句", () => {
    expect(tokenize("create rect r1 10 20 100 50 #eee in g1")).toEqual({
      tokens: ["create", "rect", "r1", "10", "20", "100", "50", "#eee", "in", "g1"],
    });
  });

  it("中文内容", () => {
    expect(tokenize('create text t1 155 135 "开始"')).toEqual({
      tokens: ["create", "text", "t1", "155", "135", "开始"],
    });
  });

  it("text 内容为 'in' 时也要用引号", () => {
    expect(tokenize('create text t1 0 0 "in"')).toEqual({
      tokens: ["create", "text", "t1", "0", "0", "in"],
    });
  });
});