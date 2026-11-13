import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { DEFAULT_NICKNAME, NICKNAME_MAX, initialOf } from "../lib/format.js";
import { STORAGE_KEYS, readJSON, writeJSON, removeKey } from "../lib/storage.js";

export const useProfileStore = defineStore("profile", () => {
  const nickname = ref("");

  function load() {
    const cached = readJSON(STORAGE_KEYS.profile, null);
    const raw = cached && typeof cached.nickname === "string" ? cached.nickname : "";
    nickname.value = raw.trim().slice(0, NICKNAME_MAX);
    return nickname.value;
  }

  const hasNickname = computed(() => nickname.value.length > 0);
  const avatarText = computed(() => initialOf(nickname.value));

  function setNickname(raw) {
    const name = String(raw ?? "").trim().slice(0, NICKNAME_MAX);
    if (!name) return false;

    nickname.value = name;
    writeJSON(STORAGE_KEYS.profile, { nickname: name });
    return true;
  }

  function skip() {
    return setNickname(DEFAULT_NICKNAME);
  }

  function clear() {
    nickname.value = "";
    removeKey(STORAGE_KEYS.profile);
  }

  load();

  return { nickname, hasNickname, avatarText, setNickname, skip, clear, reload: load };
});
