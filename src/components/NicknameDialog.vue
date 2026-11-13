<script setup>
import { nextTick, ref, watch } from "vue";
import { NICKNAME_MAX } from "../lib/format.js";

const props = defineProps({
  open: { type: Boolean, default: false },
  initial: { type: String, default: "" }
});

const emit = defineEmits(["save", "skip", "close"]);

const draft = ref("");
const error = ref(false);
const input = ref(null);

watch(
  () => [props.open, props.initial],
  async ([open, initial]) => {
    error.value = false;
    if (!open) return;

    draft.value = initial || "";
    await nextTick();
    input.value?.focus();
    input.value?.select();
  },
  { immediate: true }
);

function submit() {
  const name = draft.value.trim();
  if (!name) {
    error.value = true;
    input.value?.focus();
    return;
  }
  error.value = false;
  emit("save", name);
}
</script>

<template>
  <div v-if="open" class="dialog" data-test="nickname-dialog">
    <div class="dialog__scrim" @click="$emit('close')"></div>

    <div
      class="dialog__panel card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nickname-dialog-title"
    >
      <div class="dialog__glow" aria-hidden="true"></div>
      <h2 id="nickname-dialog-title" class="dialog__title">给自己起个名字</h2>
      <p class="dialog__desc">昵称只保存在本地，用于给动态署名。</p>

      <label class="field-label" for="nickname-input">昵称</label>
      <input
        id="nickname-input"
        ref="input"
        v-model="draft"
        class="text-input"
        type="text"
        data-test="nickname-input"
        :maxlength="NICKNAME_MAX"
        autocomplete="nickname"
        placeholder="例如：夜航星"
        @input="error = false"
        @keydown.enter.prevent="submit"
      />
      <p v-if="error" class="dialog__error" data-test="nickname-error" role="alert">
        昵称不能为空
      </p>

      <div class="dialog__actions">
        <button type="button" class="btn btn--ghost" data-test="skip-nickname" @click="$emit('skip')">
          跳过，用访客
        </button>
        <button type="button" class="btn btn--primary" data-test="save-nickname" @click="submit">
          保存
        </button>
      </div>
    </div>
  </div>
</template>
