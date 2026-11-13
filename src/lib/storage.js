/**
 * Local Storage 安全封装：任何读写异常都不会抛出，调用方拿到明确的布尔结果或兜底值。
 */
export const STORAGE_KEYS = {
  posts: "slwb.posts.v1",
  profile: "slwb.profile.v1"
};

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isStorageAvailable() {
  const storage = getStorage();
  if (!storage) return false;

  const probe = "__slwb_probe__";
  try {
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readJSON(key, fallback = null) {
  const storage = getStorage();
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key) {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function removeKeys(keys) {
  return keys.filter((key) => removeKey(key)).length === keys.length;
}
