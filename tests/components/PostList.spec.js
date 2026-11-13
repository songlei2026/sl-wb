import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PostList from "../../src/components/PostList.vue";

const posts = [
  { id: "a", author: "A", content: "第一条", createdAt: 2000, likes: 0, liked: false },
  { id: "b", author: "B", content: "第二条", createdAt: 1000, likes: 1, liked: true }
];

describe("PostList", () => {
  it("无动态时展示空状态引导", () => {
    const wrapper = mount(PostList, { props: { posts: [] } });
    const empty = wrapper.get(".empty");
    expect(empty.text()).toContain("还没有动态");
    expect(wrapper.findAll(".post")).toHaveLength(0);
  });

  it("渲染动态条数与计数文案", () => {
    const wrapper = mount(PostList, { props: { posts } });
    expect(wrapper.findAll(".post")).toHaveLength(2);
    expect(wrapper.find(".empty").exists()).toBe(false);
    expect(wrapper.get(".feed__count").text()).toBe("2 条");
  });

  it("动态按传入顺序渲染", () => {
    const wrapper = mount(PostList, { props: { posts } });
    const authors = wrapper.findAll(".post__author").map((node) => node.text());
    expect(authors).toEqual(["A", "B"]);
  });

  it("向上转发点赞事件", async () => {
    const wrapper = mount(PostList, { props: { posts } });
    await wrapper.findAll(".like-btn")[1].trigger("click");
    expect(wrapper.emitted("like")).toHaveLength(1);
    expect(wrapper.emitted("like")[0]).toEqual(["b"]);
  });
});
