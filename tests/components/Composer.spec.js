import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Composer from "../../src/components/Composer.vue";

function mountComposer(props = {}) {
  return mount(Composer, { props: { nickname: "夜航星", ...props } });
}

describe("Composer", () => {
  it("内容为空时发布按钮禁用", () => {
    const wrapper = mountComposer();
    expect(wrapper.get('[data-test="publish"]').attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-test="counter"]').text()).toBe("0");
  });

  it("只输入空格时仍不可发布", async () => {
    const wrapper = mountComposer();
    await wrapper.get('[data-test="composer-input"]').setValue("    ");
    expect(wrapper.get('[data-test="publish"]').attributes("disabled")).toBeDefined();
  });

  it("输入后启用按钮并实时更新字数", async () => {
    const wrapper = mountComposer();
    await wrapper.get('[data-test="composer-input"]').setValue("你好");
    expect(wrapper.get('[data-test="publish"]').attributes("disabled")).toBeUndefined();
    expect(wrapper.get('[data-test="counter"]').text()).toBe("2");
  });

  it("点击发布时向上抛出裁剪后的内容并清空输入", async () => {
    const wrapper = mountComposer();
    const input = wrapper.get('[data-test="composer-input"]');
    await input.setValue("  今天也要写代码  ");
    await wrapper.get('[data-test="publish"]').trigger("click");

    expect(wrapper.emitted("publish")).toHaveLength(1);
    expect(wrapper.emitted("publish")[0]).toEqual(["今天也要写代码"]);
    expect(input.element.value).toBe("");
    expect(wrapper.get('[data-test="counter"]').text()).toBe("0");
  });

  it("Ctrl + Enter 快捷发布", async () => {
    const wrapper = mountComposer();
    const input = wrapper.get('[data-test="composer-input"]');
    await input.setValue("快捷键发布");
    await input.trigger("keydown", { key: "Enter", ctrlKey: true });

    expect(wrapper.emitted("publish")).toHaveLength(1);
    expect(wrapper.emitted("publish")[0]).toEqual(["快捷键发布"]);
  });

  it("输入框限制 280 字并展示当前昵称头像", () => {
    const wrapper = mountComposer();
    expect(wrapper.get('[data-test="composer-input"]').attributes("maxlength")).toBe("280");
    expect(wrapper.get(".composer__avatar").text()).toBe("夜");
  });
});
