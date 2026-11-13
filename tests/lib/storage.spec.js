import { describe, it, expect, vi } from "vitest";
import {
  STORAGE_KEYS,
  isStorageAvailable,
  readJSON,
  writeJSON,
  removeKey,
  removeKeys
} from "../../src/lib/storage.js";

describe("storage", () => {
  it("在正常环境下可用", () => {
    expect(isStorageAvailable()).toBe(true);
  });

  it("读取不存在的 key 返回兜底值", () => {
    expect(readJSON("slwb.missing", [])).toEqual([]);
    expect(readJSON("slwb.missing", null)).toBeNull();
  });

  it("读取损坏的 JSON 时返回兜底值而不抛错", () => {
    window.localStorage.setItem("slwb.broken", "{not-json");
    expect(readJSON("slwb.broken", { safe: true })).toEqual({ safe: true });
  });

  it("写入后可以原样读回", () => {
    const value = { a: 1, list: [1, 2, 3] };
    expect(writeJSON("slwb.demo", value)).toBe(true);
    expect(readJSON("slwb.demo", null)).toEqual(value);
  });

  it("写入异常（如配额不足）时返回 false", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(writeJSON("slwb.demo", { a: 1 })).toBe(false);

    spy.mockRestore();
  });

  it("removeKey 删除单个键，removeKeys 删除多个键", () => {
    window.localStorage.setItem(STORAGE_KEYS.posts, "[]");
    window.localStorage.setItem(STORAGE_KEYS.profile, "{}");
    window.localStorage.setItem("slwb.other", "1");

    removeKey(STORAGE_KEYS.posts);
    expect(window.localStorage.getItem(STORAGE_KEYS.posts)).toBeNull();

    removeKeys([STORAGE_KEYS.profile, "slwb.other"]);
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
    expect(window.localStorage.getItem("slwb.other")).toBeNull();
  });

  it("暴露版本化的存储键", () => {
    expect(STORAGE_KEYS.posts).toBe("slwb.posts.v1");
    expect(STORAGE_KEYS.profile).toBe("slwb.profile.v1");
  });
});
