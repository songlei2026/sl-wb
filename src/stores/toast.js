import { ref } from "vue";
import { defineStore } from "pinia";

const DEFAULT_DURATION = 2400;

export const useToastStore = defineStore("toast", () => {
  const items = ref([]);
  const timers = new Map();
  let seq = 0;

  function dismiss(id) {
    const timer = timers.get(id);
    if (timer) clearTimeout(timer);
    timers.delete(id);
    items.value = items.value.filter((item) => item.id !== id);
  }

  function show(message, type = "success", duration = DEFAULT_DURATION) {
    const id = (seq += 1);
    items.value = [...items.value, { id, message, type }];
    timers.set(
      id,
      setTimeout(() => dismiss(id), duration)
    );
    return id;
  }

  function disposeAll() {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    items.value = [];
  }

  return { items, show, dismiss, disposeAll };
});
