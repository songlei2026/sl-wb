import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { usePostsStore } from "../../src/stores/posts.js";
import { STORAGE_KEYS } from "../../src/lib/storage.js";

function seed(posts) {
  window.localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
}

function makePost(overrides = {}) {
  return {
    id: "p1",
    author: "夜航星",
    content: "第一条动态",
    createdAt: 1000,
    likes: 0,
    liked: false,
    ...overrides
  };
}

describe("usePostsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("没有缓存时初始为空", () => {
    const store = usePostsStore();
    expect(store.posts).toEqual([]);
    expect(store.count).toBe(0);
  });

  it("从 Local Storage 恢复动态", () => {
    seed([makePost()]);
    const store = usePostsStore();
    expect(store.posts).toHaveLength(1);
    expect(store.posts[0].content).toBe("第一条动态");
  });

  it("过滤结构损坏的缓存条目", () => {
    seed([
      makePost(),
      { id: "bad" },
      { id: "ok", author: "A", content: "正常", createdAt: 2000 },
      "not-an-object"
    ]);
    const store = usePostsStore();
    expect(store.posts).toHaveLength(2);
    expect(store.posts.map((p) => p.id)).toEqual(expect.arrayContaining(["p1", "ok"]));
  });

  it("缓存 JSON 损坏时回退为空数组", () => {
    window.localStorage.setItem(STORAGE_KEYS.posts, "[[[");
    const store = usePostsStore();
    expect(store.posts).toEqual([]);
  });

  it("sortedPosts 按发布时间倒序", () => {
    seed([
      makePost({ id: "old", createdAt: 1000 }),
      makePost({ id: "new", createdAt: 3000 }),
      makePost({ id: "mid", createdAt: 2000 })
    ]);
    const store = usePostsStore();
    expect(store.sortedPosts.map((p) => p.id)).toEqual(["new", "mid", "old"]);
  });

  it("发布动态：去空格、置顶并持久化", () => {
    const store = usePostsStore();
    const result = store.publish({ content: "  你好 sl-wb  ", author: "夜航星" });

    expect(result.ok).toBe(true);
    expect(store.posts).toHaveLength(1);
    expect(store.posts[0]).toMatchObject({
      author: "夜航星",
      content: "你好 sl-wb",
      likes: 0,
      liked: false
    });
    expect(store.posts[0].createdAt).toBeTypeOf("number");
    expect(store.posts[0].id).toBeTruthy();

    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts));
    expect(saved).toHaveLength(1);
    expect(saved[0].content).toBe("你好 sl-wb");

    const second = store.publish({ content: "第二条", author: "夜航星" });
    expect(second.ok).toBe(true);
    expect(store.sortedPosts[0].content).toBe("第二条");
  });

  it("空内容拒绝发布且不写缓存", () => {
    const store = usePostsStore();
    const result = store.publish({ content: "   ", author: "夜航星" });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("empty");
    expect(store.posts).toEqual([]);
    expect(window.localStorage.getItem(STORAGE_KEYS.posts)).toBeNull();
  });

  it("缺少昵称时拒绝发布", () => {
    const store = usePostsStore();
    const result = store.publish({ content: "内容", author: "" });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("no-author");
    expect(store.posts).toEqual([]);
  });

  it("超长内容截断到 280 字", () => {
    const store = usePostsStore();
    store.publish({ content: "字".repeat(400), author: "夜航星" });
    expect(store.posts[0].content).toHaveLength(280);
  });

  it("点赞与取消点赞都会持久化", () => {
    seed([makePost()]);
    const store = usePostsStore();

    store.toggleLike("p1");
    expect(store.posts[0]).toMatchObject({ liked: true, likes: 1 });
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts))[0]).toMatchObject({
      liked: true,
      likes: 1
    });

    store.toggleLike("p1");
    expect(store.posts[0]).toMatchObject({ liked: false, likes: 0 });

    store.toggleLike("p1");
    store.toggleLike("p1");
    expect(store.posts[0]).toMatchObject({ liked: false, likes: 0 });
  });

  it("点赞数不会小于 0", () => {
    seed([makePost({ likes: 0, liked: true })]);
    const store = usePostsStore();
    store.toggleLike("p1");
    expect(store.posts[0].likes).toBe(0);
    expect(store.posts[0].liked).toBe(false);
  });

  it("忽略不存在的动态 id", () => {
    seed([makePost()]);
    const store = usePostsStore();
    expect(() => store.toggleLike("missing")).not.toThrow();
    expect(store.posts[0].likes).toBe(0);
  });

  it("clearAll 清空内存与缓存", () => {
    seed([makePost()]);
    const store = usePostsStore();

    store.clearAll();

    expect(store.posts).toEqual([]);
    expect(window.localStorage.getItem(STORAGE_KEYS.posts)).toBeNull();
  });

  it("reload 重新从缓存载入", () => {
    const store = usePostsStore();
    seed([makePost({ content: "外部写入" })]);
    store.reload();
    expect(store.posts[0].content).toBe("外部写入");
  });
});
