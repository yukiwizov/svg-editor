import { describe, it, expect } from "vitest";
import { IdAutoAssigner } from "./IdAutoAssigner";

describe("IdAutoAssigner", () => {
  it("has / reserve", () => {
    const a = new IdAutoAssigner(["r1"]);
    expect(a.has("r1")).toBe(true);
    expect(a.has("r2")).toBe(false);
    a.reserve("r2");
    expect(a.has("r2")).toBe(true);
  });

  it("generate 从 1 开始，跳过已占用", () => {
    const a = new IdAutoAssigner(["rect1"]);
    expect(a.generate("rect")).toBe("rect2");
    expect(a.generate("rect")).toBe("rect3");
  });

  it("不同 tag 的序号独立", () => {
    const a = new IdAutoAssigner();
    expect(a.generate("rect")).toBe("rect1");
    expect(a.generate("circle")).toBe("circle1");
    expect(a.generate("rect")).toBe("rect2");
  });

  it("generate 产的 id 后续被认为已占用", () => {
    const a = new IdAutoAssigner();
    const id = a.generate("rect");
    expect(a.has(id)).toBe(true);
  });

  it("空构造也能工作", () => {
    const a = new IdAutoAssigner();
    expect(a.generate("g")).toBe("g1");
  });
});