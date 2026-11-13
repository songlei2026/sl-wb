import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import NicknameDialog from "../../src/components/NicknameDialog.vue";

function mountDialog(props = {}) {
  return mount(NicknameDialog, {
    props: { open: true, initial: "", ...props },
    attachTo: document.body
  });
}

describe("NicknameDialog", () => {
  it("open 为 false 时不渲染对话框", () => {
    const wrapper = mountDialog({ open: false });
    expect(wrapper.find('[data-test="nickname-dialog"]').exists()).toBe(false);
  });

  it("open 为 true 时渲染输入框并回填已有昵称", () => {
    const wrapper = mountDialog({ initial: "夜航星" });
    const input = wrapper.get('[data-test="nickname-input"]');
    expect(wrapper.get('[data-test="nickname-dialog"]').exists()).toBe(true);
    expect(input.element.value).toBe("夜航星");
    expect(input.attributes("maxlength")).toBe("16");
    wrapper.unmount();
  });

  it("空昵称提交时提示错误且不抛出事件", async () => {
    const wrapper = mountDialog();
    await wrapper.get('[data-test="nickname-input"]').setValue("   ");
    await wrapper.get('[data-test="save-nickname"]').trigger("click");

    expect(wrapper.emitted("save")).toBeUndefined();
    expect(wrapper.get('[data-test="nickname-error"]').isVisible()).toBe(true);
    wrapper.unmount();
  });

  it("保存时抛出裁剪后的昵称", async () => {
    const wrapper = mountDialog();
    await wrapper.get('[data-test="nickname-input"]').setValue("  夜航星  ");
    await wrapper.get('[data-test="save-nickname"]').trigger("click");

    expect(wrapper.emitted("save")[0]).toEqual(["夜航星"]);
    wrapper.unmount();
  });

  it("回车可提交，跳过按钮抛出 skip", async () => {
    const wrapper = mountDialog();
    const input = wrapper.get('[data-test="nickname-input"]');
    await input.setValue("夜航星");
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("save")[0]).toEqual(["夜航星"]);

    await wrapper.get('[data-test="skip-nickname"]').trigger("click");
    expect(wrapper.emitted("skip")).toHaveLength(1);
    wrapper.unmount();
  });
});
