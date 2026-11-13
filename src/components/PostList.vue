<script setup>
import PostItem from "./PostItem.vue";

defineProps({
  posts: { type: Array, default: () => [] },
  highlightId: { type: String, default: null }
});

defineEmits(["like"]);
</script>

<template>
  <section class="feed" aria-labelledby="feed-title">
    <div class="feed__head">
      <h2 id="feed-title">最新动态</h2>
      <span class="feed__count">{{ posts.length }} 条</span>
    </div>

    <ul v-if="posts.length" class="post-list" aria-live="polite">
      <PostItem
        v-for="post in posts"
        :key="post.id"
        :post="post"
        :highlight="post.id === highlightId"
        @like="$emit('like', $event)"
      />
    </ul>

    <div v-else class="empty">
      <div class="empty__icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-3.9-.8L3 21l1.9-5a8.3 8.3 0 0 1-.9-3.8 8.4 8.4 0 0 1 8.5-8.4 8.4 8.4 0 0 1 8.5 8.4z"
          />
        </svg>
      </div>
      <p class="empty__title">还没有动态</p>
      <p class="empty__text">写下第一条想法，它会保存在这台设备的浏览器中。</p>
    </div>
  </section>
</template>
