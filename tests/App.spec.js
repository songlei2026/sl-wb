import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import App from "../src/App.vue";
import { STORAGE_KEYS } from "../src/lib/storage.js";

function mountApp() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(App, { global: { plugins: [pinia] }, attachTo: document.body });
}

async function setupNickname(wrapper, name = "夜航星") {
  await wrapper.get('[data-test="nickname-input"]').setValue(name);
  await wrapper.get('[data-test="save-nickname"]').trigger("click");
}

describe("App 集成", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("首次访问弹出昵称设置，保存后关闭并显示在顶栏", async () => {
    const wrapper = mountApp();
    expect(wrapper.find('[data-test="nickname-dialog"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="profile-chip"]').text()).toContain("设置昵称");

    await setupNickname(wrapper, "夜航星");

    expect(wrapper.find('[data-test="nickname-dialog"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="profile-chip"]').text()).toContain("夜航星");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.profile))).toEqual({
      nickname: "夜航星"
    });
    wrapper.unmount();
  });

  it("跳过昵称时使用访客身份", async () => {
    const wrapper = mountApp();
    await wrapper.get('[data-test="skip-nickname"]').trigger("click");
    expect(wrapper.get('[data-test="profile-chip"]').text()).toContain("访客");
    wrapper.unmount();
  });

  it("发布动态后立即出现在列表顶部并写入缓存", async () => {
    const wrapper = mountApp();
    await setupNickname(wrapper);
    expect(wrapper.find(".empty").exists()).toBe(true);

    await wrapper.get('[data-test="composer-input"]').setValue("第一条动态");
    await wrapper.get('[data-test="publish"]').trigger("click");

    const posts = wrapper.findAll(".post");
    expect(posts).toHaveLength(1);
    expect(posts[0].get(".post__content").text()).toBe("第一条动态");
    expect(posts[0].get(".post__author").text()).toBe("夜航星");
    expect(wrapper.find(".empty").exists()).toBe(false);

    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts));
    expect(saved).toHaveLength(1);
    expect(saved[0].content).toBe("第一条动态");
    wrapper.unmount();
  });

  it("点赞会更新计数、样式并持久化", async () => {
    const wrapper = mountApp();
    await setupNickname(wrapper);
    await wrapper.get('[data-test="composer-input"]').setValue("给我点个赞");
    await wrapper.get('[data-test="publish"]').trigger("click");

    const btn = wrapper.get(".like-btn");
    expect(btn.get(".like-btn__count").text()).toBe("0");

    await btn.trigger("click");

    const liked = wrapper.get(".like-btn");
    expect(liked.classes()).toContain("is-liked");
    expect(liked.attributes("aria-pressed")).toBe("true");
    expect(liked.get(".like-btn__count").text()).toBe("1");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts))[0].likes).toBe(1);
    wrapper.unmount();
  });

  it("已有缓存时直接渲染历史动态且不再弹昵称窗", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify({ nickname: "夜航星" })
    );
    window.localStorage.setItem(
      STORAGE_KEYS.posts,
      JSON.stringify([
        {
          id: "a",
          author: "夜航星",
          content: "更早的动态",
          createdAt: Date.now() - 3600 * 1000,
          likes: 2,
          liked: false
        },
        {
          id: "b",
          author: "夜航星",
          content: "更新的动态",
          createdAt: Date.now(),
          likes: 0,
          liked: false
        }
      ])
    );

    const wrapper = mountApp();
    expect(wrapper.find('[data-test="nickname-dialog"]').exists()).toBe(false);
    expect(wrapper.findAll(".post")).toHaveLength(2);
    expect(wrapper.findAll(".post__content")[0].text()).toBe("更新的动态");
    wrapper.unmount();
  });

  it("确认后清空本地数据并重新要求设置昵称", async () => {
    const wrapper = mountApp();
    await setupNickname(wrapper);
    await wrapper.get('[data-test="composer-input"]').setValue("待清空");
    await wrapper.get('[data-test="publish"]').trigger("click");
    expect(wrapper.findAll(".post")).toHaveLength(1);

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await wrapper.get('[data-test="clear-data"]').trigger("click");

    expect(wrapper.findAll(".post")).toHaveLength(0);
    expect(wrapper.find(".empty").exists()).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEYS.posts)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
    expect(wrapper.find('[data-test="nickname-dialog"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it("取消清空时数据保持不变", async () => {
    const wrapper = mountApp();
    await setupNickname(wrapper);
    await wrapper.get('[data-test="composer-input"]').setValue("保留我");
    await wrapper.get('[data-test="publish"]').trigger("click");

    vi.spyOn(window, "confirm").mockReturnValue(false);
    await wrapper.get('[data-test="clear-data"]').trigger("click");

    expect(wrapper.findAll(".post")).toHaveLength(1);
    wrapper.unmount();
  });
});
