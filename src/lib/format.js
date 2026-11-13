export const MAX_LENGTH = 280;
export const NICKNAME_MAX = 16;
export const DEFAULT_NICKNAME = "访客";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * 把时间戳格式化成中文相对时间。
 */
export function relativeTime(timestamp, now = Date.now()) {
  const diff = Math.max(0, now - timestamp);

  if (diff < MINUTE) return "刚刚";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} 分钟前`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} 小时前`;

  const target = new Date(timestamp);
  const current = new Date(now);
  const monthDay = `${target.getMonth() + 1}月${target.getDate()}日`;

  return target.getFullYear() === current.getFullYear()
    ? monthDay
    : `${target.getFullYear()}年${monthDay}`;
}

/**
 * 取昵称首字作为头像文案，中文取首字、英文取大写首字母。
 */
export function initialOf(name) {
  const text = String(name ?? "").trim();
  if (!text) return "访";
  return Array.from(text)[0].toUpperCase();
}

/**
 * 由 id 派生稳定的色相，用于生成个性化头像底色。
 */
export function hashHue(seed) {
  const text = String(seed ?? "");

  // FNV-1a + 位混淆，保证相邻 id 也能得到差异明显的色相
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0x5bd1e995);
  hash ^= hash >>> 15;

  return Math.abs(hash >>> 0) % 360;
}

export function createId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
