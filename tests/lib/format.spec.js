import { describe, it, expect } from "vitest";
import {
  MAX_LENGTH,
  NICKNAME_MAX,
  DEFAULT_NICKNAME,
  relativeTime,
  initialOf,
  hashHue,
  createId
} from "../../src/lib/format.js";

const NOW = new Date(2026, 10, 13, 12, 0, 0).getTime();

describe("format 常量", () => {
  it("动态上限 280 字、昵称上限 16 字、默认昵称为访客", () => {
    expect(MAX_LENGTH).toBe(280);
    expect(NICKNAME_MAX).toBe(16);
    expect(DEFAULT_NICKNAME).toBe("访客");
  });
});

describe("relativeTime", () => {
  it("一分钟内显示“刚刚”", () => {
    expect(relativeTime(NOW - 5 * 1000, NOW)).toBe("刚刚");
  });

  it("一小时内显示分钟", () => {
    expect(relativeTime(NOW - 5 * 60 * 1000, NOW)).toBe("5 分钟前");
  });

  it("一天内显示小时", () => {
    expect(relativeTime(NOW - 3 * 60 * 60 * 1000, NOW)).toBe("3 小时前");
  });

  it("同年更早显示月日", () => {
    expect(relativeTime(new Date(2026, 10, 10, 8, 0, 0).getTime(), NOW)).toBe("11月10日");
  });

  it("跨年显示完整年月日", () => {
    expect(relativeTime(new Date(2025, 0, 5, 8, 0, 0).getTime(), NOW)).toBe("2025年1月5日");
  });

  it("未来时间按“刚刚”处理", () => {
    expect(relativeTime(NOW + 60 * 1000, NOW)).toBe("刚刚");
  });
});

describe("initialOf", () => {
  it("取中文昵称首字", () => {
    expect(initialOf("夜航星")).toBe("夜");
  });

  it("英文昵称首字母大写", () => {
    expect(initialOf("alice")).toBe("A");
  });

  it("空昵称回退为“访”", () => {
    expect(initialOf("")).toBe("访");
    expect(initialOf("   ")).toBe("访");
  });
});

describe("hashHue", () => {
  it("同样输入得到同样色相，且在 0-359 之间", () => {
    const a = hashHue("post-1");
    const b = hashHue("post-1");
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(360);
  });
});

describe("createId", () => {
  it("生成不重复的字符串 id", () => {
    const ids = new Set(Array.from({ length: 50 }, () => createId()));
    expect(ids.size).toBe(50);
    ids.forEach((id) => expect(typeof id).toBe("string"));
  });
});
