import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useProfileStore } from "../../src/stores/profile.js";
import { STORAGE_KEYS } from "../../src/lib/storage.js";

describe("useProfileStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("没有缓存时昵称为空且 hasNickname 为 false", () => {
    const store = useProfileStore();
    expect(store.nickname).toBe("");
    expect(store.hasNickname).toBe(false);
    expect(store.avatarText).toBe("访");
  });

  it("从 Local Storage 恢复昵称", () => {
    window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({ nickname: "夜航星" }));
    const store = useProfileStore();
    expect(store.nickname).toBe("夜航星");
    expect(store.hasNickname).toBe(true);
    expect(store.avatarText).toBe("夜");
  });

  it("缓存损坏时回退为空昵称", () => {
    window.localStorage.setItem(STORAGE_KEYS.profile, "{oops");
    const store = useProfileStore();
    expect(store.nickname).toBe("");
  });

  it("setNickname 去空格、限长并持久化", () => {
    const store = useProfileStore();
    expect(store.setNickname("  夜航星  ")).toBe(true);
    expect(store.nickname).toBe("夜航星");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.profile))).toEqual({
      nickname: "夜航星"
    });

    expect(store.setNickname("x".repeat(40))).toBe(true);
    expect(store.nickname).toHaveLength(16);
  });

  it("setNickname 拒绝空值且不写缓存", () => {
    const store = useProfileStore();
    expect(store.setNickname("   ")).toBe(false);
    expect(store.nickname).toBe("");
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
  });

  it("skip 使用默认昵称访客", () => {
    const store = useProfileStore();
    expect(store.skip()).toBe(true);
    expect(store.nickname).toBe("访客");
    expect(store.hasNickname).toBe(true);
  });

  it("clear 清空昵称与缓存", () => {
    const store = useProfileStore();
    store.setNickname("夜航星");
    store.clear();
    expect(store.nickname).toBe("");
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
  });
});
