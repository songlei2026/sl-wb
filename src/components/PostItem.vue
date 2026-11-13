<script setup>
import { computed } from "vue";
import { hashHue, initialOf, relativeTime } from "../lib/format.js";

const props = defineProps({
  post: { type: Object, required: true },
  highlight: { type: Boolean, default: false }
});

defineEmits(["like"]);

const avatarText = computed(() => initialOf(props.post.author));

const avatarStyle = computed(() => {
  const hue = hashHue(props.post.id);
  return {
    background: `linear-gradient(140deg, hsl(${hue}, 78%, 62%), hsl(${(hue + 48) % 360}, 72%, 52%))`
  };
});

const timeText = computed(() => relativeTime(props.post.createdAt));
const createdAtISO = computed(() => new Date(props.post.createdAt).toISOString());
const createdAtFull = computed(() => new Date(props.post.createdAt).toLocaleString("zh-CN"));
const likeLabel = computed(
  () => `${props.post.liked ? "取消点赞" : "点赞"}，当前 ${props.post.likes} 个赞`
);
</script>

<template>
  <li class="post" :class="{ 'post--new': highlight }">
    <span class="post__avatar" :style="avatarStyle" aria-hidden="true">{{ avatarText }}</span>

    <div class="post__main">
      <div class="post__head">
        <span class="post__author">{{ post.author }}</span>
        <time class="post__time" :datetime="createdAtISO" :title="createdAtFull">{{ timeText }}</time>
      </div>

      <p class="post__content">{{ post.content }}</p>

      <div class="post__actions">
        <button
          type="button"
          class="like-btn"
          :class="{ 'is-liked': post.liked }"
          :aria-pressed="post.liked ? 'true' : 'false'"
          :aria-label="likeLabel"
          @click="$emit('like', post.id)"
        >
          <span class="like-btn__icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 20.3l-1.5-1.4C5.9 14.8 3 12.2 3 8.9A4.9 4.9 0 0 1 7.9 4c1.6 0 3.1.8 4.1 2 1-1.2 2.5-2 4.1-2A4.9 4.9 0 0 1 21 8.9c0 3.3-2.9 5.9-7.5 10z"
              />
            </svg>
          </span>
          <span class="like-btn__count">{{ post.likes }}</span>
        </button>
      </div>
    </div>
  </li>
</template>
