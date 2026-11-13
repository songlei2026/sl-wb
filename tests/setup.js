import { beforeEach, afterEach } from "vitest";

/**
 * Node 26 默认暴露了实验性的全局 localStorage 占位符（无 --localstorage-file 时为
 * undefined），会遮蔽 jsdom 提供的实现。这里在测试环境注入一个符合 Storage 规范的
 * 内存实现，保证测试不依赖真实浏览器持久化，也能被 vi.spyOn(Storage.prototype) 拦截。
 */
class MemoryStorage {
  #map = new Map();

  get length() {
    return this.#map.size;
  }

  key(index) {
    return [...this.#map.keys()][index] ?? null;
  }

  getItem(key) {
    const name = String(key);
    return this.#map.has(name) ? this.#map.get(name) : null;
  }

  setItem(key, value) {
    this.#map.set(String(key), String(value));
  }

  removeItem(key) {
    this.#map.delete(String(key));
  }

  clear() {
    this.#map.clear();
  }
}

const memoryStorage = new MemoryStorage();

Object.defineProperty(globalThis, "Storage", {
  value: MemoryStorage,
  configurable: true,
  writable: true
});

Object.defineProperty(globalThis, "localStorage", {
  value: memoryStorage,
  configurable: true,
  writable: true
});

if (typeof window !== "undefined" && window !== globalThis) {
  Object.defineProperty(window, "localStorage", {
    value: memoryStorage,
    configurable: true,
    writable: true
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});
