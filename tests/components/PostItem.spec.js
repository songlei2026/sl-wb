import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PostItem from "../../src/components/PostItem.vue";

const NOW = new Date(2026, 10, 13, 12, 0, 0).getTime();

function makePost(overrides = {}) {
  return {
    id: "post-1",
    author: "夜航星",
    content: "第一条动态\n第二行",
    createdAt: NOW - 5 * 60 * 1000,
    likes: 3,
    liked: false,
    ...overrides
  };
}

describe("PostItem", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("渲染作者、正文与相对时间", () => {
    const wrapper = mount(PostItem, { props: { post: makePost() } });
    expect(wrapper.get(".post__author").text()).toBe("夜航星");
    expect(wrapper.get(".post__content").text()).toContain("第一条动态");
    expect(wrapper.get(".post__time").text()).toBe("5 分钟前");
    expect(wrapper.get(".post__avatar").text()).toBe("夜");
  });

  it("未点赞时展示空心状态与计数", () => {
    const wrapper = mount(PostItem, { props: { post: makePost() } });
    const btn = wrapper.get(".like-btn");
    expect(btn.attributes("aria-pressed")).toBe("false");
    expect(btn.classes()).not.toContain("is-liked");
    expect(btn.get(".like-btn__count").text()).toBe("3");
  });

  it("已点赞时高亮并标记 aria-pressed", () => {
    const wrapper = mount(PostItem, { props: { post: makePost({ liked: true, likes: 4 }) } });
    const btn = wrapper.get(".like-btn");
    expect(btn.attributes("aria-pressed")).toBe("true");
    expect(btn.classes()).toContain("is-liked");
    expect(btn.get(".like-btn__count").text()).toBe("4");
  });

  it("点击点赞按钮抛出动态 id", async () => {
    const wrapper = mount(PostItem, { props: { post: makePost() } });
    await wrapper.get(".like-btn").trigger("click");
    expect(wrapper.emitted("like")).toHaveLength(1);
    expect(wrapper.emitted("like")[0]).toEqual(["post-1"]);
  });

  it("个性化头像底色依据 id 稳定生成", () => {
    const a = mount(PostItem, { props: { post: makePost() } });
    const b = mount(PostItem, { props: { post: makePost() } });
    expect(a.get(".post__avatar").attributes("style")).toBe(
      b.get(".post__avatar").attributes("style")
    );
  });
});
