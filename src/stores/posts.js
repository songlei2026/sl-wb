import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { MAX_LENGTH, createId, DEFAULT_NICKNAME } from "../lib/format.js";
import { STORAGE_KEYS, readJSON, writeJSON, removeKey } from "../lib/storage.js";

/**
 * 校验并规范化一条缓存数据，结构不合法则返回 null（丢弃）。
 */
export function normalizePost(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.id !== "string" || !raw.id) return null;
  if (typeof raw.content !== "string") return null;
  if (typeof raw.createdAt !== "number" || !Number.isFinite(raw.createdAt)) return null;

  const likes = Number.isFinite(raw.likes) && raw.likes > 0 ? Math.floor(raw.likes) : 0;

  return {
    id: raw.id,
    author: typeof raw.author === "string" && raw.author.trim() ? raw.author.trim() : DEFAULT_NICKNAME,
    content: raw.content,
    createdAt: raw.createdAt,
    likes,
    liked: raw.liked === true
  };
}

export const usePostsStore = defineStore("posts", () => {
  const posts = ref([]);

  function load() {
    const cached = readJSON(STORAGE_KEYS.posts, []);
    posts.value = Array.isArray(cached) ? cached.map(normalizePost).filter(Boolean) : [];
    return posts.value;
  }

  function persist() {
    return writeJSON(STORAGE_KEYS.posts, posts.value);
  }

  const sortedPosts = computed(() =>
    [...posts.value].sort((a, b) => b.createdAt - a.createdAt)
  );

  const count = computed(() => posts.value.length);

  function publish({ content, author } = {}) {
    const text = String(content ?? "").trim();
    const name = String(author ?? "").trim();

    if (!text) return { ok: false, error: "empty" };
    if (!name) return { ok: false, error: "no-author" };

    const post = {
      id: createId(),
      author: name,
      content: text.slice(0, MAX_LENGTH),
      createdAt: Date.now(),
      likes: 0,
      liked: false
    };

    posts.value = [post, ...posts.value];
    const saved = persist();

    return { ok: true, post, saved };
  }

  function toggleLike(id) {
    const target = posts.value.find((post) => post.id === id);
    if (!target) return { ok: false };

    target.liked = !target.liked;
    target.likes = Math.max(0, target.likes + (target.liked ? 1 : -1));
    const saved = persist();

    return { ok: true, liked: target.liked, likes: target.likes, saved };
  }

  function clearAll() {
    posts.value = [];
    removeKey(STORAGE_KEYS.posts);
    return true;
  }

  function reload() {
    return load();
  }

  load();

  return { posts, sortedPosts, count, publish, toggleLike, clearAll, reload };
});
