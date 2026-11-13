<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { MAX_LENGTH, initialOf } from "../lib/format.js";

const props = defineProps({
  nickname: { type: String, default: "" }
});

const emit = defineEmits(["publish"]);

const draft = ref("");
const textarea = ref(null);

const length = computed(() => draft.value.length);
const canPublish = computed(() => draft.value.trim().length > 0);
const avatar = computed(() => initialOf(props.nickname));
const ratio = computed(() => Math.min(length.value / MAX_LENGTH, 1));
const counterState = computed(() => {
  if (length.value > MAX_LENGTH * 0.9) return "over";
  if (length.value > MAX_LENGTH * 0.7) return "low";
  return "idle";
});

const ringStyle = computed(() => ({
  strokeDasharray: `${97.4}`,
  strokeDashoffset: `${97.4 * (1 - ratio.value)}`
}));

function autoGrow() {
  const node = textarea.value;
  if (!node) return;
  node.style.height = "auto";
  node.style.height = `${Math.min(node.scrollHeight, 220)}px`;
}

watch(draft, () => nextTick(autoGrow));

function submit() {
  const text = draft.value.trim();
  if (!text) return;

  emit("publish", text);
  draft.value = "";
  nextTick(() => {
    autoGrow();
    textarea.value?.focus();
  });
}

function onKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    submit();
  }
}
</script>

<template>
  <section class="composer card" aria-labelledby="composer-title">
    <h2 id="composer-title" class="sr-only">发布新动态</h2>

    <div class="composer__row">
      <span class="avatar avatar--self composer__avatar" aria-hidden="true">{{ avatar }}</span>
      <div class="composer__field">
        <label class="sr-only" for="composer-input">动态内容</label>
        <textarea
          id="composer-input"
          ref="textarea"
          v-model="draft"
          class="composer__input"
          data-test="composer-input"
          :maxlength="MAX_LENGTH"
          placeholder="有什么想分享的？"
          rows="1"
          aria-describedby="composer-hint"
          @keydown="onKeydown"
        ></textarea>
        <p id="composer-hint" class="composer__hint">按 Ctrl / ⌘ + Enter 快速发布</p>
      </div>
    </div>

    <div class="composer__foot">
      <div class="counter" :data-state="counterState">
        <svg class="counter__ring" viewBox="0 0 36 36" aria-hidden="true">
          <circle class="counter__track" cx="18" cy="18" r="15.5"></circle>
          <circle class="counter__bar" cx="18" cy="18" r="15.5" :style="ringStyle"></circle>
        </svg>
        <span class="counter__num" data-test="counter">{{ length }}</span>
        <span class="sr-only">/ {{ MAX_LENGTH }} 字</span>
      </div>

      <button
        type="button"
        class="btn btn--primary"
        data-test="publish"
        :disabled="!canPublish"
        @click="submit"
      >
        <span>发布</span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  </section>
</template>
