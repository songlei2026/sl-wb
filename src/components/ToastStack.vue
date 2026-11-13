<script setup>
import { useToastStore } from "../stores/toast.js";

const toast = useToastStore();
</script>

<template>
  <div class="toast-stack" role="status" aria-live="polite">
    <div
      v-for="item in toast.items"
      :key="item.id"
      class="toast"
      :class="{ 'toast--error': item.type === 'error' }"
    >
      {{ item.message }}
    </div>
  </div>
</template>
